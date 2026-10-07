import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { JwtResponse } from '../models/auth.model';
import { AuthService } from '../services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const login = vi.fn();
  beforeEach(async () => {
    login.mockReset();
    await TestBed.configureTestingModule({imports: [LoginComponent], providers: [provideRouter([]), {provide: ActivatedRoute, useValue: {snapshot: {queryParams: {}}}}, {provide: AuthService, useValue: {isLoggedIn: () => false, login}}]}).compileComponents();
  });
  it('never submits an empty form', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    fixture.componentInstance.onSubmit();
    expect(login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Demo accounts');
  });
  it('shows an authentication failure without navigating', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    login.mockReturnValue(throwError(() => ({error: {message: 'Invalid credentials'}})));
    fixture.componentInstance.loginForm.setValue({username: 'traveler', password: 'incorrect'});
    fixture.componentInstance.onSubmit();
    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.componentInstance.error).toBe('Invalid credentials');
    expect(navigate).not.toHaveBeenCalled();
  });
  it('renders a delayed login error and clears its loading indicator', async () => {
    const response = new Subject<JwtResponse>();
    login.mockReturnValue(response);
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.autoDetectChanges();
    fixture.componentInstance.loginForm.setValue({username: 'traveler', password: 'incorrect'});
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    response.error({error: {message: 'Invalid credentials'}});
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Invalid credentials');
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
  });
});
