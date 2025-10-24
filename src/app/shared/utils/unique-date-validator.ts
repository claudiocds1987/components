/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    AbstractControl,
    FormArray,
    ValidatorFn,
    ValidationErrors,
    FormGroup,
} from "@angular/forms";

// Definición de la configuración de campo para poder usarla
export interface FormArrayConfig {
    fieldName: string;
    fieldType: string;
    isRepeated?: boolean;
}

/**
 * Validador a nivel de FormArray que verifica si hay fechas duplicadas
 * en las filas para los campos marcados como isRepeated: true.
 * @param config La configuración de los campos del FormArray.
 * @returns Una función de validador.
 */

export function uniqueDateValidator(config: FormArrayConfig[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const rows = control as FormArray;
        let hasGlobalError = false;

        config.forEach((field): void => {
            if (field.fieldType === "date" && field.isRepeated === false) {
                const dateValues = new Map<string, AbstractControl[]>();

                // PRIMERA PASADA: Llenar el mapa y limpiar errores anteriores
                rows.controls.forEach((group: AbstractControl): void => {
                    const dateControl = group.get(field.fieldName);

                    // Limpiar el error 'duplicatedDate' anterior en TODOS los controles
                    if (dateControl?.hasError("duplicatedDate")) {
                        const { duplicatedDate: _, ...otherErrors } =
                            dateControl.errors || {};
                        dateControl.setErrors(
                            Object.keys(otherErrors).length > 0
                                ? otherErrors
                                : null,
                        );
                    }

                    const currentValue = dateControl?.value;

                    if (currentValue) {
                        // Almacenar todos los controles que tienen este valor
                        if (!dateValues.has(currentValue)) {
                            dateValues.set(currentValue, []);
                        }
                        dateValues.get(currentValue)!.push(dateControl!);
                    }
                });

                // ... (El resto del validador para aplicar los errores duplicatedDate permanece sin cambios) ...

                // SEGUNDA PASADA: Aplicar el error a TODOS los controles duplicados
                dateValues.forEach((controls): void => {
                    if (controls.length > 1) {
                        hasGlobalError = true;

                        // Aplicar el error a CADA control con ese valor
                        controls.forEach((dateControl): void => {
                            // Aplica el error sin eliminar otros (ej: required)
                            dateControl.setErrors({
                                ...dateControl.errors,
                                duplicatedDate: true,
                            });
                        });
                    }
                });
            }
        });

        return hasGlobalError ? { hasDateDuplicates: true } : null;
    };
}
