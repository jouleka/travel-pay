import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { API_BASE_URL } from '../../config/api.config';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
  });
  afterEach(() => {TestBed.inject(HttpTestingController).verify(); localStorage.clear();});
  it('stores a successful session and its ordinary user role', () => {
    const auth = TestBed.inject(AuthService);
    auth.login({username: 'traveler', password: 'test-only'}).subscribe();
    TestBed.inject(HttpTestingController).expectOne(`${API_BASE_URL}/auth/signin`).flush({token: 'test-token', type: 'Bearer', id: 1, username: 'traveler', email: 'traveler@example.com', roles: ['ROLE_USER']});
    expect(auth.getToken()).toBe('test-token');
    expect(auth.hasRole('ROLE_USER')).toBe(true);
    expect(auth.hasRole('ROLE_FINANCE')).toBe(false);
  });
  it('propagates invalid credentials instead of reporting a successful login', () => {
    const auth = TestBed.inject(AuthService);
    const success = vi.fn();
    const failure = vi.fn();
    auth.login({username: 'traveler', password: 'incorrect'}).subscribe({next: success, error: failure});
    TestBed.inject(HttpTestingController).expectOne(`${API_BASE_URL}/auth/signin`).flush({}, {status: 401, statusText: 'Unauthorized'});
    expect(success).not.toHaveBeenCalled();
    expect(failure).toHaveBeenCalledOnce();
    expect(auth.isLoggedIn()).toBe(false);
  });
  it.each(['{broken', '{"id":1,"username":"traveler","email":"traveler@example.com","roles":"ROLE_FINANCE"}'])('fails closed on corrupt persisted identity', value => {
    localStorage.setItem('auth-user', value);
    localStorage.setItem('auth-token', 'stale-token');
    const auth = TestBed.inject(AuthService);
    expect(auth.currentUserValue).toBeNull();
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('auth-user')).toBeNull();
  });
  it('clears both identity and token on logout', () => {
    const auth = TestBed.inject(AuthService);
    auth.saveToken('test-token');
    auth.saveUser({id: 1, username: 'traveler', email: 'traveler@example.com', roles: ['ROLE_USER']});
    auth.logout();
    expect(auth.getToken()).toBeNull();
    expect(auth.currentUserValue).toBeNull();
    expect(localStorage.getItem('auth-user')).toBeNull();
  });
  it('rejects an orphaned token without its persisted account identity', () => {
    localStorage.setItem('auth-token', 'stale-token');
    const auth = TestBed.inject(AuthService);
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.getToken()).toBeNull();
  });
});
