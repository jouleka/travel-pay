import { API_BASE_URL } from '../../config/api.config';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // HttpClient can also call third-party URLs. Never send the session token
  // outside the application's configured backend API.
  const api = new URL(`${API_BASE_URL}/`);
  const requested = new URL(req.url, globalThis.location.origin);
  const isBackendRequest = requested.origin === api.origin && requested.pathname.startsWith(api.pathname);

  if (token && isBackendRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isBackendRequest && error.status === 401) {
        authService.logout();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
