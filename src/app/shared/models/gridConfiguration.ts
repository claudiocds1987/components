export interface GridConfiguration {
    columns: Column[];
    OrderBy: OrderBy;
    withPagination: PaginationConfig | false;
    withInputSearch: boolean;
    withExcelDownload: boolean; // opcional, si se define, se muestra el botón de descarga a Excel
}

export interface Column {
    name: string;
    width?: string; // opcional, si no se define, se usa el ancho por defecto
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

// Esta función crea una configuración de grilla por defecto
export function createDefaultGridConfiguration(
    config?: Partial<GridConfiguration>,
): GridConfiguration {
    return {
        columns:
            config?.columns?.map(
                (col): Column => ({
                    name: col.name ?? "",
                    width: col.width,
                    icon: col.icon
                        ? {
                              name: col.icon.name ?? "",
                              align: col.icon.align ?? "left",
                          }
                        : undefined,
                }),
            ) ?? [],
        OrderBy: {
            columnName: config?.OrderBy?.columnName ?? "",
            direction: config?.OrderBy?.direction ?? "asc",
        },
        withPagination:
            config?.withPagination !== false
                ? {
                      pageSize: config?.withPagination?.pageSize ?? 25,
                      pageSizeOptions: config?.withPagination
                          ?.pageSizeOptions ?? [10, 25, 50, 100],
                  }
                : false,
        withInputSearch: config?.withInputSearch ?? true,
        withExcelDownload: config?.withExcelDownload ?? false,
    };
}
