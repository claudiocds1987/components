export interface SelectItem {
    value: string;
    label: string;
}

export interface GridFilterConfig {
    fieldName: string;
    fieldType: "text" | "select" | "date";
    label: string;
    selectItems?: SelectItem[]; // Required only for 'select' type
}
