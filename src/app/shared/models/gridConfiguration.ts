export interface Column {
    name: string;
    width?: string;
    align?: "left" | "center" | "right";
    isSortable?: boolean;
    hasHeaderTooltip?: boolean;
}

export interface PaginationConfig {
    pageIndex: number;
    pageSize: number;
    pageSizeOptions: number[];
    totalCount: number;
    isServerSide?: boolean; // True if pagination is handled by the server
}

export interface OrderBy {
    columnName: string;
    direction: "asc" | "desc" | "";
}

// !!! NEW: Define and export GridDataItem interface !!!
// This interface represents a single row of data in your grid.
// It's typically a simple key-value pair, where the key is the column name.
export type GridDataItem = Record<
    string,
    string | number | boolean | Date | null | undefined
>;

export interface GridConfiguration {
    columns: Column[];
    hasPagination?: PaginationConfig | false; // Can be a config object or false
    hasInputSearch?: boolean; // Controls the visibility of the search input
    filterByColumn?: string; // If searching only applies to a specific column
    withExcelDownload?: boolean; // Controls the visibility of an Excel download button
    OrderBy: OrderBy; // Initial sorting state
    hasSorting?: {
        isServerSide: boolean;
    };
}

// Function updated to create the default configuration
export const createDefaultGridConfiguration = (
    config: Partial<GridConfiguration>,
): GridConfiguration => {
    const defaultPagination: PaginationConfig = {
        pageIndex: 0,
        pageSize: 25,
        pageSizeOptions: [5, 10, 25, 100],
        totalCount: 0,
        isServerSide: false,
    };

    const defaultOrderBy: OrderBy = {
        columnName: "id",
        direction: "asc",
    };

    let finalPaginationConfig: PaginationConfig | false;

    if (config.hasPagination === false) {
        finalPaginationConfig = false;
    } else if (config.hasPagination) {
        finalPaginationConfig = {
            ...defaultPagination,
            ...config.hasPagination,
        };
    } else {
        finalPaginationConfig = defaultPagination;
    }

    let finalHasSorting: { isServerSide: boolean };
    if (config.hasSorting) {
        finalHasSorting = {
            isServerSide: config.hasSorting.isServerSide ?? false,
        };
    } else {
        finalHasSorting = { isServerSide: false };
    }

    // Procesar las columnas para establecer isSortable por defecto
    const processedColumns: Column[] = (config.columns || []).map((col) => ({
        ...col,
        isSortable: col.isSortable ?? true, // Si isSortable es undefined o null, se establece en true
    }));

    return {
        //columns: config.columns || [],
        columns: processedColumns,
        hasPagination: finalPaginationConfig,
        hasInputSearch: config.hasInputSearch ?? true,
        filterByColumn: config.filterByColumn ?? "",
        withExcelDownload: config.withExcelDownload ?? false,
        OrderBy: config.OrderBy
            ? { ...defaultOrderBy, ...config.OrderBy }
            : defaultOrderBy,
        hasSorting: finalHasSorting,
    };
};
