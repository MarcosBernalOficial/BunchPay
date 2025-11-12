import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../features/auth/services/auth.service';
import { Role } from '../../../features/auth/models/auth-response.interface';
import { AccountService } from '../../account/services/account.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { AccountSummary } from '../../account/models/account.interface';
import { Transaction } from '../../transactions/models/transaction.interface';
import { DiscountCouponService } from '../services/discount-coupon.service';

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
  private discountCouponService = inject(DiscountCouponService);

  user = this.authService.getCurrentUser();
  Role = Role; // expose enum to template

  // Datos con señales
  accountSummary = this.accountService.accountSummary;
  recentTransactions = computed(() => {
    const list = this.transactionService.transactions() || [];
    // de-duplicate by id when possible, else by stable composite key
    const seenIds = new Set<number>();
    const seenKeys = new Set<string>();
    const uniq: Transaction[] = [];
    for (const tx of list) {
      if (!tx) continue;
      if (tx.transactionId != null) {
        if (seenIds.has(tx.transactionId)) continue;
        seenIds.add(tx.transactionId);
        uniq.push(tx);
      } else {
        const key = [
          tx.date,
          tx.type,
          tx.amount,
          tx.senderCvu || '',
          tx.recieverCvu || ''
        ].join('|');
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        uniq.push(tx);
      }
    }
    uniq.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return uniq.slice(0, 5);
  });
  coupons = this.discountCouponService.coupons;
  couponsLoading = this.discountCouponService.loading;
  couponsError = this.discountCouponService.error;

  // UI state
  showBalance = signal<boolean>(true);
  toggleBalance() {
    this.showBalance.update(v => !v);
  }

  async ngOnInit() {
    await Promise.all([
      this.accountService.loadAccountSummary(),
      this.transactionService.loadTransactionHistory(),
      this.discountCouponService.loadMyActiveCoupons(),
    ]);
  }
}
