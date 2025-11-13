import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServicesApiService } from '../../services/services-api.service';
import { ServiceItem, ServicePaymentRequest } from '../../models/service.interface';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit {
  service = signal<ServiceItem | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  loadingService = signal(false);

  form;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private servicesApi: ServicesApiService
  ) {
    this.form = this.fb.group({
      amount: [null as number | null, [Validators.required, Validators.min(1)]],
      reference: ['']
    });
  }

  ngOnInit(): void {
    const serviceId = this.route.snapshot.paramMap.get('id');
    if (serviceId) {
      this.loadService(+serviceId);
    }
  }

  loadService(serviceId: number): void {
    this.loadingService.set(true);
    this.servicesApi.listServices().subscribe({
      next: (services) => {
        const found = services.find(s => s.id === serviceId);
        if (found) {
          this.service.set(found);
        } else {
          this.error.set('Servicio no encontrado');
        }
        this.loadingService.set(false);
      },
      error: (err) => {
        console.error('Error loading service:', err);
        this.error.set('No se pudo cargar el servicio');
        this.loadingService.set(false);
      }
    });
  }

  submit(): void {
    if (this.form.invalid || !this.service()) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const payload: ServicePaymentRequest = {
      serviceId: this.service()!.id,
      amount: this.form.value.amount!,
      reference: this.form.value.reference || undefined
    };

    this.servicesApi.payService(payload).subscribe({
      next: (response) => {
        console.log('Payment success:', response);
        this.success.set('Pago realizado exitosamente');
        this.form.reset();
        this.loading.set(false);
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (err) => {
        console.warn('Payment error:', err);
        const errorMsg = err?.error?.message || err?.message || 'Error al procesar el pago';
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }
}
