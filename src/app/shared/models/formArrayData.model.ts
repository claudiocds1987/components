import { SelectItem } from "./select-item.model";

export interface FormArrayData {
    columnPosition: number; // Posición visual del campo en la grilla (para ordenar)
    fieldName: string;
    fieldType: "text" | "select" | "date";
    label: string;
    placeHolder: string;
    selectItems?: SelectItem[]; // Requerido solo para 'select'
    validations?: { type: ValidationKey; value?: any }[];
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
}
