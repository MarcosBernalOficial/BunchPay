import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { Transaction, TransactionType } from '../../models/transaction.interface';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-transactions-history',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './transactions-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsHistoryComponent implements OnInit {
  private txService = inject(TransactionService);

  loading = signal(false);
  error = signal<string | null>(null);

  transactions = computed(() => {
    const txs = this.txService.transactions();
    return [...txs].reverse();
  });

  async ngOnInit() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.txService.loadTransactionHistory();
      // Log para ver qué datos llegan
      console.log('Transacciones cargadas:', this.transactions());
      if (this.transactions().length > 0) {
        console.log('Primera transacción:', this.transactions()[0]);
      }
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

  getTransactionName(t: Transaction): string {
    const currentUserCvu = this.txService.getCurrentUserCvu();
    if (!currentUserCvu) return t.description || t.type;
    
    // Si tiene datos de sender y receiver, es una transferencia entre usuarios
    // (puede venir como TRANSFERENCIA, RETIRO o DEPOSITO)
    if (t.senderCvu && t.recieverCvu && 
        (t.senderFirstName || t.recieverFirstName)) {
      
      // Si soy el sender (RETIRO), mostrar el receptor
      if (t.senderCvu === currentUserCvu && t.recieverFirstName) {
        return `${t.recieverFirstName} ${t.recieverLastName}`;
      }
      // Si soy el receiver (DEPOSITO), mostrar el sender
      if (t.recieverCvu === currentUserCvu && t.senderFirstName) {
        return `${t.senderFirstName} ${t.senderLastName}`;
      }
    }
    
    // Para otros tipos (pagos, servicios), usar la descripción original
    return t.description || t.type;
  }
}
