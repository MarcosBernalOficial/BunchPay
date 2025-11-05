import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../features/auth/services/auth.service';
import { Role } from '../../../features/auth/models/auth-response.interface';
import { AccountService } from '../../account/services/account.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { AccountSummary } from '../../account/models/account.interface';
import { Transaction } from '../../transactions/models/transaction.interface';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private transactionService = inject(TransactionService);

  user = this.authService.getCurrentUser();
  Role = Role; // expose enum to template

  // Datos con señales
  accountSummary = this.accountService.accountSummary;
  recentTransactions = computed(() => (this.transactionService.transactions() || []).slice(0, 5));

  async ngOnInit() {
    await Promise.all([
      this.accountService.loadAccountSummary(),
      this.transactionService.loadTransactionHistory(),
    ]);
  }
}
