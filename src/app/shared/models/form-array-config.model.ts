import { SelectItem } from "./select-item.model";

/* export interface FormArrayConfig {
    //columnPosition: number; // Posición visual del campo en la grilla (para ordenar)
    fieldName: string;
    fieldType: "text" | "select" | "date" | "number" | "email" | "radio-button";
    label?: string;
    placeHolder?: string;
    selectItems?: SelectItem[]; // Requerido solo para 'select'
    validations?: { type: ValidationKey; value?: number | string }[];
    isReadOnly?: boolean;
    // isRepeated: false => El valor seleccionado en esta fila desaparece de los select de otras filas (Unicidad).
    // isRepeated: true => El valor seleccionado puede ser repetido en otras filas.
    isRepeated: boolean;
    emitChangeToParent?: boolean; // Indica si este campo debe disparar un evento de salida (Output) al cambiar su valor.
}

// Enum para definir los tipos de validaciones soportadas.
export enum ValidationKey {
    required = "required",
    minLength = "minLength",
    maxLength = "maxLength",
    email = "email",
    validateRange = "validateRange", // para rango de fechas inputs indivuduales fecha1 y fecha 2
}
 */

// --- 1. Definición de Modelos de Opciones ---

// Modelo para el Select (asumiendo que viene de un archivo 'select-item.model')

// --- 1. Definición de Modelos de Opciones ---

export interface RadioOption {
    value: number | string;
    optionName: string;
}

// --- 2. Definición del Enum de Validaciones ---

export enum ValidationKey {
    required = "required",
    minLength = "minLength",
    maxLength = "maxLength",
    email = "email",
    validateRange = "validateRange",
}

// --- 3. Interfaces de Propiedades Específicas ---

interface SelectProperties {
    selectItems: SelectItem[];
}

interface RadioButtonProperties {
    radioOptions: RadioOption[];
}

interface BaseFormArrayConfig {
    fieldName: string;
    label?: string;
    placeHolder?: string;
    validations?: { type: ValidationKey; value?: number | string }[];
    isReadOnly?: boolean;
    isRepeated: boolean;
    emitChangeToParent?: boolean;
}

export type FormArrayConfig =
    // Tipo: Text, Number, Email (Ahora usan placeHolder de BaseFormArrayConfig)
    | (BaseFormArrayConfig & { fieldType: "text" | "number" | "email" })

    // Tipo: Select
    | (BaseFormArrayConfig & SelectProperties & { fieldType: "select" })

    // Tipo: Radio-Button
    | (BaseFormArrayConfig &
          RadioButtonProperties & { fieldType: "radio-button" })
    // Tipo: Date
    | (BaseFormArrayConfig & { fieldType: "date" });
