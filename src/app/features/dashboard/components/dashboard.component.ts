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
import { PageHeaderComponent, NavLink } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private transactionService = inject(TransactionService);
  private discountCouponService = inject(DiscountCouponService);

  navLinks: NavLink[] = [
    { label: 'Home', route: '/dashboard' },
    { label: 'Crypto', route: '/crypto' },
    { label: 'Configuración', route: '/settings' }
  ];

  user = this.authService.getCurrentUser();
  Role = Role;

  accountSummary = this.accountService.accountSummary;
  recentTransactions = computed(() => {
    const list = this.transactionService.transactions() || [];
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

  showBalance = signal<boolean>(true);
  copiedCode = signal<string | null>(null);
  copiedAlias = signal<boolean>(false);
  copiedCvu = signal<boolean>(false);
  editingAlias = signal<boolean>(false);
  newAlias = signal<string>('');
  aliasError = signal<string | null>(null);
  aliasSuccess = signal<string | null>(null);
  aliasLoading = signal<boolean>(false);
  
  toggleBalance() {
    this.showBalance.update(v => !v);
  }

  copyCouponCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode.set(code);
      setTimeout(() => this.copiedCode.set(null), 2000);
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
    });
  }

  copyAlias(): void {
    const alias = this.accountSummary()?.alias;
    if (alias) {
      navigator.clipboard.writeText(alias).then(() => {
        this.copiedAlias.set(true);
        setTimeout(() => this.copiedAlias.set(false), 2000);
      }).catch(err => {
        console.error('Error copying alias:', err);
      });
    }
  }

  copyCvu(): void {
    const cvu = this.accountSummary()?.cvu;
    if (cvu) {
      navigator.clipboard.writeText(cvu).then(() => {
        this.copiedCvu.set(true);
        setTimeout(() => this.copiedCvu.set(false), 2000);
      }).catch(err => {
        console.error('Error copying CVU:', err);
      });
    }
  }

  startEditingAlias(): void {
    this.newAlias.set(this.accountSummary()?.alias || '');
    this.editingAlias.set(true);
    this.aliasError.set(null);
    this.aliasSuccess.set(null);
  }

  cancelEditingAlias(): void {
    this.editingAlias.set(false);
    this.newAlias.set('');
    this.aliasError.set(null);
    this.aliasSuccess.set(null);
  }

  validateAlias(alias: string): string | null {
    if (!alias || alias.trim() === '') {
      return 'El alias no puede estar vacío';
    }
    if (alias.length < 6) {
      return 'El alias debe tener al menos 6 caracteres';
    }
    if (alias.length > 20) {
      return 'El alias no puede tener más de 20 caracteres';
    }
    // Validar que solo contenga letras, números, puntos y guiones bajos
    if (!/^[a-zA-Z0-9._]+$/.test(alias)) {
      return 'El alias solo puede contener letras, números, puntos y guiones bajos';
    }
    if (alias === this.accountSummary()?.alias) {
      return 'El nuevo alias debe ser diferente al actual';
    }
    return null;
  }

  async saveAlias(): Promise<void> {
    const alias = this.newAlias().trim();
    const validationError = this.validateAlias(alias);
    
    if (validationError) {
      this.aliasError.set(validationError);
      return;
    }

    this.aliasLoading.set(true);
    this.aliasError.set(null);
    this.aliasSuccess.set(null);

    try {
      await this.accountService.changeAlias({ newAlias: alias });
      this.aliasSuccess.set('Alias actualizado correctamente');
      this.editingAlias.set(false);
      // Recargar resumen para mostrar el nuevo alias
      await this.accountService.loadAccountSummary();
      setTimeout(() => this.aliasSuccess.set(null), 3000);
    } catch (error: any) {
      const errorMsg = error?.error?.message || error?.error || error?.message || 'Error al actualizar el alias';
      if (typeof errorMsg === 'string') {
        if (errorMsg.includes('ya está en uso') || errorMsg.includes('CONFLICT')) {
          this.aliasError.set('Este alias ya está en uso. Elegí otro.');
        } else if (errorMsg.includes('igual al actual')) {
          this.aliasError.set('El nuevo alias debe ser diferente al actual.');
        } else {
          this.aliasError.set(errorMsg);
        }
      } else {
        this.aliasError.set('Error al actualizar el alias');
      }
    } finally {
      this.aliasLoading.set(false);
    }
  }

  async ngOnInit() {
    await Promise.all([
      this.accountService.loadAccountSummary(),
      this.transactionService.loadTransactionHistory(),
      this.discountCouponService.loadMyActiveCoupons(),
    ]);
  }
}
