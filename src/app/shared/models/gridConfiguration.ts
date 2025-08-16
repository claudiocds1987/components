// interfaz para las acciones del menú de elipsis
export interface ElipsisAction {
    id?: string | number; // Identificador único de la acción (ej. 'edit', 'delete')
    label: string; // Texto a mostrar en el menú (ej. "Editar", "Eliminar")
    icon?: string; // Nombre del icono de Material (ej. 'edit', 'delete_forever')
    action: (id: number) => void;
    condition?: (row: GridData) => boolean;
}

export interface Column {
    name: string;
    width?: string;
    align?: "left" | "center" | "right";
    isSortable?: boolean;
    hasHeaderTooltip?: boolean;
    // propiedad para indicar que esta columna es de elipsis
    isElipsisColumn?: boolean;
    // propiedad para el icono de la cabecera de la columna (si aplica, ej. 'more_vert')
    headerIcon?: string;
    label?: string; // Añadido para etiquetas de columna personalizadas
    style?: string; // para añadir una clase .scss
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

// Define y exporta la interfaz GridData !!!
// Esta interfaz representa una sola fila de datos de la grilla.
// Es generalmente un par simple clave-valor, donde la clave es el nombre de la columna.
export type GridData = Record<
    string,
    string | number | boolean | Date | null | undefined | ElipsisAction[]
> /*& { id: number | string }*/; // Aseguramos que 'id' exista y sea un número o string

export interface GridConfiguration {
    columns: Column[];
    hasPagination?: PaginationConfig | false; // "false" porque puede no tener paginacion la grilla
    hasInputSearch?: boolean; // Para mostrar o no el input search arriba de la grilla
    filterByColumn?: string; // indica a el input search en que columna hacer la búsqueda
    hasChips?: boolean; // Muestra o no los chips de filtros aplicados
    hasExcelDownload?: boolean; // Muestra o no el boton para descargar el excel
    hasCreateButton?: boolean; // Muestra o no el botón de Crear
    OrderBy: OrderBy;
    hasSorting?: {
        isServerSide: boolean;
    };
}

// Function para crear la configuracion de la grilla por default
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
    const processedColumns: Column[] = (config.columns || []).map(
        (col: Column): Column => ({
            ...col,
            isSortable: col.isSortable ?? true, // Si isSortable es undefined o null, se establece en true
        }),
    );

    return {
        columns: processedColumns,
        hasPagination: finalPaginationConfig,
        hasInputSearch: config.hasInputSearch ?? true,
        filterByColumn: config.filterByColumn ?? "",
        hasExcelDownload: config.hasExcelDownload ?? false,
        hasCreateButton: config.hasCreateButton ?? false,
        hasChips: config.hasChips ?? false,
        OrderBy: config.OrderBy
            ? { ...defaultOrderBy, ...config.OrderBy }
            : defaultOrderBy,
        hasSorting: finalHasSorting,
    };
};
