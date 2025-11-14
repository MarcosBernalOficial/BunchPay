import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../features/auth/services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // No adjuntar token en endpoints de autenticación
  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/logout');

  if (token && !isAuthEndpoint) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Solo limpiar sesión si el 401/403 es por token inválido/expirado
        // NO limpiar si es un error de validación (ej: contraseña incorrecta en change-password)
        if (error.status === 401 || error.status === 403) {
          // Excluir endpoints que pueden dar 401 por otras razones (no token inválido)
          const isPasswordChange = req.url.includes('/change-password');
          const isLoginAttempt = req.url.includes('/auth/login');
          
          // Solo limpiar sesión si NO es un intento de cambio de contraseña o login
          if (!isPasswordChange && !isLoginAttempt) {
            console.warn('Token inválido o expirado. Limpiando sesión...');
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
          }
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};