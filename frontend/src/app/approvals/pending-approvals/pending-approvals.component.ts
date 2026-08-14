import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
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

import { ApprovalService } from '../services/approval.service';
import { Trip } from '../../trips/models/trip.model';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './pending-approvals.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./pending-approvals.component.scss']
})
export class PendingApprovalsComponent implements OnInit {
  pendingApprovals: Trip[] = [];
  filteredApprovals: Trip[] = [];
  displayedColumns: string[] = ['id', 'name', 'startDate', 'endDate', 'totalExpenses', 'actions'];
  loading = true;

  pageSize = 10;
  pageIndex = 0;
  totalTrips = 0;

  constructor(
    private approvalService: ApprovalService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  loadPendingApprovals(): void {
    this.loading = true;
    this.approvalService.getPendingApprovals().subscribe({
      next: (trips) => {
        this.pendingApprovals = trips;
        this.totalTrips = trips.length;
        this.updateFilteredApprovals();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading pending approvals', error);
        this.snackBar.open('Error loading pending approvals. Please try again.', 'Close', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  updateFilteredApprovals(): void {
    const startIndex = this.pageIndex * this.pageSize;
    this.filteredApprovals = this.pendingApprovals.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateFilteredApprovals();
  }

  sortData(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.filteredApprovals = [...this.pendingApprovals];
      return;
    }

    this.pendingApprovals.sort((a, b) => {
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

    this.updateFilteredApprovals();
  }

  private compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
