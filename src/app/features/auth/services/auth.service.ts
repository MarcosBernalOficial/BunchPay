import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';
import { LoginUser } from '../models/login-user.interface';
import { RegisterUser } from '../models/register-user.interface';
import { LoginResponse } from '../models/auth-response.interface';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = 'http://localhost:8080/auth';
    // Estado con señales
    private _currentUser = signal<LoginResponse | null>(null);
    currentUser = this._currentUser; // expuesto como lectura en componentes si se necesita
    private http = inject(HttpClient);

    constructor() {
        // Preferir sessionStorage (sesión por pestaña) para permitir múltiples sesiones en distintas pestañas
        // Migración suave: si no hay en sessionStorage pero sí en localStorage, copiarlo
        const ssUser = sessionStorage.getItem('currentUser');
        if (ssUser) {
            this._currentUser.set(JSON.parse(ssUser));
        } else {
            const lsUser = localStorage.getItem('currentUser');
            if (lsUser) {
                sessionStorage.setItem('currentUser', lsUser);
                const token = localStorage.getItem('token');
                if (token) sessionStorage.setItem('token', token);
                this._currentUser.set(JSON.parse(lsUser));
            }
        }
    }

    /**
     * Registrar nuevo usuario
     */
    async register(userData: RegisterUser): Promise<void> {
        try {
            await firstValueFrom(this.http.post(`${this.API_URL}/register`, userData));
        } catch (e: any) {
            const status = e?.status;
            const field = e?.error?.field;
            const backendMsg = e?.error?.message || e?.message;
            const message = backendMsg || (status === 409 ? 'Ya existe un registro con esos datos.' : 'No se pudo completar el registro.');
            throw { status, field, message };
        }
    }

    /**
     * Iniciar sesión
     */
    async login(credentials: LoginUser): Promise<LoginResponse> {
        const response = await firstValueFrom(
            this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
                tap(res => {
                    sessionStorage.setItem('currentUser', JSON.stringify(res));
                    sessionStorage.setItem('token', res.token);
                    this._currentUser.set(res);
                })
            )
        );
        return response;
    }

    /**
     * Cerrar sesión
     */
    async logout(): Promise<void> {
        await firstValueFrom(this.http.post(`${this.API_URL}/logout`, {}));
        // Limpiar sessionStorage y localStorage (por si quedó residuo)
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        // Limpiar señal
        this._currentUser.set(null);
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    /**
     * Obtener token
     */
    getToken(): string | null {
        return sessionStorage.getItem('token') || null;
    }

    /**
     * Obtener usuario actual
     */
    getCurrentUser(): LoginResponse | null {
        return this._currentUser();
    }

    /**
     * Verificar si el usuario tiene un rol específico
     */
    hasRole(role: string): boolean {
        const expected = this.normalizeRole(role);
        const user = this.getCurrentUser();
        let actual = this.normalizeRole(user?.rol as any);
        // Fallback: si no hay rol en el response, intentar extraerlo del JWT
        if (!actual) {
            actual = this.normalizeRole(this.getRoleFromToken());
        }
        return !!actual && actual === expected;
    }

    /**
     * Normaliza roles para comparación robusta: mayúsculas y sin prefijo ROLE_
     */
    private normalizeRole(role: string | undefined | null): string | null {
        if (!role) return null;
        return String(role).toUpperCase().replace(/^ROLE_/, '').trim();
    }

    /**
     * Extrae el rol desde el JWT (payload), probando distintas convenciones
     * Ejemplos: { rol: 'SUPPORT' } | { role: 'ROLE_SUPPORT' } | { authorities: [{ authority: 'ROLE_SUPPORT' }] }
     */
    private getRoleFromToken(): string | null {
        const token = this.getToken();
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length < 2) return null;
        try {
            const payloadJson = JSON.parse(this.base64UrlDecode(parts[1]));
            const candidates: Array<string | undefined> = [
                payloadJson?.rol,
                payloadJson?.role,
                Array.isArray(payloadJson?.authorities) ? payloadJson.authorities[0]?.authority : undefined,
                Array.isArray(payloadJson?.roles) ? payloadJson.roles[0] : undefined
            ];
            return (candidates.find(Boolean) as string) || null;
        } catch {
            return null;
        }
    }

    private base64UrlDecode(input: string): string {
        // Reemplaza URL-safe chars y agrega padding si falta
        input = input.replace(/-/g, '+').replace(/_/g, '/');
        const pad = input.length % 4;
        if (pad) {
            input += '='.repeat(4 - pad);
        }
        // atob para decodificar base64
        return decodeURIComponent(
            Array.prototype.map
                .call(atob(input), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
    }
}