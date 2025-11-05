import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountSummary, ClientProfile, AliasChange, PasswordChange } from '../models/account.interface';
import { Card } from '../models/card.interface';

@Injectable({
    providedIn: 'root'
})
export class AccountService {
    private readonly API_URL = 'http://localhost:8080';

    constructor(private http: HttpClient) {}

    /**
     * Obtener balance de la cuenta
     */
    getBalance(): Observable<{ balance: number }> {
        return this.http.get<{ balance: number }>(`${this.API_URL}/accountClient/balance`);
    }

    /**
     * Obtener alias de la cuenta
     */
    getAlias(): Observable<string> {
        return this.http.get<string>(`${this.API_URL}/accountClient/alias`);
    }

    /**
     * Cambiar alias de la cuenta
     */
    changeAlias(aliasData: AliasChange): Observable<string> {
        return this.http.patch<string>(`${this.API_URL}/accountClient/alias`, aliasData);
    }

    /**
     * Obtener resumen de la cuenta
     */
    getAccountSummary(): Observable<AccountSummary> {
        return this.http.get<AccountSummary>(`${this.API_URL}/accountClient/summary`);
    }

    /**
     * Obtener perfil del cliente
     */
    getClientProfile(): Observable<ClientProfile> {
        return this.http.get<ClientProfile>(`${this.API_URL}/client/profile`);
    }

    /**
     * Actualizar perfil del cliente
     */
    updateProfile(profileData: Partial<ClientProfile>): Observable<ClientProfile> {
        // Backend mapea PUT /client/profile
        return this.http.put<ClientProfile>(`${this.API_URL}/client/profile`, profileData);
    }

    /**
     * Cambiar contraseña
     */
    changePassword(passwordData: PasswordChange): Observable<any> {
        // Backend mapea PUT /client/change-password
        return this.http.put(`${this.API_URL}/client/change-password`, passwordData);
    }

    /**
     * Obtener tarjeta del cliente
     */
    getMyCard(): Observable<Card> {
        return this.http.get<Card>(`${this.API_URL}/cards/my-card`);
    }
}