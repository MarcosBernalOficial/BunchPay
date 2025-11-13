import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './receipt.component.html',
  styleUrls: ['./receipt.component.css']
})
export class ReceiptComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private txService = inject(TransactionService);
  private sanitizer = inject(DomSanitizer);

  loading = signal(true);
  error = signal<string | null>(null);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  private objectUrl?: string;
  private transactionId?: number;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.transactionId = id ? Number(id) : undefined;
    
    if (!this.transactionId) {
      this.error.set('ID de transacción inválido.');
      this.loading.set(false);
      return;
    }

    this.txService.getReceipt(this.transactionId).subscribe({
      next: (blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
        this.loading.set(false);
      },
      error: (e) => {
        console.error('[Receipt] Error loading PDF', e);
        this.error.set('No se pudo cargar el comprobante. Intenta nuevamente.');
        this.loading.set(false);
      },
    });
  }

  download(): void {
    if (!this.objectUrl || !this.transactionId) return;
    const a = document.createElement('a');
    a.href = this.objectUrl;
    a.download = `comprobante-${this.transactionId}.pdf`;
    a.click();
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }
}
