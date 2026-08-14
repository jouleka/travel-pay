import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { FinanceService } from '../services/finance.service';
import { Trip } from '../../trips/models/trip.model';
import { ExpenseTypeSummary, ReportSummary, ReportData } from '../models/report.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  loading = false;
  reportData: ReportData | null = null;
  reportSummary: ReportSummary | null = null;

  reportForm = new FormGroup({
    startDate: new FormControl<Date | null>(null, [Validators.required]),
    endDate: new FormControl<Date | null>(null, [Validators.required])
  });

  displayedColumns: string[] = ['id', 'name', 'user', 'startDate', 'endDate', 'status', 'refundStatus', 'totalExpenses'];
  filteredTrips: Trip[] = [];

  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalTrips = 0;

  constructor(
    private financeService: FinanceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Set default date range (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.reportForm.patchValue({
      startDate: firstDay,
      endDate: today
    });
  }

  generateReport(): void {
    if (this.reportForm.invalid) {
      return;
    }

    const startDate = this.reportForm.get('startDate')?.value;
    const endDate = this.reportForm.get('endDate')?.value;

    if (!startDate || !endDate) {
      return;
    }

    // Format dates as ISO strings
    const startIso = startDate.toISOString().split('T')[0];
    const endIso = endDate.toISOString().split('T')[0];

    this.loading = true;
    this.financeService.generateReport(startIso, endIso).subscribe({
      next: (data) => {
        this.reportData = data;
        this.totalTrips = data.trips.length;
        this.updateFilteredTrips();
        this.generateSummary();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error generating report', error);
        this.snackBar.open('Error generating report. Please try again.', 'Close', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  updateFilteredTrips(): void {
    if (!this.reportData?.trips) {
      this.filteredTrips = [];
      return;
    }

    const startIndex = this.pageIndex * this.pageSize;
    this.filteredTrips = this.reportData.trips.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateFilteredTrips();
  }

  sortData(sort: Sort): void {
    if (!sort.active || sort.direction === '' || !this.reportData?.trips) {
      return;
    }

    this.reportData.trips.sort((a: Trip, b: Trip) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'id': return this.compare(a.id || 0, b.id || 0, isAsc);
        case 'name': return this.compare(a.name, b.name, isAsc);
        case 'user': return this.compare(
          a.user?.username || '',
          b.user?.username || '',
          isAsc
        );
        case 'startDate': return this.compare(new Date(a.startDate).getTime(), new Date(b.startDate).getTime(), isAsc);
        case 'endDate': return this.compare(new Date(a.endDate).getTime(), new Date(b.endDate).getTime(), isAsc);
        case 'status': return this.compare(a.status, b.status, isAsc);
        case 'refundStatus': return this.compare(
          a.refundStatus?.status || '',
          b.refundStatus?.status || '',
          isAsc
        );
        case 'totalExpenses': return this.compare(a.totalExpenses || 0, b.totalExpenses || 0, isAsc);
        default: return 0;
      }
    });

    this.updateFilteredTrips();
  }

  private compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  generateSummary(): void {
    if (!this.reportData?.trips || this.reportData.trips.length === 0) {
      this.reportSummary = null;
      return;
    }

    const trips = this.reportData.trips;

    // Prepare expense type summary
    const expenseTypes: Record<string, ExpenseTypeSummary> = {};

    trips.forEach((trip: Trip) => {
      if (trip.expenses) {
        trip.expenses.forEach((expense) => {
          if (!expenseTypes[expense.type]) {
            expenseTypes[expense.type] = { count: 0, amount: 0 };
          }
          expenseTypes[expense.type].count += 1;
          expenseTypes[expense.type].amount += expense.totalPrice || 0;
        });
      }
    });

    const totalExpenses = Object.values(expenseTypes).reduce((sum, type) => sum + type.count, 0);

    // Calculate the total amount from all trips' totalExpenses
    const totalAmount = trips.reduce((sum, trip) => sum + (trip.totalExpenses || 0), 0);

    this.reportSummary = {
      totalTrips: trips.length,
      totalExpenses,
      totalAmount,
      averagePerTrip: trips.length > 0 ? totalAmount / trips.length : 0,
      byExpenseType: expenseTypes
    };
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
