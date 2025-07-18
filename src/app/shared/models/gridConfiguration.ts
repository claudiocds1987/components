/************************************************************************************************** 
IMPORTANTE:

Este archivo define la configuración de la grilla que se usa en el componente GridComponent.
Si se agrega una "nueva interface" o una "nueva propiedad" dentro de alguna interface,
tambien debe agregarse a la funcion createDefaultGridConfiguration() que esta abajo de todo
para que quede siempre la configuracion actualizada. Caso contrario esa propiedad
o interface nueva que agregamos no va a ser reconocida por el componente GridComponent 
***************************************************************************************************/
export interface GridConfiguration {
    columns: Column[];
    OrderBy: OrderBy;
    hasPagination: PaginationConfig | false;
    hasInputSearch: boolean;
    filterByColumn: string;
    withExcelDownload: boolean; // opcional, si se define, se muestra el botón de descarga a Excel
}

export interface Column {
    name: string;
    width?: string; // opcional, si no se define, se usa el ancho por defecto
    icon?: Icon;
    align?: "left" | "right" | "center";
    isSortable?: boolean;
    hasHeaderTooltip?: boolean;
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

export type GridDataItem = Record<string, string | number>;

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
                    align: col.align ?? "left",
                    isSortable: col.isSortable ?? true,
                    hasHeaderTooltip: col.hasHeaderTooltip ?? false,
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
        hasPagination:
            config?.hasPagination !== false
                ? {
                      pageSize: config?.hasPagination?.pageSize ?? 25,
                      pageSizeOptions: config?.hasPagination
                          ?.pageSizeOptions ?? [10, 25, 50, 100],
                  }
                : false,
        hasInputSearch: config?.hasInputSearch ?? true,
        filterByColumn: config?.filterByColumn ?? "",
        withExcelDownload: config?.withExcelDownload ?? false,
    };
}
