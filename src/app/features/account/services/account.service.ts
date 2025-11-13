import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AccountSummary, ClientProfile, AliasChange, PasswordChange } from '../models/account.interface';
import { Card } from '../models/card.interface';

@Injectable({
    providedIn: 'root'
})
export class AccountService {
    private readonly API_URL = 'http://localhost:8080';
    private http = inject(HttpClient);

    // Signals opcionales para UI reactiva
    accountSummary = signal<AccountSummary | null>(null);

    /**
     * Obtener balance de la cuenta
     */
    async getBalance(): Promise<{ balance: number }> {
        return await firstValueFrom(this.http.get<{ balance: number }>(`${this.API_URL}/accountClient/balance`));
    }

    /**
     * Obtener alias de la cuenta
     */
    async getAlias(): Promise<string> {
        return await firstValueFrom(this.http.get<string>(`${this.API_URL}/accountClient/alias`));
    }

    /**
     * Cambiar alias de la cuenta
     */
    async changeAlias(aliasData: AliasChange): Promise<string> {
        return await firstValueFrom(this.http.patch(`${this.API_URL}/accountClient/alias`, aliasData, { responseType: 'text' }));
    }

    /**
     * Obtener resumen de la cuenta
     */
    async loadAccountSummary(): Promise<void> {
        try {
            const data = await firstValueFrom(this.http.get<AccountSummary>(`${this.API_URL}/accountClient/summary`));
            this.accountSummary.set(data);
        } catch (error) {
            console.error('Error loading account summary:', error);
            // Mantener el valor null en caso de error
            this.accountSummary.set(null);
        }
    }

    /**
     * Obtener perfil del cliente
     */
    async getClientProfile(): Promise<ClientProfile> {
        return await firstValueFrom(this.http.get<ClientProfile>(`${this.API_URL}/client/profile`));
    }

    /**
     * Actualizar perfil del cliente
     */
    async updateProfile(profileData: Partial<ClientProfile>): Promise<ClientProfile> {
        // Backend responde texto en PUT /client/profile, no JSON.
        await firstValueFrom(this.http.put(`${this.API_URL}/client/profile`, profileData, { responseType: 'text' }));
        // Luego traemos el perfil actualizado para devolver el objeto consistente
        return await this.getClientProfile();
    }

    /**
     * Cambiar contraseña
     */
    async changePassword(passwordData: PasswordChange): Promise<void> {
        // Backend responde texto en PUT /client/change-password, forzamos responseType 'text' para evitar error de parseo.
        await firstValueFrom(this.http.put(`${this.API_URL}/client/change-password`, passwordData, { responseType: 'text' }));
    }

    /**
     * Obtener tarjeta del cliente
     */
    async getMyCard(): Promise<Card> {
        return await firstValueFrom(this.http.get<Card>(`${this.API_URL}/cards/my-card`));
    }
}