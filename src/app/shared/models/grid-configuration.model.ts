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
    name: string; // "(Nombre de la columna que aparece en el header) Es obligatorio porque en grid.component mat-table requiere que todas las columnas definidas tengan un identificador (matColumnDef)
    width?: string;
    align?: "left" | "center" | "right";
    isSortable?: boolean;
    hasHeader?: boolean; // para indicar si la columna tiene un header visible
    headerTooltip?: string; // Para mostrar tooltip en la cabecera de la columna en caso de necesitarlo
    // propiedad para el icono de la cabecera de la columna (si aplica, ej. 'more_vert')
    headerIcon?: string;
    //label?: string; // Añadido para etiquetas de columna personalizadas
    style?: string; // para añadir una clase .scss
    // si "type" es "img" grid.component se encarga de agregar un la etiqueta img en su html
    // para que muestra una imagen como en el caso de las imagenes el empleado
    // si "type" es "component" lalogica del html va estar preparada para llamar a un componente en el html.
    type?: "img" | "elipsis" | "component" | "date";
}

export interface PaginationConfig {
    pageIndex: number | string; // si es infinite scroll puede ser string vacio ""
    pageSize: number | string; // si es infinite scroll puede ser string vacio ""
    pageSizeOptions: number[];
    totalCount: number;
    isServerSide?: boolean; // para indicar si la paginacion la maneja el backend(true) o cliente (false)
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
    // paginator.isServerSide: Le dice al GridComponent si debe usar el MatPaginator para controlar la paginación localmente o si debe limitarse a mostrar los datos que recibe y notificar al componente padre cuando se solicita una nueva página.
    paginator: PaginationConfig;
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

    // Combina la configuración por defecto con la configuración del usuario.
    const finalPaginator = config.paginator
        ? { ...defaultPaginator, ...config.paginator }
        : defaultPaginator;

    let finalHasSorting: { isServerSide: boolean };
    if (config.hasSorting) {
        finalHasSorting = {
            isServerSide: config.hasSorting.isServerSide ?? true, // Valor por defecto 'true' para que lo maneje el backend
        };
    } else {
        finalHasSorting = { isServerSide: true }; // isServerSide = true por default
    }

    // Configuracion de columnas por defecto
    const defaultColumns: Column[] = (config.columns || []).map(
        (col: Column): Column => ({
            ...col,
            isSortable: col.isSortable ?? true,
            width: col.width ?? "auto",
            align: col.align ?? "left",
            hasHeader: col.hasHeader ?? true,
            headerTooltip: col.headerTooltip ?? undefined,
            headerIcon: col.headerIcon ?? undefined,
            style: col.style ?? undefined,
            type: col.type ?? undefined,
        }),
    );

    return {
        columns: defaultColumns,
        paginator: finalPaginator,
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
