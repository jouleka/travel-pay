import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';

import { ApprovalService } from '../services/approval.service';
import {
  Trip,
  TripStatus,
  ExpenseType,
  CarRental,
  Hotel,
  Flight,
  Taxi
} from '../../trips/models/trip.model';
import { ApprovalNote } from '../models/approval.model';

@Component({
  selector: 'app-approval-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatListModule
  ],
  templateUrl: './approval-detail.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./approval-detail.component.scss']
})
export class ApprovalDetailComponent implements OnInit {
  trip: Trip | null = null;
  loading = true;
  tripId!: number;
  notes: ApprovalNote[] = [];
  noteForm!: FormGroup;
  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private approvalService: ApprovalService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.createNoteForm();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.tripId = +params['id'];
        this.loadTrip();
      }
    });
  }

  createNoteForm(): void {
    this.noteForm = this.fb.group({
      note: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  loadTrip(): void {
    this.loading = true;
    this.approvalService.getTripForApproval(this.tripId).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.notes = [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading trip', error);
        this.snackBar.open('Error loading trip. Please try again.', 'Close', {
          duration: 3000
        });
        this.loading = false;
        this.router.navigate(['/approvals/pending']);
      }
    });
  }

  getStatusClass(status: string): string {
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

  getExpenseTypeLabel(type: string): string {
    switch (type) {
      case ExpenseType.FLIGHT:
        return 'Flight';
      case ExpenseType.HOTEL:
        return 'Hotel';
      case ExpenseType.CAR_RENTAL:
        return 'Car Rental';
      case ExpenseType.TAXI:
        return 'Taxi';
      default:
        return 'Other';
    }
  }

  isCarRental(details: any): details is CarRental {
    return details &&
      'carName' in details &&
      'pickupDateTime' in details &&
      'dropoffDateTime' in details &&
      'pickupLocation' in details &&
      'dropoffLocation' in details;
  }

  isHotel(details: any): details is Hotel {
    return details &&
      'hotelName' in details &&
      'location' in details &&
      'checkInDate' in details &&
      'checkOutDate' in details;
  }

  isFlight(details: any): details is Flight {
    return details &&
      'airline' in details &&
      'from' in details &&
      'to' in details &&
      'departureDateTime' in details &&
      'arrivalDateTime' in details;
  }

  isTaxi(details: any): details is Taxi {
    return details &&
      'from' in details &&
      'to' in details &&
      'dateTime' in details;
  }

  approveTrip(): void {
    if (!this.trip) return;

    this.submitting = true;
    const note = this.noteForm.value.note || undefined;

    this.approvalService.approveTrip(this.tripId, note).subscribe({
      next: (trip) => {
        this.snackBar.open('Trip approved successfully', 'Close', {
          duration: 3000
        });
        this.trip = trip;
        this.submitting = false;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error approving trip', error);
        this.snackBar.open('Error approving trip. Please try again.', 'Close', {
          duration: 3000
        });
        this.submitting = false;
      }
    });
  }

  rejectTrip(): void {
    if (!this.trip) return;

    this.submitting = true;
    const note = this.noteForm.value.note || undefined;

    this.approvalService.rejectTrip(this.tripId, note).subscribe({
      next: (trip) => {
        this.snackBar.open('Trip rejected', 'Close', {
          duration: 3000
        });
        this.trip = trip;
        this.submitting = false;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error rejecting trip', error);
        this.snackBar.open('Error rejecting trip. Please try again.', 'Close', {
          duration: 3000
        });
        this.submitting = false;
      }
    });
  }
}
