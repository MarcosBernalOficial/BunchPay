import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AccountService } from '../../account/services/account.service';
import { AuthService } from '../../auth/services/auth.service';
import { ClientProfile } from '../../account/models/account.interface';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loadingProfile = false;
  savingProfile = false;
  changingPassword = false;

  message: { type: 'success' | 'error'; text: string } | null = null;

  profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    dni: ['', [Validators.required, Validators.maxLength(20)]],
    email: [{ value: '', disabled: true }],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
      ]
    ],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loadingProfile = true;
    this.accountService.getClientProfile()
      .pipe(finalize(() => (this.loadingProfile = false)))
      .subscribe({
        next: (p: ClientProfile) => {
          this.profileForm.patchValue({
            firstName: p.firstName,
            lastName: p.lastName,
            dni: p.dni,
            email: p.email,
          });
        },
        error: () => this.setMessage('error', 'No se pudo cargar el perfil.')
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, dni } = this.profileForm.getRawValue();
    this.savingProfile = true;
    this.accountService
      .updateProfile({ firstName: firstName!, lastName: lastName!, dni: dni! })
      .pipe(finalize(() => (this.savingProfile = false)))
      .subscribe({
        next: () => this.setMessage('success', 'Perfil actualizado'),
        error: () => this.setMessage('error', 'No se pudo actualizar el perfil')
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.changingPassword = true;
    this.accountService
      .changePassword({ currentPassword: currentPassword!, newPassword: newPassword! })
      .pipe(finalize(() => (this.changingPassword = false)))
      .subscribe({
        next: () => {
          this.setMessage('success', 'Contraseña actualizada');
          this.passwordForm.reset();
        },
        error: () => this.setMessage('error', 'No se pudo cambiar la contraseña. Verificá la actual.')
      });
  }

  logout(): void {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/auth/login'])
    });
  }

  goSupport(): void {
    // Por ahora navega a una ruta placeholder hasta implementar el chat
    this.router.navigate(['/settings/support']);
  }

  private setMessage(type: 'success' | 'error', text: string) {
    this.message = { type, text };
    setTimeout(() => (this.message = null), 4000);
  }
}
