import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  it('rejects anonymous access and preserves a local return route', () => {
    TestBed.configureTestingModule({providers: [provideRouter([]), {provide: AuthService, useValue: {isLoggedIn: () => false}}]});
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const allowed = TestBed.inject(AuthGuard).canActivate({} as ActivatedRouteSnapshot, {url: '/trips'} as RouterStateSnapshot);
    expect(allowed).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/auth/login'], {queryParams: {returnUrl: '/trips'}});
  });
  it('allows an authenticated session', () => {
    TestBed.configureTestingModule({providers: [provideRouter([]), {provide: AuthService, useValue: {isLoggedIn: () => true}}]});
    expect(TestBed.inject(AuthGuard).canActivate({} as ActivatedRouteSnapshot, {url: '/trips'} as RouterStateSnapshot)).toBe(true);
  });
});
