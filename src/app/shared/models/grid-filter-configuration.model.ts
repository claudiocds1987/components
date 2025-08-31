/* export interface SelectItem {
    value: string | boolean; // Puede ser string o booleano para el filtro 'status'
    label: string;
} */

import { SelectItem } from "./select-item.model";

export interface GridFilterConfig {
    fieldName: string;
    fieldType: "text" | "select" | "date" | "dateRange";
    label: string;
    selectItems?: SelectItem[]; // Required only for 'select' type
}
