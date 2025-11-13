import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { Transaction, TransactionType } from '../../models/transaction.interface';

@Component({
  selector: 'app-transactions-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './transactions-history.component.html',
  styleUrls: ['./transactions-history.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsHistoryComponent implements OnInit {
  private txService = inject(TransactionService);

  loading = signal(false);
  error = signal<string | null>(null);

  transactions = computed(() => this.txService.transactions());

  async ngOnInit() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.txService.loadTransactionHistory();
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'No se pudieron cargar los movimientos.';
      this.error.set(typeof msg === 'string' ? msg : 'No se pudieron cargar los movimientos.');
    } finally {
      this.loading.set(false);
    }
  }

  isNegative(t: Transaction) {
    return t.type === TransactionType.RETIRO || t.type === TransactionType.PAGO;
  }
}
