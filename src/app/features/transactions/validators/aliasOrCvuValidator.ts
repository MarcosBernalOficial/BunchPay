import { AbstractControl, ValidationErrors } from "@angular/forms";

export function aliasOrCvuValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value || '').trim();

    if(!value) {
        return { required: true }; //Si esta vacio el campo
    }

    const cvuPattern = /^\d{22}$/; //El cvu tiene 22 digitos
    const aliasPattern = /^[a-zA-Z0-9._]{6,}$/; //El alias son 6 caracteres minimos, letras, numeros y . o _
    
    if(cvuPattern.test(value) || aliasPattern.test(value)) {
        return null; //Es valido
    }

    return {invalidCvuOrAlias: true}; //No es valido ni el cvu ni el alias

}