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
        // Si el token expiró o no es válido, limpiar sesión para forzar re-login
        if (error.status === 401 || error.status === 403) {
          sessionStorage.removeItem('currentUser');
          sessionStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('token');
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};