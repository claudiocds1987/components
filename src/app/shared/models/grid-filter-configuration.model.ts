import { SelectItem } from "./select-item.model";

export interface GridFilterConfig {
    fieldName: string;
    fieldType: "text" | "select" | "date" | "dateRangeComponent";
    label: string;
    selectItems?: SelectItem[];
}
