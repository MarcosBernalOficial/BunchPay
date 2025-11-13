import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ServicesApiService } from '../../services/services-api.service';
import { RechargeRequest } from '../../models/service.interface';
import { getErrorMessage } from '../../../../shared/utils/error-handler';

@Component({
  selector: 'app-recharge',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './recharge.component.html',
  styleUrls: ['./recharge.component.css']
})
export class RechargeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private servicesApi = inject(ServicesApiService);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  rechargeType = signal<string>('sube');

  form = this.fb.group({
    destination: ['', [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  /**
   * Formatea el número de tarjeta SUBE: agrega espacios cada 4 dígitos
   * Máximo 16 dígitos (formato: XXXX XXXX XXXX XXXX)
   */
  formatSubeCard(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\s/g, ''); // Remover espacios
    value = value.replace(/\D/g, ''); // Solo números
    value = value.substring(0, 16); // Máximo 16 dígitos
    
    // Agregar espacios cada 4 dígitos
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    
    this.form.patchValue({ destination: formatted }, { emitEvent: false });
  }

  ngOnInit(): void {
    const type = this.route.snapshot.queryParamMap.get('type');
    if (type) {
      this.rechargeType.set(type);
    }
  }

  get identifierLabel(): string {
    switch (this.rechargeType()) {
      case 'sube': return 'Número de tarjeta SUBE';
      case 'celular': return 'Número de celular';
      case 'steam': return 'Email de Steam';
      default: return 'Referencia';
    }
  }

  get identifierPlaceholder(): string {
    switch (this.rechargeType()) {
      case 'sube': return '6061 2345 6789 0123';
      case 'celular': return '1112345678';
      case 'steam': return 'usuario@gmail.com';
      default: return 'Referencia del servicio';
    }
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const payload: RechargeRequest = {
      type: this.rechargeType(),
      destination: this.rechargeType() === 'sube' 
        ? this.form.value.destination!.replace(/\s/g, '') // Remover espacios para SUBE
        : this.form.value.destination!,
      amount: this.form.value.amount!,
    };

    this.servicesApi.recharge(payload).subscribe({
      next: (msg) => {
        this.success.set(msg || 'Recarga realizada con éxito.');
        this.form.reset();
        this.loading.set(false);
        setTimeout(() => this.success.set(null), 4000);
      },
      error: (e) => {
        const errorMsg = getErrorMessage(e, 'No se pudo realizar la recarga. Intentá nuevamente.');
        this.error.set(errorMsg);
        this.loading.set(false);
      },
    });
  }
}
