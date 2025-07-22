import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { map, Observable } from "rxjs";
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

        // Accede a las propiedades directamente desde el objeto 'params'
        if (params.id) {
            httpParams = httpParams.set("id", params.id.toString()); // busqueda exacta sensitive
        }

        if (params.name) {
            httpParams = httpParams.set("name_like", params.name);
        }

        if (params.surname) {
            httpParams = httpParams.set("surname_like", params.surname);
        }

        if (params.position) {
            httpParams = httpParams.set("position", params.position);
        }

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
                map(
                    (
                        response: HttpResponse<Employee[]>,
                    ): PaginatedList<Employee> => {
                        const totalCount = parseInt(
                            response.headers.get("X-Total-Count") || "0",
                            10,
                        );
                        const totalPages = Math.ceil(totalCount / limit);
                        const items = response.body || [];

                        return {
                            items: items,
                            totalCount: totalCount,
                            pageIndex: page,
                            pageSize: limit,
                            totalPages: totalPages,
                            hasPreviousPage: page > 1,
                            hasNextPage: page < totalPages,
                        };
                    },
                ),
            );
    }
}
