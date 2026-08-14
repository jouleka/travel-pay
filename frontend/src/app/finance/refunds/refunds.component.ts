import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FinanceService } from '../services/finance.service';
import { Trip } from '../../trips/models/trip.model';

@Component({
  selector: 'app-refunds',
  standalone: true,
  imports: [
    RouterModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
],
  templateUrl: './refunds.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./refunds.component.scss']
})
export class RefundsComponent implements OnInit {
  approvedTrips: Trip[] = [];
  filteredTrips: Trip[] = [];
  displayedColumns: string[] = ['id', 'name', 'startDate', 'endDate', 'totalExpenses', 'actions'];
  loading = true;

  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalTrips = 0;

  constructor(
    private financeService: FinanceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadApprovedTrips();
  }

  loadApprovedTrips(): void {
    this.loading = true;
    this.financeService.getApprovedTrips().subscribe({
      next: (trips) => {
        this.approvedTrips = trips;
        this.totalTrips = trips.length;
        this.updateFilteredTrips();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading approved trips', error);
        this.snackBar.open('Error loading approved trips. Please try again.', 'Close', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  updateFilteredTrips(): void {
    const startIndex = this.pageIndex * this.pageSize;
    this.filteredTrips = this.approvedTrips.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateFilteredTrips();
  }

  sortData(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.filteredTrips = [...this.approvedTrips];
      return;
    }

    this.approvedTrips.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'id': return this.compare(a.id || 0, b.id || 0, isAsc);
        case 'name': return this.compare(a.name, b.name, isAsc);
        case 'startDate': return this.compare(new Date(a.startDate).getTime(), new Date(b.startDate).getTime(), isAsc);
        case 'endDate': return this.compare(new Date(a.endDate).getTime(), new Date(b.endDate).getTime(), isAsc);
        case 'totalExpenses': return this.compare(a.totalExpenses || 0, b.totalExpenses || 0, isAsc);
        default: return 0;
      }
    });

    this.updateFilteredTrips();
  }

  private compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'EUR'
    });
  }
}
