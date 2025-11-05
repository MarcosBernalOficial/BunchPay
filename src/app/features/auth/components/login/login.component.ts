import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { markAllAsTouched } from '../../../../shared/utils/form-helpers';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      credentials: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)]],
      }),
      rememberMe: [false]
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // Helpers para mensajes dinámicos de contraseña, alineados con register
  get passwordCtrl() {
    return this.loginForm.get('credentials.password');
  }
  get passwordValue(): string {
    return (this.passwordCtrl?.value as string) || '';
  }
  get passwordPatternError(): boolean {
    return !!this.passwordCtrl?.errors?.['pattern'];
  }
  get needsLowercase(): boolean {
    return this.passwordPatternError && !/[a-z]/.test(this.passwordValue);
  }
  get needsUppercase(): boolean {
    return this.passwordPatternError && !/[A-Z]/.test(this.passwordValue);
  }
  get needsNumber(): boolean {
    return this.passwordPatternError && !/\d/.test(this.passwordValue);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { credentials } = this.loginForm.value as any;
      const { email, password } = credentials;

      (async () => {
        try {
          await this.authService.login({ email, password });
          this.isLoading = false;
          if (this.authService.hasRole('ADMIN')) {
            this.router.navigate(['/admin/supports']);
          } else if (this.authService.hasRole('SUPPORT')) {
            this.router.navigate(['/support']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } catch (error: any) {
          this.isLoading = false;
          this.errorMessage = error?.error?.message || 'Error de autenticación. Verifica tus credenciales.';
        }
      })();
    } else {
      // Marcar todos los campos como touched para mostrar errores
      markAllAsTouched(this.loginForm);
    }
  }
}