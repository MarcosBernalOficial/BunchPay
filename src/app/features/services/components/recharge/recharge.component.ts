import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ServicesApiService } from '../../services/services-api.service';
import { RechargeRequest } from '../../models/service.interface';
import { getErrorMessage } from '../../../../shared/utils/error-handler';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-recharge',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PageHeaderComponent],
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
    destination: ['', [Validators.required, this.validateDestination.bind(this)]],
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
      case 'celular': return 'Ej: 2234567890 o 1154321098';
      case 'steam': return 'usuario@gmail.com';
      default: return 'Referencia del servicio';
    }
  }

  validateDestination(control: any): { [key: string]: any } | null {
    const value = control.value;
    if (!value) return null;

    const type = this.rechargeType();

    // Validación para celular: solo números, entre 8 y 13 dígitos (permite diferentes códigos de área)
    if (type === 'celular') {
      const phoneRegex = /^\d{8,13}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        return { invalidPhone: true };
      }
    }

    // Validación para Steam: debe ser Gmail
    if (type === 'steam') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!emailRegex.test(value.trim())) {
        return { invalidSteam: true };
      }
    }

    // Validación para SUBE: exactamente 16 dígitos
    if (type === 'sube') {
      const subeNumber = value.replace(/\s/g, '');
      if (!/^\d{16}$/.test(subeNumber)) {
        return { invalidSube: true };
      }
    }

    return null;
  }

  get destinationError(): string | null {
    const control = this.form.get('destination');
    if (!control?.touched || !control?.errors) return null;

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['invalidPhone']) return 'Número de celular inválido (8-13 dígitos)';
    if (control.errors['invalidSteam']) return 'Debe ser un correo de Gmail válido';
    if (control.errors['invalidSube']) return 'Número de tarjeta SUBE inválido (16 dígitos)';

    return null;
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

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
