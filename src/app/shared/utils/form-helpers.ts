import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';

// Marca todos los controles de un FormGroup como tocados para mostrar errores
export function markAllAsTouched(form: FormGroup): void {
  Object.values(form.controls).forEach(control => {
    control.markAsTouched();
    // Si el control es otro FormGroup, aplicar recursivamente
    if ((control as any).controls) {
      markAllAsTouched(control as FormGroup);
    }
  });
}

// Validador genérico para igualar dos campos (por ejemplo, password y confirmPassword)
export function matchFieldsValidator(
  field: string,
  confirmField: string,
  errorKey: string = 'mismatch'
): ValidatorFn {
  return (group: AbstractControl) => {
    if (!(group instanceof FormGroup)) return null;

    const control = group.get(field);
    const matchingControl = group.get(confirmField);

    if (!control || !matchingControl) return null;

    // No sobreescribir otros errores del matchingControl
    if (matchingControl.errors && !matchingControl.errors[errorKey]) {
      return null;
    }

    const isMismatch = control.value !== matchingControl.value;
    if (isMismatch) {
      matchingControl.setErrors({ ...(matchingControl.errors || {}), [errorKey]: true });
      return { [errorKey]: true };
    } else {
      // Si ya no hay mismatch, limpiar sólo ese error
      if (matchingControl.errors) {
        const { [errorKey]: _, ...rest } = matchingControl.errors;
        matchingControl.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    }
  };
}
