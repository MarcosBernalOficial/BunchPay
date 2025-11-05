import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { map, shareReplay } from 'rxjs';

import { AuthService } from '../../../features/auth/services/auth.service';
import { Role } from '../../../features/auth/models/auth-response.interface';
import { AccountService } from '../../account/services/account.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { AccountSummary } from '../../account/models/account.interface';
import { Transaction } from '../../transactions/models/transaction.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: []
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private transactionService = inject(TransactionService);

  user = this.authService.getCurrentUser();
  Role = Role; // expose enum to template

  // Datos del Home
  accountSummary$ = this.accountService.getAccountSummary().pipe(shareReplay(1));
  recentTransactions$ = this.transactionService
    .getTransactionHistory()
    .pipe(
      map((tx: Transaction[]) => (tx || []).slice(0, 5)),
      shareReplay(1)
    );
}
