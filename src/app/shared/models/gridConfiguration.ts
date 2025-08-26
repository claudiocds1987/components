import { SelectItem } from "./select-item.model";

// interfaz para las acciones del menú de elipsis
export interface ElipsisAction {
    id?: string | number; // Identificador único de la acción (ej. 'edit', 'delete')
    label: string; // Texto a mostrar en el menú (ej. "Editar", "Eliminar")
    icon?: string; // Nombre del icono de Material (ej. 'edit', 'delete_forever')
    action: (id: number) => void;
    condition?: (row: GridData) => boolean;
}

export interface Column {
    name: string; // Nombre de la columna que aparece en el header de la tabla
    width?: string;
    align?: "left" | "center" | "right";
    isSortable?: boolean;
    hasHeaderTooltip?: boolean;
    // propiedad para el icono de la cabecera de la columna (si aplica, ej. 'more_vert')
    headerIcon?: string;
    label?: string; // Añadido para etiquetas de columna personalizadas
    style?: string; // para añadir una clase .scss
    // si "type" es "img" grid.component se encarga de agregar un la etiqueta img en su html
    // para que muestra una imagen como en el caso de las imagenes el empleado
    // si "type" es "component" lalogica del html va estar preparada para llamar a un componente en el html.
    type?: "img" | "elipsis" | "component";
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
    | string
    | number
    | boolean
    | Date
    | null
    | undefined
    | ElipsisAction[]
    | SelectItem
>;

export interface GridConfiguration {
    columns: Column[];
    // hasPaginator.isServerSide: Le dice al GridComponent si debe usar el MatPaginator para controlar la paginación localmente o si debe limitarse a mostrar los datos que recibe y notificar al componente padre cuando se solicita una nueva página.
    hasPaginator?: PaginationConfig | false; // "false" porque puede no tener paginacion la grilla
    hasInputSearch?: boolean; // Para mostrar o no el input search arriba de la grilla
    filterByColumn?: string; // indica a el input search en que columna hacer la búsqueda
    hasChips?: boolean; // Muestra o no los chips de filtros aplicados
    hasExcelDownload?: boolean; // Muestra o no el boton para descargar el excel
    hasCreateButton?: boolean; // Muestra o no el botón de Crear
    OrderBy: OrderBy;
    // hasSorting.isServerSide: Le indica al GridComponent si debe reordenar la dataSource internamente (ordenamiento del cliente) o si debe dejar los datos como están y solo emitir un evento (sortChange) para que el componente padre solicite los datos reordenados al servidor.
    // si isServerSide = true La grilla simplemente muestra los datos en el orden exacto en que los recibe del servidor.
    hasSorting?: {
        isServerSide: boolean; // pore defecto mas abajo esta en true
    };
    hasInfiniteScroll?: boolean;
}

// Function para crear la configuracion de la grilla por default se llama en un componente padre.
export const createDefaultGridConfiguration = (
    config: Partial<GridConfiguration>,
): GridConfiguration => {
    const defaultPaginator: PaginationConfig = {
        pageIndex: 0,
        pageSize: 25,
        pageSizeOptions: [5, 10, 25, 100],
        totalCount: 0,
        isServerSide: true, // por default esta en true lo maneja el backend
    };

    const defaultOrderBy: OrderBy = {
        columnName: "id",
        direction: "asc",
    };

    let finalPaginatornConfig: PaginationConfig | false;

    if (config.hasInfiniteScroll) {
        finalPaginatornConfig = {
            ...defaultPaginator,
            isServerSide: true,
            totalCount:
                config.hasPaginator && typeof config.hasPaginator === "object"
                    ? (config.hasPaginator.totalCount ?? 0)
                    : 0,
            pageIndex:
                config.hasPaginator && typeof config.hasPaginator === "object"
                    ? (config.hasPaginator.pageIndex ?? 0)
                    : 0,
            pageSize:
                config.hasPaginator && typeof config.hasPaginator === "object"
                    ? (config.hasPaginator.pageSize ?? 25)
                    : 25,
        };
    } else if (config.hasPaginator === false) {
        finalPaginatornConfig = false;
    } else if (config.hasPaginator) {
        finalPaginatornConfig = {
            ...defaultPaginator,
            ...config.hasPaginator,
        };
    } else {
        finalPaginatornConfig = defaultPaginator;
    }

    let finalHasSorting: { isServerSide: boolean };
    if (config.hasSorting) {
        finalHasSorting = {
            isServerSide: config.hasSorting.isServerSide ?? true, // ¡Valor por defecto cambiado a 'true' para uso profesional!
        };
    } else {
        finalHasSorting = { isServerSide: true }; // isServerSide = true por default
    }

    // Procesar las columnas para establecer isSortable por defecto
    const processedColumns: Column[] = (config.columns || []).map(
        (col: Column): Column => ({
            ...col,
            isSortable: col.isSortable ?? true,
        }),
    );

    return {
        columns: processedColumns,
        hasPaginator: finalPaginatornConfig,
        hasInputSearch: config.hasInputSearch ?? true,
        filterByColumn: config.filterByColumn ?? "",
        hasExcelDownload: config.hasExcelDownload ?? false,
        hasCreateButton: config.hasCreateButton ?? false,
        hasChips: config.hasChips ?? false,
        OrderBy: config.OrderBy
            ? { ...defaultOrderBy, ...config.OrderBy }
            : defaultOrderBy,
        hasSorting: finalHasSorting,
        hasInfiniteScroll: config.hasInfiniteScroll ?? false,
    };
};
