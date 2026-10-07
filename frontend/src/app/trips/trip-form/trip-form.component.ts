import { refreshView } from '../../shared/refresh-view';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';

import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, ValidationErrors, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TripService } from '../services/trip.service';
import { Trip, TripStatus } from '../models/trip.model';

@Component({
  selector: 'app-trip-form',
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
    MatSnackBarModule
],
  templateUrl: './trip-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./trip-form.component.scss']
})
export class TripFormComponent implements OnInit {
  private changeDetector = inject(ChangeDetectorRef);

  private fb = inject(FormBuilder);
  private tripService = inject(TripService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  tripForm!: FormGroup;
  loading = false;
  editMode = false;
  tripId: number | null = null;

  ngOnInit(): void {
    this.createForm();

    this.route.params.pipe(refreshView(this.changeDetector)).subscribe(params => {
      if (params['id']) {
        this.editMode = true;
        this.tripId = +params['id'];
        this.loadTrip();
      }
    });
  }

  createForm(): void {
    this.tripForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    }, { validators: this.dateRangeValidator });
  }

  loadTrip(): void {
    if (!this.tripId) return;

    this.loading = true;
    this.tripService.getTripById(this.tripId).pipe(refreshView(this.changeDetector)).subscribe({
      next: (trip) => {
        if (trip.status !== TripStatus.DRAFT) {
          this.snackBar.open('This trip cannot be edited as it has already been submitted.', 'Close', {
            duration: 5000
          });
          this.router.navigate(['/trips', this.tripId]);
          return;
        }

        this.tripForm.patchValue({
          name: trip.name,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate)
        });
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

  dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (startDate > endDate) {
        return { 'dateRange': true };
      }
    }

    return null;
  }

  onSubmit(): void {

    if (this.tripForm.invalid) {
      Object.keys(this.tripForm.controls).forEach(key => {
        const control = this.tripForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formValue = this.tripForm.value;

    let startDate = formValue.startDate;
    let endDate = formValue.endDate;

    if (startDate instanceof Date) {
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      startDate = `${year}-${month}-${day}`;
    }

    if (endDate instanceof Date) {
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const day = String(endDate.getDate()).padStart(2, '0');
      endDate = `${year}-${month}-${day}`;
    }


    const tripData: Partial<Trip> = {
      name: formValue.name,
      startDate: startDate,
      endDate: endDate,
      status: TripStatus.DRAFT
    };


    if (this.editMode && this.tripId) {
      this.tripService.updateTrip(this.tripId, tripData).pipe(refreshView(this.changeDetector)).subscribe({
        next: (trip) => {
          this.loading = false;
          this.snackBar.open('Trip updated successfully', 'Close', {
            duration: 3000
          });
          this.router.navigate(['/trips', trip.id]);
        },
        error: (error) => {
          console.error('Error updating trip', error);
          this.loading = false;
          this.snackBar.open('Error updating trip. Please try again.', 'Close', {
            duration: 3000
          });
        }
      });
    } else {
      this.tripService.createTrip(tripData).pipe(refreshView(this.changeDetector)).subscribe({
        next: (trip) => {
          this.loading = false;
          this.snackBar.open('Trip created successfully', 'Close', {
            duration: 3000
          });
          this.router.navigate(['/trips', trip.id]);
        },
        error: (error) => {
          console.error('Error creating trip', error);
          this.loading = false;
          this.snackBar.open('Error creating trip. Please try again.', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }
}
