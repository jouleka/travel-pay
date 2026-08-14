import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
],
  templateUrl: './unauthorized.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./unauthorized.component.scss']
})
export class UnauthorizedComponent {}
