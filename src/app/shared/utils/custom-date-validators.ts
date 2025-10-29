// En custom.date-validators.ts

import {
    AbstractControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
} from "@angular/forms";

// Función auxiliar para limpiar un error específico manteniendo los demás
function clearRangeError(control: AbstractControl | null): void {
    if (!control || !control.errors) {
        return;
    }

    const currentErrors = control.errors;
    const newErrors: ValidationErrors = { ...currentErrors };

    // Eliminamos solo la clave 'dateRange' si existe
    if (newErrors["dateRange"] !== undefined) {
        delete newErrors["dateRange"];
    }

    // Si el objeto de errores queda vacío, establecemos null.
    if (Object.keys(newErrors).length === 0) {
        control.setErrors(null);
    } else {
        // Mantenemos los errores restantes (ej. required, minLength)
        control.setErrors(newErrors);
    }
}

export function dateRangeValidator(
    dateFromControlName: string,
    dateToControlName: string,
): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        if (!(group instanceof FormGroup)) return null;

        const dateFromControl = group.get(dateFromControlName);
        const dateToControl = group.get(dateToControlName);

        // Si faltan valores, limpiamos ambos y salimos.
        if (!dateFromControl?.value || !dateToControl?.value) {
            clearRangeError(dateFromControl);
            clearRangeError(dateToControl);
            return null;
        }

        const dateFrom = new Date(dateFromControl.value);
        const dateTo = new Date(dateToControl.value);

        // Normalización: Comparar solo el día local.
        dateFrom.setHours(0, 0, 0, 0);
        dateTo.setHours(0, 0, 0, 0);

        // ----------------------------------------------------
        // Lógica de Validación: Fecha Desde > Fecha Hasta (Caso de Error)
        // ----------------------------------------------------
        if (dateFrom.getTime() > dateTo.getTime()) {
            // 1. Aplicamos el error 'dateRange' SÓLO en el control 'Fecha Hasta'.
            dateToControl.setErrors({
                ...dateToControl.errors,
                dateRange: {
                    message:
                        "La fecha final no puede ser anterior a la fecha inicial.", // Mensaje más claro
                    actual: dateToControl.value,
                    target: dateFromControl.value,
                },
            });

            //  AJUSTE CRUCIAL: Forzar que el campo con el error esté touched.
            // Esto dispara la validación en la directiva del campo 'Fecha Hasta'.
            if (!dateToControl.touched) {
                dateToControl.markAsTouched();
            }

            // 2. Limpiamos explícitamente el error de rango del campo 'Desde'.
            clearRangeError(dateFromControl);

            // Devolvemos un error a nivel de grupo (opcional)
            return { dateRangeInvalid: true };
        } else {
            // VÁLIDO: Fecha Desde <= Fecha Hasta

            // Limpiamos los errores de rango en AMBOS controles.
            clearRangeError(dateFromControl);
            clearRangeError(dateToControl);

            return null;
        }
    };
}
