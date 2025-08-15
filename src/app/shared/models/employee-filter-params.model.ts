export interface EmployeeFilterParams {
    id?: number;
    name?: string;
    surname?: string;
    birthDate?: Date;
    // Propiedad para el rango de fechas para que funcione con json-server
    birthDateRange?: {
        startDate?: Date | null;
        endDate?: Date | null;
    };
    position?: string;
    active?: boolean | number;
    page?: number;
    limit?: number;
    sortColumn?: string; // para hacer sort por columuna (ej: 'name', 'id')
    sortOrder?: "asc" | "desc" | ""; // ordenamiento de sort('asc', 'desc', o vacio para no sort)
}
