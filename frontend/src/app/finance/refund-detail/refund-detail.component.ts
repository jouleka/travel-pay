import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { FinanceService } from '../services/finance.service';
import { RefundRequest } from '../models/refund.model';
import { ExpenseType, RefundStatusType } from '../../trips/models/trip.model';

@Component({
  selector: 'app-refund-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './refund-detail.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./refund-detail.component.scss']
})
export class RefundDetailComponent implements OnInit {
  tripId!: number;
  refundRequest?: RefundRequest;
  loading = true;
  expenseColumns: string[] = ['type', 'details', 'amount'];
  noteForm = new FormGroup({
    note: new FormControl('', [Validators.required, Validators.maxLength(500)])
  });
  RefundStatusType = RefundStatusType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private financeService: FinanceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.tripId = +idParam;
        this.loadTripDetails();
      } else {
        this.router.navigate(['/finance/refunds']);
      }
    });
  }

  loadTripDetails(): void {
    this.loading = true;
    this.financeService.getTripWithRefundStatus(this.tripId).subscribe({
      next: (data) => {
        this.refundRequest = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading trip details', error);
        this.snackBar.open('Error loading trip details. Please try again.', 'Close', {
          duration: 3000
        });
        this.loading = false;
        this.router.navigate(['/finance/refunds']);
      }
    });
  }

  markAsInProcess(): void {
    if (this.noteForm.invalid) {
      return;
    }

    if (!this.tripId || !this.refundRequest) {
      return;
    }

    const note = this.noteForm.get('note')?.value;
    this.financeService.markAsInProcess(this.tripId, note || undefined).subscribe({
      next: () => {
        this.snackBar.open('Trip marked as in process', 'Close', {
          duration: 3000
        });
        this.loadTripDetails();
        this.noteForm.reset();
      },
      error: (error) => {
        console.error('Error marking trip as in process', error);
        this.snackBar.open('Error marking trip as in process. Please try again.', 'Close', {
          duration: 3000
        });
      }
    });
  }

  markAsRefunded(): void {
    if (this.noteForm.invalid) {
      return;
    }

    if (!this.tripId || !this.refundRequest) {
      return;
    }

    const note = this.noteForm.get('note')?.value;
    this.financeService.markAsRefunded(this.tripId, note || undefined).subscribe({
      next: () => {
        this.snackBar.open('Trip marked as refunded', 'Close', {
          duration: 3000
        });
        this.loadTripDetails();
        this.noteForm.reset();
      },
      error: (error) => {
        console.error('Error marking trip as refunded', error);
        this.snackBar.open('Error marking trip as refunded. Please try again.', 'Close', {
          duration: 3000
        });
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString();
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'EUR'
    });
  }

  getExpenseTypeLabel(type: ExpenseType): string {
    switch (type) {
      case ExpenseType.CAR_RENTAL:
        return 'Car Rental';
      case ExpenseType.HOTEL:
        return 'Hotel';
      case ExpenseType.FLIGHT:
        return 'Flight';
      case ExpenseType.TAXI:
        return 'Taxi';
      default:
        return type;
    }
  }

  getExpenseDetails(expense: any): string {
    try {
      if (!expense.details && expense.type === ExpenseType.TAXI) {
        if (expense.fromLocation && expense.toLocation) {
          return `${expense.fromLocation} to ${expense.toLocation}`;
        }
      }

      const details = expense.details || {};

      switch (expense.type) {
        case ExpenseType.CAR_RENTAL:
          return `${details['carName'] || ''} - ${details['pickupLocation'] || ''} to ${details['dropoffLocation'] || ''}`;
        case ExpenseType.HOTEL:
          return `${details['hotelName'] || ''} - ${details['location'] || ''}`;
        case ExpenseType.FLIGHT:
          return `${details['airline'] || ''} - ${details['from'] || ''} to ${details['to'] || ''}`;
        case ExpenseType.TAXI:
          return `${details['from'] || ''} to ${details['to'] || ''}`;
        default:
          return '';
      }
    } catch (error) {
      console.error('Error processing expense details', error);
      return '';
    }
  }

  goBack(): void {
    this.router.navigate(['/finance/refunds']);
  }

  getStatusChipClass(status: RefundStatusType): string {
    switch (status) {
      case RefundStatusType.PENDING:
        return 'status-pending';
      case RefundStatusType.IN_PROCESS:
        return 'status-in-process';
      case RefundStatusType.REFUNDED:
        return 'status-refunded';
      default:
        return '';
    }
  }
}
