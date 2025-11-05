import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { LoginUser } from '../models/login-user.interface';
import { RegisterUser } from '../models/register-user.interface';
import { LoginResponse } from '../models/auth-response.interface';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = 'http://localhost:8080/auth';
    private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        // Preferir sessionStorage (sesión por pestaña) para permitir múltiples sesiones en distintas pestañas
        // Migración suave: si no hay en sessionStorage pero sí en localStorage, copiarlo
        const ssUser = sessionStorage.getItem('currentUser');
        if (ssUser) {
            this.currentUserSubject.next(JSON.parse(ssUser));
        } else {
            const lsUser = localStorage.getItem('currentUser');
            if (lsUser) {
                sessionStorage.setItem('currentUser', lsUser);
                const token = localStorage.getItem('token');
                if (token) sessionStorage.setItem('token', token);
                this.currentUserSubject.next(JSON.parse(lsUser));
            }
        }
    }

    /**
     * Registrar nuevo usuario
     */
    register(userData: RegisterUser): Observable<any> {
        return this.http.post(`${this.API_URL}/register`, userData);
    }

    /**
     * Iniciar sesión
     */
    login(credentials: LoginUser): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
        tap(response => {
            // Guardar en sessionStorage (aislado por pestaña)
            sessionStorage.setItem('currentUser', JSON.stringify(response));
            sessionStorage.setItem('token', response.token);
            
            // Actualizar subject
            this.currentUserSubject.next(response);
        })
        );
    }

    /**
     * Cerrar sesión
     */
    logout(): Observable<any> {
        return this.http.post(`${this.API_URL}/logout`, {}).pipe(
        tap(() => {
            // Limpiar sessionStorage y localStorage (por si quedó residuo)
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            
            // Limpiar subject
            this.currentUserSubject.next(null);
        })
        );
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
        return this.currentUserSubject.value;
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