/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    OnInit,
} from "@angular/core";
import { GridFilterConfig } from "../../shared/models/grid-filter-config.model";
import { FormControl, FormGroup } from "@angular/forms";
import {
    createDefaultGridConfiguration,
    GridConfiguration,
    GridDataItem,
    PaginationConfig,
} from "../../shared/models/gridConfiguration";
import { GridComponent } from "../../shared/components/grid/grid.component"; // Correct path for GridComponent
import { GridFilterComponent } from "../../shared/components/grid/grid-filter/grid-filter.component"; // Correct path for GridFilterComponent
import { CommonModule } from "@angular/common";
import { DateTime } from "luxon";
import { EmployeeService } from "../../shared/services/employee.service";
import { EmployeeFilterParams } from "../../shared/models/employee-filter-params.model";
import { PaginatedList } from "../../shared/models/paginated-list.model";
import { Employee } from "../../shared/models/employee.model";
import { finalize, map } from "rxjs";
import { HttpClientModule } from "@angular/common/http";
import { PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";

@Component({
    selector: "app-employee-grid",
    standalone: true,
    imports: [
        CommonModule,
        HttpClientModule,
        GridComponent, // Ensure GridComponent is imported correctly
        GridFilterComponent, // Ensure GridFilterComponent is imported correctly
    ],
    templateUrl: "./employee-grid.component.html",
    styleUrl: "./employee-grid.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeGridComponent implements OnInit {
    gridFilterConfig: GridFilterConfig[] = [];
    gridFilterForm!: FormGroup;
    gridConfig: GridConfiguration;
    gridData: GridDataItem[] = [];
    employees: Employee[] = [];
    isLoadingData = false;
    private _employeeFilterParams: EmployeeFilterParams = {};
    private _employeeServices = inject(EmployeeService);
    private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

    private _defaultPaginatorOptions: PaginationConfig = {
        pageIndex: 0,
        pageSize: 25,
        pageSizeOptions: [5, 10, 25, 100],
        totalCount: 0,
        isServerSide: true,
    };

    constructor() {
        this._setGridFilter();
        this._setGridFilterForm();
        this._setEmployeeFilterParameters();
        this.gridConfig = this._setGridConfiguration();
    }

    ngOnInit(): void {
        this._getEmployees();
    }

    applyFilter(filterValues: unknown): void {
        const formattedFilterValues = this._formatDatesInObject(filterValues);
        console.log(
            "Valores de filtro con fechas formateadas:",
            formattedFilterValues,
        );

        this._employeeFilterParams.page = 1;
        if (this.gridConfig.hasPagination) {
            this.gridConfig.hasPagination.pageIndex = 0;
        }

        // Aquí deberías mapear `formattedFilterValues` a `this._employeeFilterParams`
        // Por ejemplo:
        this._employeeFilterParams.id = formattedFilterValues.id;
        this._employeeFilterParams.name = formattedFilterValues.name;
        this._employeeFilterParams.surname = formattedFilterValues.surname;
        this._employeeFilterParams.position = formattedFilterValues.position;
        this._employeeFilterParams.dateOfBirth =
            formattedFilterValues.dateOfBirth;

        this._getEmployees();
    }

    onGridSortChange(sortEvent: Sort): void {
        this._employeeFilterParams = {
            ...this._employeeFilterParams,
            sortColumn: sortEvent.active,
            sortOrder: sortEvent.direction,
            page: 1,
        };

        this._updateGridConfigOnSortChange(sortEvent); // Nueva función para la actualización de config
        this._getEmployees();
    }

    onGridPageChange(event: PageEvent): void {
        console.log("onGridPageChange called.");
        console.trace();
        this._employeeFilterParams = {
            ...this._employeeFilterParams,
            page: event.pageIndex + 1,
            limit: event.pageSize,
        };
        this._getEmployees();
    }

    private _setEmployeeFilterParameters(): void {
        // Aca se establece por defecto como va a aparecer la grilla paginada por 1ra vez.
        if (!this._employeeFilterParams.page) {
            // pagina 1
            this._employeeFilterParams.page = 1;
        }
        if (!this._employeeFilterParams.limit) {
            // aca la cantidad de registros que va a mostrar en la 1er pagina (ej 25)
            // se define en la funcion _defaultPaginatorOptions()
            this._employeeFilterParams.limit =
                this._defaultPaginatorOptions.pageSize;
        }
        if (!this._employeeFilterParams.sortColumn) {
            // aca establece por defecto que la grillapor default la ordena por id
            this._employeeFilterParams.sortColumn = "id"; // se puede poner name, surname etc..
        }
        if (!this._employeeFilterParams.sortOrder) {
            // ordenada por "id" de forma "asc"
            this._employeeFilterParams.sortOrder = "asc";
        }
    }

    private _getEmployees(): void {
        this.isLoadingData = true;
        console.log(
            "EmployeeGridComponent: Solicitando empleados con parámetros:",
            this._employeeFilterParams,
        );

        this._employeeServices
            .getEmployees(this._employeeFilterParams)
            .pipe(
                map(this._transformPaginatedListToGridData.bind(this)), // Usamos la nueva función de transformación
                finalize((): void => {
                    this.isLoadingData = false; // Manejamos el estado de carga aquí
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (
                    paginatedListGridData: PaginatedList<GridDataItem>,
                ): void => {
                    this.gridData = paginatedListGridData.items;
                    this._updateGridConfigOnDataReceived(paginatedListGridData); // Nueva función para actualizar config
                    console.log(
                        "EmployeeGridComponent: Datos de empleados recibidos y procesados.",
                    );
                },
                error: (error: any): void => {
                    console.error(
                        "EmployeeGridComponent: Error al obtener empleados:",
                        error,
                    );
                    console.log("EmployeeGridComponent: API call error.");
                },
            });
    }

    private _transformPaginatedListToGridData(
        paginatedList: PaginatedList<Employee>,
    ): PaginatedList<GridDataItem> {
        /* Esta función toma la información que viene del backend (que son ojetos Employee)
           y "transforma" esa data para que el componente grilla (GridComponent) 
           la pueda entender y mostrar. */
        const transformedItems: GridDataItem[] = paginatedList.items.map(
            (employee: Employee): GridDataItem => {
                const gridItem: GridDataItem = {};
                for (const key in employee) {
                    const value = (employee as any)[key];

                    if (value instanceof Date) {
                        gridItem[key] =
                            DateTime.fromJSDate(value).toISODate() || "";
                    } else if (
                        typeof value === "string" ||
                        typeof value === "number" ||
                        typeof value === "boolean"
                    ) {
                        gridItem[key] = value;
                    }
                }
                return gridItem;
            },
        );

        return {
            ...paginatedList,
            items: transformedItems,
            pageIndex: paginatedList.page - 1, // Ajuste para MatPaginator
        };
    }

    private _updateGridConfigOnSortChange(sortEvent: Sort): void {
        let basePaginationConfig: PaginationConfig;
        if (this.gridConfig.hasPagination === false) {
            basePaginationConfig = this._defaultPaginatorOptions;
        } else if (this.gridConfig.hasPagination) {
            basePaginationConfig = this.gridConfig.hasPagination;
        } else {
            basePaginationConfig = this._defaultPaginatorOptions;
        }

        this.gridConfig = {
            ...this.gridConfig,
            OrderBy: {
                columnName: sortEvent.active,
                direction: sortEvent.direction,
            },
            hasPagination: {
                ...basePaginationConfig,
                pageIndex: 0,
            },
        };
        console.log(
            "EmployeeGridComponent: gridConfig.OrderBy actualizado después de sort:",
            this.gridConfig.OrderBy,
        );
    }

    private _updateGridConfigOnDataReceived(
        paginatedListGridData: PaginatedList<GridDataItem>,
    ): void {
        let basePaginationConfig: PaginationConfig;
        if (this.gridConfig.hasPagination === false) {
            basePaginationConfig = this._defaultPaginatorOptions;
        } else if (this.gridConfig.hasPagination) {
            basePaginationConfig = this.gridConfig.hasPagination;
        } else {
            basePaginationConfig = this._defaultPaginatorOptions;
        }

        const currentOrderBy = this.gridConfig.OrderBy;
        const newTotalCount = paginatedListGridData.totalCount;
        const newPageIndex = paginatedListGridData.pageIndex;
        const newPageSize = paginatedListGridData.pageSize;
        const newSortColumn = this._employeeFilterParams.sortColumn || "";
        const newSortDirection = (this._employeeFilterParams.sortOrder ||
            "") as "asc" | "desc" | "";

        const paginationChanged =
            basePaginationConfig.totalCount !== newTotalCount ||
            basePaginationConfig.pageIndex !== newPageIndex ||
            basePaginationConfig.pageSize !== newPageSize;

        const orderByChanged =
            currentOrderBy.columnName !== newSortColumn ||
            currentOrderBy.direction !== newSortDirection;

        if (paginationChanged || orderByChanged) {
            this.gridConfig = {
                ...this.gridConfig,
                hasPagination: {
                    ...basePaginationConfig,
                    totalCount: newTotalCount,
                    pageSize: newPageSize,
                    pageIndex: newPageIndex,
                },
                OrderBy: {
                    columnName: newSortColumn,
                    direction: newSortDirection,
                },
            };
            console.log(
                "EmployeeGridComponent: gridConfig actualizado para reflejar paginación/sort.",
            );
        } else {
            console.log(
                "EmployeeGridComponent: gridConfig no necesita actualización.",
            );
        }
    }

    private _formatDatesInObject(obj: any): any {
        const newObj: any = { ...obj };

        for (const key in newObj) {
            if (Object.prototype.hasOwnProperty.call(newObj, key)) {
                const value = newObj[key];
                if (value instanceof Date) {
                    newObj[key] = DateTime.fromJSDate(value);
                } else if (typeof value === "object" && value !== null) {
                    newObj[key] = this._formatDatesInObject(value);
                }
            }
        }
        return newObj;
    }

    private _setGridConfiguration(): GridConfiguration {
        const config = createDefaultGridConfiguration({
            columns: [
                { name: "id", width: "70px" },
                { name: "name" },
                { name: "surname" /*isSortable: false*/ },
                { name: "dateOfBirth" },
                { name: "position" },
                {
                    name: "elipsis",
                    width: "70px",
                    align: "center",
                    isSortable: false,
                    hasHeaderTooltip: true,
                },
            ],
            hasPagination: {
                pageSize: this._employeeFilterParams.limit || 25,
                pageSizeOptions: [5, 10, 25, 50],
                totalCount: 0,
                pageIndex: 0,
                isServerSide: true,
            },
            OrderBy: {
                columnName: this._employeeFilterParams.sortColumn || "id",
                direction: (this._employeeFilterParams.sortOrder || "asc") as
                    | "asc"
                    | "desc",
            },

            filterByColumn: "", // Valor por defecto
            withExcelDownload: false, // Valor por defecto
            hasInputSearch: true, // Valor por defecto
        });
        return config;
    }

    private _setGridFilter(): void {
        this.gridFilterConfig = [
            {
                fieldName: "id",
                fieldType: "text",
                label: "Id",
            },
            {
                fieldName: "Estados",
                fieldType: "select",
                label: "Estado",
                selectItems: [
                    { value: "all", label: "Todos" },
                    { value: "active", label: "Activo" },
                    { value: "inactive", label: "Inactivo" },
                    { value: "pendient", label: "Pendiente" },
                ],
            },
            {
                fieldName: "dateOfBirth",
                fieldType: "date",
                label: "Fecha de nacimiento",
            },
        ];
    }

    private _setGridFilterForm(): void {
        this.gridFilterForm = new FormGroup({});
        this.gridFilterConfig.forEach((filter: GridFilterConfig): void => {
            if (filter.fieldType === "text") {
                this.gridFilterForm.addControl(
                    filter.fieldName,
                    new FormControl(""),
                );
                return;
            }

            if (filter.fieldType === "select") {
                this.gridFilterForm.addControl(
                    filter.fieldName,
                    new FormControl(""),
                );
                return;
            }

            if (filter.fieldType === "date") {
                this.gridFilterForm.addControl(
                    filter.fieldName,
                    new FormControl(null),
                );
            }
        });
    }

    private _mockGetEmployees(): void {
        setTimeout((): void => {
            this.gridData = Array.from(
                { length: 100 },
                (
                    _: unknown,
                    i: number,
                ): {
                    id: number;
                    name: string;
                    surname: string;
                    position: string;
                    elipsis: string;
                } => {
                    return {
                        id: i + 1,
                        name: `JUAN CARLOS ALBERTO JOSE MARIA ${i + 1}`,
                        surname: `usuario${i + 1}@mail.com`,
                        position: `Administrativo ${i + 1}`,
                        elipsis: "...",
                    };
                },
            );
        }, 2000);
    }
}
