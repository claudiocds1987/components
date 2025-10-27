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

        // 💡 Limpieza de errores de rango si los campos están vacíos (o para cualquier caso de salida)
        // Esto previene que el error 'dateRange' persista si el usuario borra la fecha.
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
        // Lógica: Fecha Desde > Fecha Hasta
        // ----------------------------------------------------
        if (dateFrom.getTime() < dateTo.getTime()) {
            // 1. Aplicamos el error en Fecha Desde.
            // setErrors con un objeto existente fusiona el error de rango con los actuales.
            dateFromControl.setErrors({
                ...dateFromControl.errors,
                dateRange: {
                    message:
                        "La Fecha Hasta no puede ser posterior a la Fecha Desde.",
                    actual: dateFromControl.value,
                    target: dateToControl.value,
                },
            });

            // 2. Limpiamos explícitamente el error de rango del campo 'Hasta'
            clearRangeError(dateToControl);

            return null;
        } else {
            // VÁLIDO: Fecha Desde <= Fecha Hasta

            // Limpiamos los errores de rango en AMBOS controles.
            clearRangeError(dateFromControl);
            clearRangeError(dateToControl);

            return null;
        }
    };
}
