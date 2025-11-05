import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AdminSupportService, SupportDto } from '../../services/admin-support.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Router } from '@angular/router';
import { markAllAsTouched } from '../../../../shared/utils/form-helpers';

@Component({
  selector: 'app-admin-supports',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-supports.component.html',
  styleUrls: ['./admin-supports.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSupportsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AdminSupportService);
  private auth = inject(AuthService);
  private router = inject(Router);

  supports: SupportDto[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  private successTimeout: any;
  private errorTimeout: any;

  createForm: FormGroup = this.fb.group({
    personal: this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
    }),
    credentials: this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
      ]],
    })
  });

  // Edición (usaremos createForm para crear/editar)
  editing: SupportDto | null = null;

  // toggles de visibilidad de contraseña
  showCreatePassword = false;

  // Getters para mensajes dinámicos (crear)
  get createPasswordCtrl() { return this.createForm.get('credentials.password'); }
  get createPasswordValue(): string { return (this.createPasswordCtrl?.value as string) || ''; }
  get createPasswordPatternError(): boolean { return !!this.createPasswordCtrl?.errors?.['pattern']; }
  get createNeedsLowercase(): boolean { return this.createPasswordPatternError && !/[a-z]/.test(this.createPasswordValue); }
  get createNeedsUppercase(): boolean { return this.createPasswordPatternError && !/[A-Z]/.test(this.createPasswordValue); }
  get createNeedsNumber(): boolean { return this.createPasswordPatternError && !/\d/.test(this.createPasswordValue); }
  get createNeedsSpecial(): boolean { return this.createPasswordPatternError && !/[^A-Za-z0-9]/.test(this.createPasswordValue); }

  ngOnInit(): void {
    this.refresh();
  }

  async refresh() {
    this.isLoading = true;
    try {
      this.supports = await this.api.listAll();
    } catch (err: any) {
      this.errorMessage = err?.error?.message || 'Error al cargar soportes';
    } finally {
      this.isLoading = false;
    }
  }

  onSubmit() {
    if (this.createForm.invalid) {
      markAllAsTouched(this.createForm);
      return;
    }
    const { personal, credentials } = this.createForm.value as any;
    if (!this.editing) {
      // Crear
      this.isLoading = true;
      const payload = {
        firstName: personal.firstName,
        lastName: personal.lastName,
        email: credentials.email,
        password: credentials.password,
        role: 'SUPPORT' as const,
      };
      (async () => {
        try {
          await this.api.create(payload);
          this.showSuccess('Soporte creado correctamente');
          this.createForm.reset();
          await this.refresh();
        } catch (err: any) {
          if (err?.status === 409 && err?.error?.field === 'email') {
            const emailCtrl = this.createForm.get('credentials.email');
            emailCtrl?.setErrors({ ...(emailCtrl?.errors || {}), conflict: true });
            emailCtrl?.markAsTouched();
            this.clearError();
          } else {
            this.showError(err?.error?.message || 'No se pudo crear el soporte');
          }
        } finally {
          this.isLoading = false;
        }
      })();
    } else {
      // Editar
      this.isLoading = true;
      const payload: any = {
        firstName: personal.firstName,
        lastName: personal.lastName,
      };
      if (credentials.password && String(credentials.password).trim().length > 0) {
        payload.password = credentials.password;
      }
      (async () => {
        try {
          await this.api.update(this.editing!.id!, payload);
          this.showSuccess('Soporte actualizado');
          this.cancelEdit();
          await this.refresh();
        } catch (err: any) {
          this.showError(err?.error?.message || 'No se pudo actualizar');
        } finally {
          this.isLoading = false;
        }
      })();
    }
  }

  beginEdit(s: SupportDto) {
    if (String(s.role).toUpperCase().includes('ADMIN')) {
      this.errorMessage = 'No se puede editar un usuario con rol ADMIN.';
      return;
    }
    this.editing = s;
    // Deshabilitar email y rellenar datos
    const emailCtrl = this.createForm.get('credentials.email');
    emailCtrl?.disable({ emitEvent: false });
    this.createForm.patchValue({
      personal: { firstName: s.firstName, lastName: s.lastName },
      credentials: { email: s.email, password: '' }
    }, { emitEvent: false });
    // Hacer la contraseña opcional en modo edición
    this.applyPasswordValidatorsForMode(false);
  }

  cancelEdit() {
    this.editing = null;
    // Rehabilitar email y limpiar form
    const emailCtrl = this.createForm.get('credentials.email');
    emailCtrl?.enable({ emitEvent: false });
    this.createForm.reset();
    // Contraseña requerida en modo creación
    this.applyPasswordValidatorsForMode(true);
  }

  remove(s: SupportDto) {
    if (String(s.role).toUpperCase().includes('ADMIN')) {
      this.errorMessage = 'No se puede eliminar un usuario con rol ADMIN.';
      return;
    }
    if (!confirm(`¿Eliminar soporte ${s.email}?`)) return;
    this.isLoading = true;
    (async () => {
      try {
        await this.api.remove(s.id!);
        this.showSuccess('Soporte eliminado');
        await this.refresh();
      } catch (err: any) {
        this.showError(err?.error?.message || 'No se pudo eliminar');
      } finally {
        this.isLoading = false;
      }
    })();
  }

  logout() {
    (async () => { try { await this.auth.logout(); } finally { this.router.navigate(['/auth/login']); } })();
  }

  private applyPasswordValidatorsForMode(isCreate: boolean) {
    const ctrl = this.createForm.get('credentials.password');
    if (!ctrl) return;
    if (isCreate) {
      ctrl.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
      ]);
    } else {
      ctrl.setValidators([
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
      ]);
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  private showSuccess(msg: string) {
    this.successMessage = msg;
    if (this.successTimeout) clearTimeout(this.successTimeout);
    this.successTimeout = setTimeout(() => { this.successMessage = ''; }, 5000);
  }

  private showError(msg: string) {
    this.errorMessage = msg;
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorTimeout = setTimeout(() => { this.errorMessage = ''; }, 5000);
  }

  private clearError() {
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorMessage = '';
  }
}
