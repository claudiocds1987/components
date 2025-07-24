export interface EmployeeFilterParams {
    id?: number;
    name?: string;
    surname?: string;
    dateOfBirth?: Date;
    position?: string;
    page?: number;
    limit?: number;
    //orderBy?: string; // Columna por la que ordenar
    //orderDirection?: "asc" | "desc"; // Dirección del orden
    sortColumn?: string; // The column to sort by (e.g., 'name', 'id')
    sortOrder?: "asc" | "desc" | ""; // The sort direction ('asc', 'desc', or empty for no sort)
}
