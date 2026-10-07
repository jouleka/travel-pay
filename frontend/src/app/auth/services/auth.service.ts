import { API_BASE_URL } from '../../config/api.config';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { JwtResponse, LoginRequest, User } from '../models/auth.model';

const AUTH_API = `${API_BASE_URL}/auth/`;
const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor() {
    this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(loginRequest: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(AUTH_API + 'signin', loginRequest, httpOptions)
      .pipe(
        tap(response => {
          this.saveToken(response.token);
          this.saveUser({
            id: response.id,
            username: response.username,
            email: response.email,
            roles: response.roles
          });
          this.currentUserSubject.next({
            id: response.id,
            username: response.username,
            email: response.email,
            roles: response.roles
          });
        })
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
  }

  saveToken(token: string): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  saveUser(user: User): void {
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getUserFromStorage(): User | null {
    const user = localStorage.getItem(USER_KEY);
    if (user) {
      try {
        const parsed: unknown = JSON.parse(user);
        if (typeof parsed === 'object' && parsed !== null && 'roles' in parsed
          && Array.isArray(parsed.roles) && parsed.roles.every(role => typeof role === 'string')
          && 'id' in parsed && typeof parsed.id === 'number'
          && 'username' in parsed && typeof parsed.username === 'string'
          && 'email' in parsed && typeof parsed.email === 'string') {
          return parsed as User;
        }
      } catch {
        // Treat corrupt persisted state as signed out, never as a trusted role.
      }
      localStorage.removeItem(USER_KEY);
    }
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && this.currentUserValue !== null;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    if (!user) {
      return false;
    }
    return user.roles.includes(role);
  }

}
