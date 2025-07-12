export interface GridConfiguration {
    columns: Column[];
    OrderBy: OrderBy;
    withPagination: PaginationConfig | false;
    withInputSearch: boolean;
}

export interface Column {
    name: string;
    icon?: Icon;
}

export interface Icon {
    name: string;
    align: "left" | "right";
}

export interface OrderBy {
    columnName: string;
    direction: "asc" | "desc";
}

export interface PaginationConfig {
    pageSize: number;
    pageSizeOptions: number[];
}
