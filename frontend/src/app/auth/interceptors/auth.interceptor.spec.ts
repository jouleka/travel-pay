import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthInterceptor } from './auth.interceptor';
import { API_BASE_URL } from '../../config/api.config';

describe('AuthInterceptor', () => {
  const logout = vi.fn();
  beforeEach(() => {
    logout.mockReset();
    TestBed.configureTestingModule({providers: [provideRouter([]), {provide: AuthService, useValue: {getToken: () => 'test-token', logout}}]});
  });
  it('sends the token only to the configured backend API', async () => {
    for (const url of [`${API_BASE_URL}/trips`, 'https://example.com/api/trips', 'http://localhost:8080/api-other/trips', 'http://localhost:8080@evil.example/api/trips']) {
      let captured: HttpRequest<unknown> | undefined;
      await firstValueFrom(TestBed.runInInjectionContext(() => AuthInterceptor(new HttpRequest('GET', url), req => {captured = req; return of(new HttpResponse());})));
      expect(captured?.headers.get('Authorization')).toBe(url.startsWith(`${API_BASE_URL}/`) ? 'Bearer test-token' : null);
    }
  });
  it('clears the session on a backend 401', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const response = TestBed.runInInjectionContext(() => AuthInterceptor(new HttpRequest('GET', `${API_BASE_URL}/trips`), () => throwError(() => new HttpErrorResponse({status: 401}))));
    await expect(firstValueFrom(response)).rejects.toMatchObject({status: 401});
    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/auth/login']);
  });
  it('preserves a valid session on forbidden resources or external 401s', async () => {
    for (const [url, status] of [[`${API_BASE_URL}/finance`, 403], ['https://example.com/api/trips', 401]] as const) {
      const response = TestBed.runInInjectionContext(() => AuthInterceptor(new HttpRequest('GET', url), () => throwError(() => new HttpErrorResponse({status}))));
      await expect(firstValueFrom(response)).rejects.toMatchObject({status});
    }
    expect(logout).not.toHaveBeenCalled();
  });
});
