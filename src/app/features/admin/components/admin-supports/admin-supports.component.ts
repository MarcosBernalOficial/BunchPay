import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AdminSupportService, SupportDto } from '../../services/admin-support.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Router } from '@angular/router';
import { markAllAsTouched } from '../../../../shared/utils/form-helpers';

@Component({
  selector: 'app-admin-supports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgFor],
  templateUrl: './admin-supports.component.html',
  styleUrls: ['./admin-supports.component.css']
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

  // Edición
  editing: SupportDto | null = null;
  editForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    // opcional; si se completa, debe cumplir políticas de seguridad
    password: ['', [
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
    ]]
  });

  // toggles de visibilidad de contraseña
  showCreatePassword = false;
  showEditPassword = false;

  // Getters para mensajes dinámicos (crear)
  get createPasswordCtrl() { return this.createForm.get('credentials.password'); }
  get createPasswordValue(): string { return (this.createPasswordCtrl?.value as string) || ''; }
  get createPasswordPatternError(): boolean { return !!this.createPasswordCtrl?.errors?.['pattern']; }
  get createNeedsLowercase(): boolean { return this.createPasswordPatternError && !/[a-z]/.test(this.createPasswordValue); }
  get createNeedsUppercase(): boolean { return this.createPasswordPatternError && !/[A-Z]/.test(this.createPasswordValue); }
  get createNeedsNumber(): boolean { return this.createPasswordPatternError && !/\d/.test(this.createPasswordValue); }
  get createNeedsSpecial(): boolean { return this.createPasswordPatternError && !/[^A-Za-z0-9]/.test(this.createPasswordValue); }

  // Getters para mensajes dinámicos (editar)
  get editPasswordCtrl() { return this.editForm.get('password'); }
  get editPasswordValue(): string { return (this.editPasswordCtrl?.value as string) || ''; }
  get editPasswordPatternError(): boolean { return !!this.editPasswordCtrl?.errors?.['pattern']; }
  get editNeedsLowercase(): boolean { return this.editPasswordPatternError && !/[a-z]/.test(this.editPasswordValue); }
  get editNeedsUppercase(): boolean { return this.editPasswordPatternError && !/[A-Z]/.test(this.editPasswordValue); }
  get editNeedsNumber(): boolean { return this.editPasswordPatternError && !/\d/.test(this.editPasswordValue); }
  get editNeedsSpecial(): boolean { return this.editPasswordPatternError && !/[^A-Za-z0-9]/.test(this.editPasswordValue); }

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.isLoading = true;
    this.api.listAll().subscribe({
      next: (data) => { this.supports = data; this.isLoading = false; },
      error: (err) => { this.errorMessage = err?.error?.message || 'Error al cargar soportes'; this.isLoading = false; }
    });
  }

  onCreate() {
    if (this.createForm.invalid) {
      markAllAsTouched(this.createForm);
      return;
    }
    this.isLoading = true;
    const { personal, credentials } = this.createForm.value as any;
    const payload = {
      firstName: personal.firstName,
      lastName: personal.lastName,
      email: credentials.email,
      password: credentials.password,
      role: 'SUPPORT' as const,
    };
    this.api.create(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Soporte creado correctamente';
        this.createForm.reset();
        this.refresh();
      },
      error: (err) => {
        this.isLoading = false;
        if (err?.status === 409 && err?.error?.field === 'email') {
          const emailCtrl = this.createForm.get('credentials.email');
          emailCtrl?.setErrors({ ...(emailCtrl?.errors || {}), conflict: true });
          emailCtrl?.markAsTouched();
          this.errorMessage = '';
        } else {
          this.errorMessage = err?.error?.message || 'No se pudo crear el soporte';
        }
      }
    });
  }

  beginEdit(s: SupportDto) {
    this.editing = s;
    this.editForm.reset({
      firstName: s.firstName,
      lastName: s.lastName,
      password: ''
    });
  }

  cancelEdit() {
    this.editing = null;
    this.editForm.reset();
  }

  saveEdit() {
    if (!this.editing) return;
    if (this.editForm.invalid) { markAllAsTouched(this.editForm); return; }
    const { firstName, lastName, password } = this.editForm.value as any;
    const payload: any = { firstName, lastName };
    if (password && String(password).trim().length > 0) {
      payload.password = password;
    }
    this.isLoading = true;
    this.api.update(this.editing.id!, payload).subscribe({
      next: () => { this.isLoading = false; this.successMessage = 'Soporte actualizado'; this.editing = null; this.refresh(); },
      error: (err) => { this.isLoading = false; this.errorMessage = err?.error?.message || 'No se pudo actualizar'; }
    });
  }

  remove(s: SupportDto) {
    if (!confirm(`¿Eliminar soporte ${s.email}?`)) return;
    this.isLoading = true;
    this.api.remove(s.id!).subscribe({
      next: () => { this.isLoading = false; this.successMessage = 'Soporte eliminado'; this.refresh(); },
      error: (err) => { this.isLoading = false; this.errorMessage = err?.error?.message || 'No se pudo eliminar'; }
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/auth/login'])
    });
  }
}
