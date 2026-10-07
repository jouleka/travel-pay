import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  it('rejects a signed-in user without the privileged role', () => {
    TestBed.configureTestingModule({providers: [provideRouter([]), {provide: AuthService, useValue: {isLoggedIn: () => true, hasRole: () => false}}]});
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    expect(TestBed.inject(RoleGuard).canActivate({data: {roles: ['ROLE_FINANCE']}} as unknown as ActivatedRouteSnapshot, {url: '/finance'} as RouterStateSnapshot)).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/unauthorized']);
  });
  it('allows the required role', () => {
    TestBed.configureTestingModule({providers: [provideRouter([]), {provide: AuthService, useValue: {isLoggedIn: () => true, hasRole: (role: string) => role === 'ROLE_APPROVER'}}]});
    expect(TestBed.inject(RoleGuard).canActivate({data: {roles: ['ROLE_APPROVER']}} as unknown as ActivatedRouteSnapshot, {url: '/approvals'} as RouterStateSnapshot)).toBe(true);
  });
});
