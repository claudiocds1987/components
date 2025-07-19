export interface GridFilterConfig {
    fieldName: string;
    fieldType: "text" | "date" | "select"; // Se puede añadir más tipos como 'number', etc.
    label: string; // Para mostrar en el input/selector
    selectItems?: SelectItem[]; // Opcional, solo si fieldType es 'select'
}

export interface SelectItem {
    value: string;
    label: string;
}
