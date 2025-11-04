# Guía de formularios (Reactive Forms + FormBuilder)

Este proyecto estandariza TODOS los formularios con Reactive Forms y FormBuilder. Evitamos formularios template-driven (ngModel/ngForm).

## Patrón básico

1. Importa `ReactiveFormsModule` en el componente standalone.
2. Inyecta `FormBuilder` y crea un `FormGroup` con validaciones.
3. En el template usa `[formGroup]` y `formControlName`.
4. Para mostrar errores, marca los controles como `touched` y usa `*ngIf` sobre `control.invalid && control.touched`.

```ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { markAllAsTouched, matchFieldsValidator } from '@app/shared/utils/form-helpers';

@Component({
  selector: 'app-ejemplo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ejemplo-form.component.html',
})
export class EjemploFormComponent {
  private fb = inject(FormBuilder);
  form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchFieldsValidator('password', 'confirmPassword', 'passwordMismatch') }
  );

  onSubmit() {
    if (this.form.invalid) {
      markAllAsTouched(this.form);
      return;
    }
    // this.form.value para enviar al servicio
  }
}
```

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <input type="email" formControlName="email" />
  <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
    <small *ngIf="form.get('email')?.errors?.['required']">Email requerido</small>
    <small *ngIf="form.get('email')?.errors?.['email']">Email inválido</small>
  </div>

  <input type="password" formControlName="password" />
  <input type="password" formControlName="confirmPassword" />
  <div *ngIf="form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched">
    <small>Las contraseñas no coinciden</small>
  </div>

  <button type="submit" [disabled]="form.invalid">Guardar</button>
</form>
```

## Utilidades disponibles

- `markAllAsTouched(form: FormGroup)`: marca todos los controles como tocados.
- `matchFieldsValidator(field, confirmField, errorKey?)`: validador para comparar dos campos (por defecto genera el error `mismatch`).

Ubicación: `src/app/shared/utils/form-helpers.ts`

## Convenciones

- No usar `[(ngModel)]` ni `ngForm`.
- Las validaciones deben declararse en el TypeScript, no en el template.
- Los botones de submit deben estar deshabilitados cuando `form.invalid`.
- Para nuevos formularios, usa esta guía como plantilla.
