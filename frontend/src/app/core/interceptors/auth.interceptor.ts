import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('activate_token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(authReq);
};

/**
 * Cierra la sesión cuando el backend rechaza el token: 401 sin token,
 * o 403 con token inválido/expirado (un 403 por permisos no cierra sesión).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = (error.error as { error?: string } | null)?.error ?? '';
      const expired = error.status === 401 || (error.status === 403 && message.includes('Token'));
      if (expired && !req.url.endsWith('/api/login')) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
