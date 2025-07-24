export interface PaginatedList<T> {
    items: T[]; // Los registros de la página actual (ejemplo, Employee[])
    page: number;
    totalCount: number; // El número total de registros disponibles (sin paginar)
    pageIndex: number; // El índice de la página actual (basado en 0 o 1, según prefieras)
    pageSize: number; // El número de registros por página
    totalPages: number; // El número total de páginas
    hasPreviousPage: boolean; // Indica si hay una página anterior
    hasNextPage: boolean; // Indica si hay una página siguiente
}
