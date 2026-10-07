import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  const logout = vi.fn();
  beforeEach(async () => {
    logout.mockReset();
    await TestBed.configureTestingModule({imports: [DashboardComponent], providers: [provideRouter([]), {provide: AuthService, useValue: {currentUserValue: {id: 1, username: 'traveler', email: 'traveler@example.com', roles: ['ROLE_USER']}, hasRole: (role: string) => role === 'ROLE_USER', logout}}]}).compileComponents();
  });
  it('shows ordinary travel actions without privileged finance actions', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Manage Trips');
    expect(fixture.nativeElement.textContent).not.toContain('Manage Refunds');
    expect(fixture.nativeElement.textContent).not.toContain('Pending Approvals');
  });
  it('ends the session when logging out', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.logout();
    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
