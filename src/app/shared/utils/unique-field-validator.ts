/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    AbstractControl,
    FormArray,
    ValidatorFn,
    ValidationErrors,
    FormGroup,
} from "@angular/forms";

// Definición de la configuración de campo (sin cambios)
export interface FormArrayConfig {
    fieldName: string;
    fieldType: string; // Puede ser 'date', 'email', 'text', etc.
    isRepeated?: boolean;
}

// 🟢 Nuevo tipo para la lógica del error
type FieldType = "date" | "text" | "email";

// Función auxiliar para detectar y aplicar errores duplicados para un campo específico
function checkAndApplyDuplicates(
    rows: FormArray,
    fieldName: string,
    errorName: string,
): boolean {
    let hasFieldDuplicates = false;
    const values = new Map<string, AbstractControl[]>();

    // 1. PRIMERA PASADA: Llenar el mapa y limpiar errores anteriores
    rows.controls.forEach((group: AbstractControl): void => {
        const control = group.get(fieldName);
        const currentValue = control?.value;

        // Limpiar el error anterior (ej: 'duplicatedEmail')
        if (control?.hasError(errorName)) {
            const { [errorName]: _, ...otherErrors } = control.errors || {};
            control.setErrors(
                Object.keys(otherErrors).length > 0 ? otherErrors : null,
            );
        }

        // Almacenar todos los controles que tienen este valor
        if (currentValue) {
            const mapKey =
                typeof currentValue === "string"
                    ? currentValue.toLowerCase()
                    : currentValue;
            if (!values.has(mapKey)) {
                values.set(mapKey, []);
            }
            values.get(mapKey)!.push(control!);
        }
    });

    // 2. SEGUNDA PASADA: Aplicar el error a TODOS los controles duplicados
    values.forEach((controls): void => {
        if (controls.length > 1) {
            hasFieldDuplicates = true;

            // Aplicar el error a CADA control con ese valor
            controls.forEach((control): void => {
                control.setErrors({
                    ...control.errors,
                    [errorName]: true, // Aplica el error dinámico (ej: duplicatedEmail: true)
                });
            });
        }
    });

    return hasFieldDuplicates;
}

/**
 * Validador a nivel de FormArray que verifica si hay campos duplicados
 * en las filas para los campos marcados como isRepeated: false.
 * @param config La configuración de los campos del FormArray.
 * @returns Una función de validador.
 */
// ESTE VALIDADOR A DIFERENCIA DE OTROS VALIDADORES ES QUE VALIDA A TODAS LAS ROWS DEL FORM ARRAY
// ES DECIR AL FORM ARRAY COMPLETO. LAS OTRAS VALIDACIONES VALIDAN SOLO POR ROW/FILA
export function uniqueFieldValidator(config: FormArrayConfig[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const rows = control as FormArray;
        let hasGlobalError = false;

        // Iterar sobre la configuración para encontrar campos que deben ser únicos
        config.forEach((field): void => {
            if (field.isRepeated === false) {
                // Asumimos que si no es repetido, debe ser único

                let errorName: string;
                let shouldCheck = true;

                // 🟢 1. ASIGNAR EL NOMBRE DEL ERROR SEGÚN EL TIPO DE CAMPO
                switch (field.fieldType as FieldType) {
                    case "date":
                        errorName = "duplicatedDate";
                        break;
                    case "text":
                        errorName = "isDuplicated";
                        break;
                    case "email":
                        errorName = "duplicatedEmail";
                        break;
                    default:
                        // Si no especificamos cómo manejar el tipo, lo ignoramos o ponemos un error genérico
                        errorName = "isDuplicated";
                        shouldCheck = true;
                        break;
                }

                // 🟢 2. LLAMAR A LA FUNCIÓN GENERALIZADA
                if (shouldCheck) {
                    const hasDuplicates = checkAndApplyDuplicates(
                        rows,
                        field.fieldName,
                        errorName,
                    );

                    if (hasDuplicates) {
                        hasGlobalError = true;
                    }
                }
            }
        });

        // 3. RETORNAR EL ERROR GLOBAL (opcional, pero ayuda a debuggear el FormArray)
        return hasGlobalError ? { hasDuplicates: true } : null;
    };
}
