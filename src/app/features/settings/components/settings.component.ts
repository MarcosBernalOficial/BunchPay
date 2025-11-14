import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AccountService } from '../../account/services/account.service';
import { AuthService } from '../../auth/services/auth.service';
import { ClientProfile } from '../../account/models/account.interface';
import { PageHeaderComponent, NavLink } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  navLinks: NavLink[] = [
    { label: 'Home', route: '/dashboard' },
    { label: 'Crypto', route: '/crypto' },
    { label: 'Configuración', route: '/settings' }
  ];

  loadingProfile = false;
  savingProfile = false;
  changingPassword = false;
  showCurrentPassword = false;
  showNewPassword = false;

  message: { type: 'success' | 'error'; text: string } | null = null;

  profileForm = this.fb.group({
    firstName: ['', [
      Validators.required, 
      Validators.minLength(2),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/)
    ]],
    lastName: ['', [
      Validators.required, 
      Validators.minLength(2),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/)
    ]],
    dni: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]
    ],
  });

  get newPasswordCtrl() { return this.passwordForm.get('newPassword'); }
  get newPasswordValue(): string { return (this.newPasswordCtrl?.value as string) || ''; }
  get newPasswordPatternError(): boolean { return !!this.newPasswordCtrl?.errors?.['pattern']; }
  get newPasswordNeedsLowercase(): boolean { return this.newPasswordPatternError && !/[a-z]/.test(this.newPasswordValue); }
  get newPasswordNeedsUppercase(): boolean { return this.newPasswordPatternError && !/[A-Z]/.test(this.newPasswordValue); }
  get newPasswordNeedsNumber(): boolean { return this.newPasswordPatternError && !/\d/.test(this.newPasswordValue); }

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loadingProfile = true;
    (async () => {
      try {
        const p: ClientProfile = await this.accountService.getClientProfile();
        this.profileForm.patchValue({
          firstName: p.firstName,
          lastName: p.lastName,
          dni: p.dni,
          email: p.email,
        });
      } catch {
        this.setMessage('error', 'No se pudo cargar el perfil.');
      } finally {
        this.loadingProfile = false;
      }
    })();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName } = this.profileForm.getRawValue();
    this.savingProfile = true;
    this.setMessage('success', 'Guardando perfil...');
    this.cdr.markForCheck();
    (async () => {
      try {
        const updated = await this.accountService.updateProfile({ firstName: firstName!, lastName: lastName! });
        this.profileForm.patchValue({
          firstName: updated.firstName,
          lastName: updated.lastName
        });
        try { await this.accountService.loadAccountSummary(); } catch {}
        this.setMessage('success', 'Perfil guardado correctamente');
        this.cdr.detectChanges();
      } catch {
        this.setMessage('error', 'No se pudo guardar el perfil');
      } finally {
        this.savingProfile = false;
        this.cdr.detectChanges();
      }
    })();
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.changingPassword = true;
    this.message = { type: 'success', text: 'Guardando contraseña...' };
    this.cdr.markForCheck();
    (async () => {
      try {
        await this.accountService.changePassword({ currentPassword: currentPassword!, newPassword: newPassword! });
        this.setMessage('success', 'Contraseña actualizada correctamente');
        // Resetear el formulario completamente
        this.passwordForm.reset({
          currentPassword: '',
          newPassword: ''
        });
        // Marcar como pristine y untouched
        this.passwordForm.markAsPristine();
        this.passwordForm.markAsUntouched();
        this.cdr.detectChanges();
      } catch (error: any) {
        console.error('Error al cambiar contraseña:', error);
        // Extraer mensaje de error específico del backend
        let errorMsg = 'No se pudo cambiar la contraseña.';
        if (error?.status === 401) {
          errorMsg = 'La contraseña actual es incorrecta.';
        } else if (error?.error?.message) {
          errorMsg = error.error.message;
        } else if (error?.message) {
          errorMsg = error.message;
        }
        this.setMessage('error', errorMsg);
        // Limpiar solo el campo de contraseña actual si falló por credenciales incorrectas
        if (error?.status === 401) {
          this.passwordForm.patchValue({ currentPassword: '' });
          this.passwordForm.get('currentPassword')?.markAsUntouched();
        }
      } finally {
        this.changingPassword = false;
        this.cdr.detectChanges();
      }
    })();
  }

  logout(): void {
    (async () => {
      try { await this.authService.logout(); } finally {
        this.router.navigate(['/auth/login']);
      }
    })();
  }

  goSupport(): void {
    this.router.navigate(['/settings/support']);
  }

  private setMessage(type: 'success' | 'error', text: string) {
    this.message = { type, text };
    this.cdr.markForCheck();
    const timeout = type === 'success' ? 3500 : 5000;
    setTimeout(() => {
      if (this.message?.text === text) {
        this.message = null;
        this.cdr.markForCheck();
      }
    }, timeout);
  }
}
