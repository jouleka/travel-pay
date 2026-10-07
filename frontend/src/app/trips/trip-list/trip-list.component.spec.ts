import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { TripService } from '../services/trip.service';
import { Trip, TripStatus } from '../models/trip.model';
import { TripListComponent } from './trip-list.component';

describe('TripListComponent async rendering', () => {
  it('renders a delayed backend result under OnPush change detection', async () => {
    const response = new Subject<Trip[]>();
    await TestBed.configureTestingModule({imports: [TripListComponent], providers: [provideRouter([]), {provide: TripService, useValue: {getUserTrips: () => response}}]}).compileComponents();
    const fixture = TestBed.createComponent(TripListComponent);
    fixture.autoDetectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    response.next([{id: 1, name: 'Delayed fixture trip', startDate: '2026-10-01', endDate: '2026-10-02', status: TripStatus.DRAFT, expenses: []}]);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Delayed fixture trip');
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    response.complete();
  });
});
