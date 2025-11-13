import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { matchFieldsValidator, markAllAsTouched } from '../../../../shared/utils/form-helpers';

@Component({
    selector: 'app-register',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    registerForm: FormGroup;
    showPassword = false;
    showConfirmPassword = false;
    hidePassword = true;
    hideConfirmPassword = true;
    isLoading = false;
    errorMessage = '';
    successMessage = '';

    constructor() {
        this.registerForm = this.fb.group({
        personal: this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)?$/)]],
            lastName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)?$/)]],
            dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
        }),
        credentials: this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [
            Validators.required, 
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            ]],
            confirmPassword: ['', Validators.required],
        }, { validators: matchFieldsValidator('password', 'confirmPassword', 'passwordMismatch') })
        });

        // Limpiar error de conflicto cuando el usuario cambia el email
        const emailCtrl = this.registerForm.get('credentials.email');
        emailCtrl?.valueChanges.subscribe(() => {
            if (emailCtrl.hasError('conflict')) {
                const currentErrors = { ...(emailCtrl.errors || {}) } as any;
                delete currentErrors['conflict'];
                const hasOtherErrors = Object.keys(currentErrors).length > 0;
                emailCtrl.setErrors(hasOtherErrors ? currentErrors : null);
            }
        });
    }

    // Helpers para mensajes dinámicos de contraseña
    get passwordCtrl() {
        return this.registerForm.get('credentials.password');
    }
    get passwordValue(): string {
        return this.passwordCtrl?.value || '';
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


    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPassword() {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    onSubmit() {
        if (this.registerForm.valid) {
        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const { personal, credentials } = this.registerForm.value as any;
        const formData = {
            firstName: personal.firstName,
            lastName: personal.lastName,
            dni: personal.dni,
            email: credentials.email,
            password: credentials.password
        };
        (async () => {
            try {
                await this.authService.register(formData);
                this.successMessage = 'Cuenta creada exitosamente. Redirigiendo al login...';
                this.errorMessage = '';
                this.cdr.markForCheck();
                setTimeout(() => { this.router.navigate(['/auth/login']); }, 2000);
            } catch (error: any) {
                // Normalizado por el servicio: { status, field, message }
                if (error?.status === 409 && (error?.field === 'email' || error?.message?.toLowerCase().includes('email'))) {
                    const emailCtrl = this.registerForm.get('credentials.email');
                    const mergedErrors = { ...(emailCtrl?.errors || {}), conflict: true } as any;
                    emailCtrl?.setErrors(mergedErrors);
                    emailCtrl?.markAsTouched();
                    this.errorMessage = '';
                } else {
                    this.errorMessage = error?.message || 'Error al crear la cuenta. Intenta nuevamente.';
                }
                console.warn('[RegisterComponent] Registro fallido', error);
            } finally {
                this.isLoading = false;
                this.cdr.markForCheck();
            }
        })();
        } else {
        // Marcar todos los campos como touched para mostrar errores
        markAllAsTouched(this.registerForm);
        }
    }
}