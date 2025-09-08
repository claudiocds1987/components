import { SelectItem } from "./select-item.model";

export interface GridFilterConfig {
    fieldName: string;
    fieldType: "text" | "select" | "date" | "dateRange";
    label: string;
    selectItems?: SelectItem[]; // Required only for 'select' type
}
