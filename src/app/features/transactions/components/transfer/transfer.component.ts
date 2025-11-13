import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TransactionService } from '../../../transactions/services/transaction.service';
import { getErrorMessage } from '../../../../shared/utils/error-handler';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferComponent {
  private fb = inject(FormBuilder);
  private txService = inject(TransactionService);
  private router = inject(Router);

  loading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  private pendingOperationId: string | null = null;
  private static readonly OP_ID_KEY = 'transfer:pendingOpId';
  private static readonly OP_ID_TS_KEY = 'transfer:pendingOpTs';
  private static readonly OP_ID_TTL_MS = 20000; // 20s ventana de idempotencia en el cliente

  form = this.fb.group({
    receiverAlias: [''],
    receiverCVU: [''],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.maxLength(120)]]
  });

  get alias() { return this.form.get('receiverAlias'); }
  get cvu() { return this.form.get('receiverCVU'); }
  get amount() { return this.form.get('amount'); }

  async submit() {
    if (this.loading()) return;
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

  const { receiverAlias, receiverCVU, amount, description } = this.form.value;
  // Reutilizar operationId entre reintentos por una ventana corta
  const now = Date.now();
  if (!this.pendingOperationId) {
    // Intentar recuperar de sessionStorage si no expiró
    try {
      const storedId = sessionStorage.getItem(TransferComponent.OP_ID_KEY);
      const storedTs = sessionStorage.getItem(TransferComponent.OP_ID_TS_KEY);
      const ts = storedTs ? parseInt(storedTs, 10) : 0;
      if (storedId && ts && now - ts < TransferComponent.OP_ID_TTL_MS) {
        this.pendingOperationId = storedId;
      } else {
        this.pendingOperationId = crypto.randomUUID();
      }
    } catch {
      this.pendingOperationId = crypto.randomUUID();
    }
  }
  const operationId = this.pendingOperationId;
  // Persistir/renovar TTL
  try {
    sessionStorage.setItem(TransferComponent.OP_ID_KEY, operationId);
    sessionStorage.setItem(TransferComponent.OP_ID_TS_KEY, String(now));
  } catch {}

  // LOG: Ver cómo y con qué datos se envía la transferencia desde el componente
  console.log('[TransferComponent] Submitting transfer', {
    ts: new Date().toISOString(),
    operationId,
    payload: {
      receiverAlias: receiverAlias || undefined,
      receiverCVU: receiverCVU || undefined,
      description: description || '',
      amount
    },
    loadingBefore: this.loading()
  });

    if ((!receiverAlias || receiverAlias.trim()==='') && (!receiverCVU || receiverCVU.trim()==='')) {
      this.errorMessage.set('Ingresá un Alias o un CVU de destino.');
      return;
    }

    this.loading.set(true);
    try {
      const msg = await this.txService.makeTransfer({
        receiverAlias: receiverAlias || undefined,
        receiverCVU: receiverCVU || undefined,
        description: description || '',
        amount: amount as number,
        operationId
      });
      this.successMessage.set(msg || 'Transferencia realizada con éxito');
      console.log('[TransferComponent] Transfer success', { ts: new Date().toISOString(), operationId, msg });
      this.form.reset();
      setTimeout(()=>{ this.successMessage.set(null); }, 4000);
    } catch (e: any) {
      console.error('[TransferComponent] Transfer error', { ts: new Date().toISOString(), operationId, error: e });
      const errorMsg = getErrorMessage(e, 'No se pudo realizar la transferencia. Intentá nuevamente.');
      this.errorMessage.set(errorMsg);
    } finally {
      this.loading.set(false);
      // Solo limpiar operationId si hubo éxito; si hubo error, conservarlo para reintentos idempotentes
      if (this.successMessage()) {
        this.pendingOperationId = null;
        try {
          sessionStorage.removeItem(TransferComponent.OP_ID_KEY);
          sessionStorage.removeItem(TransferComponent.OP_ID_TS_KEY);
        } catch {}
      } else {
        // renovar TTL para permitir un reintento rápido
        try { sessionStorage.setItem(TransferComponent.OP_ID_TS_KEY, String(Date.now())); } catch {}
      }
      setTimeout(()=> this.errorMessage.set(null), 5000);
    }
  }
}
