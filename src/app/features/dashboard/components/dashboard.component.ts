import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../features/auth/services/auth.service';
import { Role } from '../../../features/auth/models/auth-response.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: []
})
export class DashboardComponent {
  private authService = inject(AuthService);

  user = this.authService.getCurrentUser();
  Role = Role; // expose enum to template
}
