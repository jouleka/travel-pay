import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

import { TripService } from '../services/trip.service';
import { ExpenseType } from '../models/trip.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule
],
  templateUrl: './expense-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./expense-form.component.scss']
})
export class ExpenseFormComponent implements OnInit {
  expenseForm!: FormGroup;
  loading = false;
  tripId!: number;
  expenseTypes = Object.values(ExpenseType);
  selectedType: ExpenseType | null = null;

  constructor(
    private fb: FormBuilder,
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
        this.createForm();
      } else {
        this.router.navigate(['/trips']);
      }
    });
  }

  createForm(): void {
    this.expenseForm = this.fb.group({
      type: ['', Validators.required],
      totalPrice: ['', [Validators.required, Validators.min(0)]]
    });

    // Listen for type changes to update the form
    this.expenseForm.get('type')?.valueChanges.subscribe(type => {
      this.selectedType = type;
      this.updateFormForType(type);
    });
  }

  updateFormForType(type: ExpenseType): void {
    // Reset details form controls
    const currentControls = { ...this.expenseForm.controls };

    // Remove all previous detail controls except type and totalPrice
    Object.keys(currentControls).forEach(key => {
      if (key !== 'type' && key !== 'totalPrice') {
        this.expenseForm.removeControl(key);
      }
    });

    // Add new controls based on selected type
    switch (type) {
      case ExpenseType.CAR_RENTAL:
        this.expenseForm.addControl('carName', this.fb.control('', Validators.required));
        this.expenseForm.addControl('pickupDateTime', this.fb.control('', Validators.required));
        this.expenseForm.addControl('dropoffDateTime', this.fb.control('', Validators.required));
        this.expenseForm.addControl('pickupLocation', this.fb.control('', Validators.required));
        this.expenseForm.addControl('dropoffLocation', this.fb.control('', Validators.required));
        break;

      case ExpenseType.HOTEL:
        this.expenseForm.addControl('hotelName', this.fb.control('', Validators.required));
        this.expenseForm.addControl('location', this.fb.control('', Validators.required));
        this.expenseForm.addControl('checkInDate', this.fb.control('', Validators.required));
        this.expenseForm.addControl('checkOutDate', this.fb.control('', Validators.required));
        break;

      case ExpenseType.FLIGHT:
        this.expenseForm.addControl('airline', this.fb.control('', Validators.required));
        this.expenseForm.addControl('from', this.fb.control('', Validators.required));
        this.expenseForm.addControl('to', this.fb.control('', Validators.required));
        this.expenseForm.addControl('departureDateTime', this.fb.control('', Validators.required));
        this.expenseForm.addControl('arrivalDateTime', this.fb.control('', Validators.required));
        break;

      case ExpenseType.TAXI:
        this.expenseForm.addControl('from', this.fb.control('', Validators.required));
        this.expenseForm.addControl('to', this.fb.control('', Validators.required));
        this.expenseForm.addControl('dateTime', this.fb.control('', Validators.required));
        break;
    }
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.expenseForm.controls).forEach(key => {
        const control = this.expenseForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formValue = this.expenseForm.value;
    const expenseType = formValue.type;

    // Format dates properly for each expense type
    switch (expenseType) {
      case ExpenseType.CAR_RENTAL:
        if (formValue.pickupDateTime instanceof Date) {
          formValue.pickupDateTime = this.formatDateTime(formValue.pickupDateTime);
        }
        if (formValue.dropoffDateTime instanceof Date) {
          formValue.dropoffDateTime = this.formatDateTime(formValue.dropoffDateTime);
        }
        this.tripService.addCarRental(this.tripId, formValue).subscribe(this.handleResponse);
        break;

      case ExpenseType.HOTEL:
        if (formValue.checkInDate instanceof Date) {
          formValue.checkInDate = this.formatDate(formValue.checkInDate);
        }
        if (formValue.checkOutDate instanceof Date) {
          formValue.checkOutDate = this.formatDate(formValue.checkOutDate);
        }
        this.tripService.addHotel(this.tripId, formValue).subscribe(this.handleResponse);
        break;

      case ExpenseType.FLIGHT:
        if (formValue.departureDateTime instanceof Date) {
          formValue.departureDateTime = this.formatDateTime(formValue.departureDateTime);
        }
        if (formValue.arrivalDateTime instanceof Date) {
          formValue.arrivalDateTime = this.formatDateTime(formValue.arrivalDateTime);
        }
        this.tripService.addFlight(this.tripId, formValue).subscribe(this.handleResponse);
        break;

      case ExpenseType.TAXI:
        if (formValue.dateTime instanceof Date) {
          formValue.dateTime = this.formatDateTime(formValue.dateTime);
        }
        this.tripService.addTaxi(this.tripId, formValue).subscribe(this.handleResponse);
        break;
    }
  }

  // Helper method to handle subscription response
  private handleResponse = {
    next: () => {
      this.loading = false;
      this.snackBar.open('Expense added successfully', 'Close', {
        duration: 3000
      });
      this.router.navigate(['/trips', this.tripId]);
    },
    error: (error: any) => {
      console.error('Error adding expense', error);
      this.loading = false;
      this.snackBar.open('Error adding expense. Please try again.', 'Close', {
        duration: 3000
      });
    }
  };

  // Format date to YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format datetime to YYYY-MM-DDTHH:MM
  private formatDateTime(date: Date): string {
    const dateStr = this.formatDate(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${dateStr}T${hours}:${minutes}`;
  }

  // Format functions for expense types display
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
}
