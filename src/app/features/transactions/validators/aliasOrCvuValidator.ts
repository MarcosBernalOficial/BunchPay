import { AbstractControl, ValidationErrors } from "@angular/forms";

export function aliasOrCvuValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value || '').trim();

    if(!value) {
        return { required: true };
    }

    const cvuPattern = /^\d{22}$/;
    const aliasPattern = /^[a-zA-Z0-9._]{6,}$/;
    
    if(cvuPattern.test(value) || aliasPattern.test(value)) {
        return null;
    }

    return {invalidCvuOrAlias: true};

}