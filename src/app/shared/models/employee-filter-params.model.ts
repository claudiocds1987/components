export interface EmployeeFilterParams {
    id?: number;
    name?: string;
    surname?: string;
    birthDate?: Date;
    position?: string;
    active?: boolean | number;
    page?: number;
    limit?: number;
    sortColumn?: string; // para hacer sort por columuna (ej: 'name', 'id')
    sortOrder?: "asc" | "desc" | ""; // ordenamiento de sort('asc', 'desc', o vacio para no sort)
}
