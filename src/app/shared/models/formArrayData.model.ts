import { SelectItem } from "./select-item.model";

export interface FormArrayConfig {
    //columnPosition: number; // Posición visual del campo en la grilla (para ordenar)
    fieldName: string;
    fieldType: "text" | "select" | "date" | "number" | "email";
    label?: string;
    placeHolder: string;
    selectItems?: SelectItem[]; // Requerido solo para 'select'
    validations?: { type: ValidationKey; value?: number | string }[];
    isReadOnly?: boolean;
    // isRepeated: false => El valor seleccionado en esta fila desaparece de los select de otras filas (Unicidad).
    // isRepeated: true => El valor seleccionado puede ser repetido en otras filas.
    isRepeated: boolean;
}

/** Enum para definir los tipos de validaciones soportadas. */
export enum ValidationKey {
    required = "required",
    minLength = "minLength",
    maxLength = "maxLength",
    email = "email",
    lessThan = "lessThan", // para validacion de fecha cam,biar noimbre a lessThanDate
    validateRange = "validateRange",
}
