import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';

import { TripService } from '../services/trip.service';
import {
  Trip,
  TripStatus,
  Expense,
  ExpenseType,
  FlightExpense,
  CarRentalExpense,
  HotelExpense,
  TaxiExpense
} from '../models/trip.model';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule
  ],
  templateUrl: './trip-detail.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./trip-detail.component.scss']
})
export class TripDetailComponent implements OnInit {
  trip: Trip | null = null;
  loading = true;
  tripId: number | null = null;
  expenseDisplayedColumns: string[] = ['type', 'totalPrice', 'details', 'actions'];

  // Enum access for templates
  tripStatus = TripStatus;
  expenseType = ExpenseType;

  constructor(
    private tripService: TripService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tripId = +id;
        this.loadTrip();
      } else {
        this.router.navigate(['/trips']);
      }
    });
  }

  loadTrip(): void {
    if (!this.tripId) return;

    this.loading = true;
    this.tripService.getTripById(this.tripId).subscribe({
      next: (trip) => {
        if (trip.totalExpenses === undefined || trip.totalExpenses === null) {
          trip.totalExpenses = trip.expenses.reduce((sum, expense) => sum + expense.totalPrice, 0);
        }

        if (!trip.createdAt) {
          trip.createdAt = new Date().toISOString();
        }

        this.trip = trip;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading trip', error);
        this.snackBar.open('Error loading trip. Please try again.', 'Close', {
          duration: 3000
        });
        this.loading = false;
        this.router.navigate(['/trips']);
      }
    });
  }

  submitForApproval(): void {
    if (!this.tripId) return;

    if (confirm('Are you sure you want to submit this trip for approval? You will not be able to make any further changes.')) {
      this.tripService.submitTripForApproval(this.tripId).subscribe({
        next: (trip) => {
          this.trip = trip;
          this.snackBar.open('Trip submitted for approval successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error submitting trip', error);
          this.snackBar.open('Error submitting trip. Please try again.', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  deleteExpense(expenseId: number): void {
    if (!this.tripId) return;

    if (confirm('Are you sure you want to delete this expense?')) {
      this.tripService.deleteExpense(this.tripId, expenseId).subscribe({
        next: () => {
          this.loadTrip();
          this.snackBar.open('Expense deleted successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error deleting expense', error);
          this.snackBar.open('Error deleting expense. Please try again.', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  canEditTrip(): boolean {
    return this.trip?.status === TripStatus.DRAFT;
  }

  getStatusClass(status: TripStatus): string {
    switch (status) {
      case TripStatus.DRAFT:
        return 'status-draft';
      case TripStatus.PENDING_APPROVAL:
        return 'status-pending';
      case TripStatus.APPROVED:
        return 'status-approved';
      case TripStatus.REJECTED:
        return 'status-rejected';
      default:
        return '';
    }
  }

  getExpenseTypeIcon(type: ExpenseType): string {
    switch (type) {
      case ExpenseType.CAR_RENTAL:
        return 'directions_car';
      case ExpenseType.HOTEL:
        return 'hotel';
      case ExpenseType.FLIGHT:
        return 'flight';
      case ExpenseType.TAXI:
        return 'local_taxi';
      default:
        return 'receipt';
    }
  }

  formatExpenseDetails(expense: Expense): string {
    switch (expense.type) {
      case ExpenseType.CAR_RENTAL: {
        const carRental = expense as CarRentalExpense;
        return `${carRental.carName} - From ${carRental.pickupLocation} to ${carRental.dropLocation}`;
      }
      case ExpenseType.HOTEL: {
        const hotel = expense as HotelExpense;
        return `${hotel.hotelName} in ${hotel.location}`;
      }
      case ExpenseType.FLIGHT: {
        const flight = expense as FlightExpense;
        return `${flight.airline} - From ${flight.departureLocation} to ${flight.arrivalLocation}`;
      }
      case ExpenseType.TAXI: {
        const taxi = expense as TaxiExpense;
        return `From ${taxi.from} to ${taxi.to}`;
      }
      default:
        return '';
    }
  }

  // Helper methods for expense details access with proper typing
  getCarRentalDetails(expense: Expense): CarRentalExpense | null {
    return expense.type === ExpenseType.CAR_RENTAL ? (expense as CarRentalExpense) : null;
  }

  getHotelDetails(expense: Expense): HotelExpense | null {
    return expense.type === ExpenseType.HOTEL ? (expense as HotelExpense) : null;
  }

  getFlightDetails(expense: Expense): FlightExpense | null {
    return expense.type === ExpenseType.FLIGHT ? (expense as FlightExpense) : null;
  }

  getTaxiDetails(expense: Expense): TaxiExpense | null {
    return expense.type === ExpenseType.TAXI ? (expense as TaxiExpense) : null;
  }
}
