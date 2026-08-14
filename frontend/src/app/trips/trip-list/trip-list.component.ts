import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TripService } from '../services/trip.service';
import { Trip, TripStatus } from '../models/trip.model';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './trip-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./trip-list.component.scss']
})
export class TripListComponent implements OnInit {
  trips: Trip[] = [];
  loading = true;
  displayedColumns: string[] = ['name', 'startDate', 'endDate', 'status', 'totalExpenses', 'actions'];

  constructor(private tripService: TripService) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.loading = true;
    this.tripService.getUserTrips().subscribe({
      next: (data) => {
        this.trips = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading trips', error);
        this.loading = false;
      }
    });
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

  canEdit(trip: Trip): boolean {
    return trip.status === TripStatus.DRAFT;
  }

  canSubmit(trip: Trip): boolean {
    return trip.status === TripStatus.DRAFT && trip.expenses.length > 0;
  }

  submitTrip(id: number): void {
    this.tripService.submitTripForApproval(id).subscribe({
      next: () => {
        this.loadTrips();
      },
      error: (error) => {
        console.error('Error submitting trip', error);
      }
    });
  }

  deleteTrip(id: number): void {
    if (confirm('Are you sure you want to delete this trip?')) {
      this.tripService.deleteTrip(id).subscribe({
        next: () => {
          this.loadTrips();
        },
        error: (error) => {
          console.error('Error deleting trip', error);
        }
      });
    }
  }
}
