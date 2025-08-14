import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { delay, map, Observable } from "rxjs";
import { Employee } from "../models/employee.model";
import { PaginatedList } from "../models/paginated-list.model";
import { EmployeeFilterParams } from "../models/employee-filter-params.model";

@Injectable({
    providedIn: "root",
})
export class EmployeeService {
    private apiUrl = "http://localhost:3000/employees";

    // eslint-disable-next-line @angular-eslint/prefer-inject
    constructor(private _http: HttpClient) {}

    getEmployees(
        params: EmployeeFilterParams,
    ): Observable<PaginatedList<Employee>> {
        let httpParams = new HttpParams();

        if (params.page) {
            httpParams = httpParams.append("_page", params.page.toString());
        }

        if (params.limit) {
            httpParams = httpParams.append("_limit", params.limit.toString());
        }

        // PARÁMETROS DE ORDENAMIENTO!!!
        if (params.sortColumn) {
            httpParams = httpParams.append("_sort", params.sortColumn);
        }
        if (params.sortOrder) {
            httpParams = httpParams.append("_order", params.sortOrder);
        }
        // Agrega los parametros a la url de base de datos json-server los campos que estan en grid-filter
        if (params.id) {
            httpParams = httpParams.set("id", params.id.toString()); // busqueda exacta sensitive
        }

        if (params.name) {
            httpParams = httpParams.set("name_like", params.name);
        }

        if (params.surname) {
            httpParams = httpParams.set("surname_like", params.surname);
        }

        if (params.position && params.position !== "all") {
            httpParams = httpParams.set("position.id", params.position);
        }

        // Aca añadir los restantes campos del componente grid-filter
        if (params.birthDate) {
            httpParams = httpParams.append(
                "birthDate",
                params.birthDate.toString(),
            );
        }

        // --- ✅ Lógica para el filtro de rango de fechas ---
        if (params.birthDateRange) {
            const { startDate, endDate } = params.birthDateRange;

            if (startDate) {
                httpParams = httpParams.set(
                    "birthDate_gte",
                    startDate.toString(),
                );
            }

            if (endDate) {
                httpParams = httpParams.set(
                    "birthDate_lte",
                    endDate.toString(),
                );
            }
        }

        if (params.active !== undefined && params.active !== null) {
            if (params.active === 1) {
                httpParams = httpParams.set("active", "true");
            }
            if (params.active === 0) {
                httpParams = httpParams.set("active", "false");
            }
        } else {
            // en caso que en el filtro como activo se haya elegido "todos"
            // se elimina el parametro active de la url
            httpParams = httpParams.delete("active");
        }

        console.log("employee-service parametros: ", params);

        // ... otros filtros

        // Usa valores por defecto si no se proporcionan en el objeto
        const page = params.page !== undefined ? params.page : 1;
        const limit = params.limit !== undefined ? params.limit : 25;

        httpParams = httpParams.set("_page", page.toString());
        httpParams = httpParams.set("_limit", limit.toString());

        return this._http
            .get<
                Employee[]
            >(this.apiUrl, { params: httpParams, observe: "response" })
            .pipe(
                delay(1500), // Simula un retraso de 1500 milisegundos (1.5 segundos)
                map(
                    (
                        response: HttpResponse<Employee[]>,
                    ): PaginatedList<Employee> => {
                        // json-server version 0.17.4 devuelve el total count en response.headers.get("X-Total-Count")
                        const totalCount = parseInt(
                            response.headers.get("X-Total-Count") || "0",
                            10,
                        );
                        const totalPages = Math.ceil(totalCount / limit);
                        const items = response.body || [];

                        return {
                            items: items,
                            totalCount: totalCount,
                            // --- AGREGAMOS LA PROPIEDAD 'page' AQUÍ ---
                            page: page, // This is the missing property!
                            pageIndex: page, // Assuming pageIndex is the same as page for now (or adjust as needed)
                            pageSize: limit,
                            totalPages: totalPages,
                            hasPreviousPage: page > 1,
                            hasNextPage: page < totalPages,
                        };
                    },
                ),
            );
    }

    // En tu 'employee.service.ts'

    getEmployeesForExportJsonServer(
        params: EmployeeFilterParams,
    ): Observable<Employee[]> {
        let httpParams = new HttpParams();

        // Filtros
        if (params.id) {
            httpParams = httpParams.set("id_like", String(params.id));
        }
        if (params.name) {
            httpParams = httpParams.set("name_like", params.name);
        }
        if (params.surname) {
            httpParams = httpParams.set("surname_like", params.surname);
        }
        if (params.birthDate) {
            httpParams = httpParams.set(
                "birthDate_like",
                String(params.birthDate),
            );
        }

        // Aquí está el filtro de position con la sintaxis correcta
        if (params.position && params.position !== "all") {
            httpParams = httpParams.set("position.id", params.position);
        }

        if (params.active !== undefined && params.active !== null) {
            if (params.active === 1) {
                httpParams = httpParams.set("active", "true");
            }
            if (params.active === 0) {
                httpParams = httpParams.set("active", "false");
            }
        } else {
            // en caso que en el filtro como activo se haya elegido "todos"
            // se elimina el parametro active de la url
            httpParams = httpParams.delete("active");
        }

        // Ordenamiento
        if (params.sortColumn) {
            httpParams = httpParams.set("_sort", params.sortColumn);
        }
        if (params.sortOrder) {
            httpParams = httpParams.set("_order", params.sortOrder);
        }

        // No se incluyen parámetros de paginación como '_page' y '_limit' para obtener todos los registros.
        return this._http.get<Employee[]>(`${this.apiUrl}`, {
            params: httpParams,
        });
    }
}
