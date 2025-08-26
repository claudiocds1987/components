/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    OnInit,
} from "@angular/core";

import {
    createDefaultGridConfiguration,
    GridConfiguration,
    GridData,
    PaginationConfig,
    ElipsisAction,
} from "../../../shared/models/gridConfiguration";
import { GridComponent } from "../../../shared/components/grid/grid.component";

import { CommonModule } from "@angular/common";
import { DateTime } from "luxon";
import { EmployeeService } from "../../../shared/services/employee.service";
import { EmployeeFilterParams } from "../../../shared/models/employee-filter-params.model";
import { PaginatedList } from "../../../shared/models/paginated-list.model";
import { Employee } from "../../../shared/models/employee.model";
import { catchError, finalize, map, Observable, of } from "rxjs";
import { HttpClientModule } from "@angular/common/http";
import { PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import { ExportService } from "../../../shared/services/export.service";
import { SpinnerService } from "../../../shared/services/spinner.service";

import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { EmployeeFormComponent } from "../../employee-form/employee-form/employee-form.component";
import { SelectItem } from "../../../shared/models/select-item.model";
import { PositionService } from "../../../shared/services/position.service";
import { CountryService } from "../../../shared/services/country.service";

interface DateRangeValue {
    startDate: string | null;
    endDate: string | null;
}

@Component({
    selector: "app-employee-grid-infinite",
    standalone: true,
    imports: [CommonModule, HttpClientModule, GridComponent, MatDialogModule],
    templateUrl: "./employee-grid-infinite.component.html",
    styleUrl: "./employee-grid-infinite.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeGridInfiniteComponent implements OnInit {
    gridConfig: GridConfiguration;
    gridData: GridData[] = [];
    isLoadingGridData = true;

    private _employeeFilterParams: EmployeeFilterParams = {};
    private _employeeServices = inject(EmployeeService);
    private _positionServices = inject(PositionService);
    private _countryServices = inject(CountryService);
    private _exportService = inject(ExportService);
    private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
    private _spinnerService = inject(SpinnerService);
    private _dialog: MatDialog = inject(MatDialog);

    private _defaultPaginatorOptions: PaginationConfig = {
        pageIndex: 0,
        pageSize: 25,
        pageSizeOptions: [5, 10, 25, 100],
        totalCount: 0,
        isServerSide: true,
    };

    constructor() {
        this.gridConfig = this._setGridConfiguration(); // seteando la grilla para grid.component
    }

    ngOnInit(): void {
        this._loadData();
    }

    // Método para manejar el evento de scroll al final
    onInfiniteGridScroll(): void {
        const totalCount =
            (this.gridConfig.hasPaginator as PaginationConfig)?.totalCount || 0;
        const currentDataCount = this.gridData.length;

        if (this.isLoadingGridData || currentDataCount >= totalCount) {
            return;
        }

        this.isLoadingGridData = true;
        // Incrementamos la página para la siguiente solicitud
        this._employeeFilterParams = {
            ...this._employeeFilterParams,
            page: (this._employeeFilterParams.page || 1) + 1,
        };

        this._getEmployees(true); // Pasamos 'true' para indicar que es una carga adicional por scroll.
    }

    onGridSortChange(sortEvent: Sort): void {
        // obteniendo nombre de la columna
        let sortColumnName = sortEvent.active;
        // Para que ordene por descripción en json-server
        if (sortEvent.active === "position") {
            sortColumnName = "position.description";
        }

        if (sortEvent.active === "country") {
            sortColumnName = "country.description";
        }

        this._employeeFilterParams = {
            ...this._employeeFilterParams,
            sortColumn: sortColumnName,
            sortOrder: sortEvent.direction,
            page: 1,
        };
        // Actualiza la configuración de la grilla con el nuevo
        this._updateGridConfigOnSortChange(sortEvent);
        this._getEmployees();
    }

    onGridPageChange(event: PageEvent): void {
        if (!this.gridConfig.hasInfiniteScroll) {
            // Solo si NO es scroll infinito
            this._employeeFilterParams = {
                ...this._employeeFilterParams,
                page: event.pageIndex + 1,
                limit: event.pageSize,
            };
            this._getEmployees();
        }
    }

    onExportToExcel(): void {
        console.log("falta desarrollar exportacion de Excel");
        this._employeeServices
            .getEmployeesForExportJsonServer(this._employeeFilterParams)
            .pipe(
                map((employees: Employee[]): any =>
                    this._mapEmployeesForExport(employees),
                ),
            )
            .subscribe({
                next: (processedData: any[]): void => {
                    const fileName = "Empleados.xlsx";
                    setTimeout((): void => {
                        this._exportService.exportToExcel(
                            processedData,
                            fileName,
                        );
                        this._spinnerService.hide();
                        this._cdr.markForCheck();
                    }, 1500);
                },
                error: (error: unknown): void => {
                    this._spinnerService.hide();
                    this._cdr.markForCheck();
                    console.error(
                        "Error al descargar el archivo de Excel:",
                        error,
                    );
                },
            });
    }

    onCreateEmployee(): void {
        const dialogRef = this._dialog.open(EmployeeFormComponent, {
            width: "500px",
            disableClose: true, // para evitar que el modal se cierre al hacer clic fuera
        });
        // Suscribirse al evento 'afterClosed' para obtener los datos del formulario
        dialogRef.afterClosed().subscribe((formData): void => {
            if (formData) {
                // 'result' contendrá los datos del formulario si el usuario hizo clic en "Guardar"
                console.log("Datos del formulario recibidos:", formData);
                // Aca llamar a tu servicio para guardar los datos
                //this._saveNewEmployee(result);
            } else {
                console.log("Formulario de empleado cancelado.");
            }
        });
    }

    private _mapEmployeesForExport(employees: Employee[]): any[] {
        return employees.map((employee: Employee): any => {
            const birthDateString = employee.birthDate as unknown as string;
            const formattedBirthDate = birthDateString
                ? DateTime.fromISO(birthDateString).toFormat("dd/MM/yyyy")
                : null;

            return {
                id: employee.id,
                nombre: employee.name || null,
                apellido: employee.surname || null,
                puesto: employee.position?.description || null,
                pais: employee.country?.description || null,
                genero: employee.gender?.description || null,
                estado:
                    typeof employee.active === "boolean"
                        ? employee.active
                            ? "Activo"
                            : "Inactivo"
                        : null,
                nacimiento: formattedBirthDate,
            };
        });
    }

    private _setEmployeeFilterParameters(): void {
        this._employeeFilterParams.page = 1;
        this._employeeFilterParams.limit = 25;
        this._employeeFilterParams.sortColumn = "id";
        this._employeeFilterParams.sortOrder = "asc";
    }

    private _getEmployees(isScrolling = false): void {
        if (!isScrolling) {
            this.isLoadingGridData = true; // Para carga inicial o cambio de filtro/orden
        }

        this._employeeServices
            .getEmployees(this._employeeFilterParams)
            .pipe(
                map(this._mapPaginatedListToGridData.bind(this)),
                finalize((): void => {
                    this.isLoadingGridData = false;
                    this._cdr.markForCheck(); // Forzar la detección de cambios
                }),
            )
            .subscribe({
                next: (
                    paginatedListGridData: PaginatedList<GridData>,
                ): void => {
                    if (isScrolling) {
                        this.gridData = [
                            ...this.gridData,
                            ...paginatedListGridData.items,
                        ];
                    } else {
                        this.gridData = paginatedListGridData.items;
                    }
                    this._updateGridConfig(paginatedListGridData);
                },
                error: (error: any): void => {
                    console.error(
                        "Parent Log: EmployeeGridComponent: Error al obtener empleados:",
                        error,
                    );
                },
            });
    }

    private _getPositions(): Observable<SelectItem[]> {
        return this._positionServices.getPositions().pipe(
            catchError((error: unknown): Observable<SelectItem[]> => {
                console.error(
                    "Parent Log: Error al obtener posiciones:",
                    error,
                );
                return of([]);
            }),
        );
    }
    private _getCountries(): Observable<SelectItem[]> {
        return this._countryServices.getCountries().pipe(
            catchError((error: unknown): Observable<SelectItem[]> => {
                console.error("Parent Log: Error al obtener paises:", error);
                return of([]);
            }),
        );
    }

    private _loadData(): void {
        this._setEmployeeFilterParameters();
        // Llamada a _getEmployees para la carga inicial
        this._getEmployees();
    }

    private _mapPaginatedListToGridData(
        paginatedList: PaginatedList<Employee>,
    ): PaginatedList<GridData> {
        const transformedItems: GridData[] = paginatedList.items.map(
            (employee: Employee): GridData => {
                const gridData: GridData = {
                    imgUrl: employee.imgUrl,
                    id: employee.id,
                    elipsisActions: this._setElipsisActions(employee),
                    name: employee.name,
                    surname: employee.surname,
                    active: employee.active,
                    position: employee.position?.description,
                    gender: employee.gender?.description,
                    country: employee.country?.description,
                };

                if (typeof employee.birthDate === "string") {
                    const luxonDate = DateTime.fromISO(
                        employee["birthDate"] as string,
                    );
                    gridData["birthDate"] = luxonDate.isValid
                        ? luxonDate.toFormat("dd/MM/yyyy")
                        : employee.birthDate;
                } else {
                    gridData["birthDate"] = employee.birthDate;
                }

                return gridData;
            },
        );

        return {
            ...paginatedList,
            items: transformedItems,
            pageIndex: paginatedList.page - 1,
        };
    }

    private _setElipsisActions(employee: Employee): ElipsisAction[] {
        return [
            {
                id: "edit",
                label: "Editar",
                icon: "edit",
                action: (id: number): void => this._editEmployee(id),
            },
            {
                id: "delete",
                label: "Eliminar",
                icon: "delete_forever",
                action: (id: number): void => this._deleteEmployee(id),
                // Condición de ejemplo: solo eliminable si el usuario esta activo
                condition: (): boolean => employee.active === true,
            },
        ];
    }

    private _editEmployee(id: number): void {
        console.log(`Parent Log: Editando empleado con ID: ${id}`);
        // Aquí iría tu lógica para navegar a la página de edición o abrir un modal
        // Por ejemplo: this._router.navigate(['/employees', id, 'edit']);
    }

    private _deleteEmployee(id: number): void {
        // QUE PONGA EL EMPLEADO COMO INACTIVO NO LO BORRE
        console.log(`Parent Log: Intentando eliminar empleado con ID: ${id}`);
    }

    private _updateGridConfigOnSortChange(sortEvent: Sort): void {
        // Al ordenar, siempre creamos una nueva configuración para asegurar la reactividad
        // y para reiniciar la paginación a la primera página si no es scroll infinito.
        const newPaginationConfig = this.gridConfig.hasInfiniteScroll
            ? {
                  ...this._defaultPaginatorOptions,
                  totalCount:
                      (this.gridConfig.hasPaginator as PaginationConfig)
                          ?.totalCount || 0,
                  pageIndex: 0,
                  pageSize:
                      (this.gridConfig.hasPaginator as PaginationConfig)
                          ?.pageSize || 25,
                  isServerSide: true,
              }
            : {
                  ...(this.gridConfig.hasPaginator ||
                      this._defaultPaginatorOptions),
                  pageIndex: 0,
              };

        this.gridConfig = {
            ...this.gridConfig,
            OrderBy: {
                columnName: sortEvent.active,
                direction: sortEvent.direction,
            },
            hasPaginator: newPaginationConfig,
        };
    }

    private _updateGridConfig(
        paginatedListGridData: PaginatedList<GridData>,
    ): void {
        const { totalCount, pageIndex, pageSize } = paginatedListGridData;
        const { sortColumn = "", sortOrder = "" } = this._employeeFilterParams;

        if (!this.gridConfig.hasInfiniteScroll) {
            // Lógica existente para paginación normal
            const paginationConfig = {
                ...(this.gridConfig.hasPaginator ||
                    this._defaultPaginatorOptions),
                totalCount,
                pageSize,
                pageIndex,
            };
            this.gridConfig = {
                ...this.gridConfig,
                hasPaginator: paginationConfig,
                OrderBy: {
                    columnName: sortColumn,
                    direction: sortOrder as "asc" | "desc" | "",
                },
            };
        } else {
            // --- Mutar hasPaginator si es scroll infinito ---
            // Solo actualizamos las propiedades necesarias sin recrear el objeto completo si ya existe
            if (
                this.gridConfig.hasPaginator &&
                typeof this.gridConfig.hasPaginator === "object"
            ) {
                (this.gridConfig.hasPaginator as PaginationConfig).totalCount =
                    totalCount;
                (this.gridConfig.hasPaginator as PaginationConfig).pageSize =
                    pageSize;
                (this.gridConfig.hasPaginator as PaginationConfig).pageIndex =
                    pageIndex;
            } else {
                // Si hasPaginator no era un objeto, lo creamos
                this.gridConfig = {
                    ...this.gridConfig,
                    hasPaginator: {
                        ...this._defaultPaginatorOptions,
                        totalCount: totalCount,
                        pageSize: pageSize,
                        pageIndex: pageIndex,
                    },
                };
            }
            // Actualizar OrderBy si es necesario, también mutando para evitar cambios de referencia en config si no es absolutamente necesario
            if (this.gridConfig.OrderBy) {
                this.gridConfig.OrderBy.columnName = sortColumn;
                this.gridConfig.OrderBy.direction = sortOrder as
                    | "asc"
                    | "desc"
                    | "";
            } else {
                this.gridConfig = {
                    ...this.gridConfig,
                    OrderBy: {
                        columnName: sortColumn,
                        direction: sortOrder as "asc" | "desc" | "",
                    },
                };
            }
        }
    }

    private _mapToEmployeeFilterParams(obj: unknown): EmployeeFilterParams {
        const employeeFilterParams: EmployeeFilterParams = {};
        const source = obj as Record<string, unknown>;

        for (const key in source) {
            const value = source[key];
            // 1. ignorars campos con valores "all" o "Todos"
            if (["active", "position", "gender", "country"].includes(key)) {
                if (value === "all" || value === "Todos" || value === "") {
                    continue;
                }
            }
            // 2. Para rango de fechas en json-server desde(birthDate_gte) hasta (birthDate_lte)
            if (key === "birthDateRange" && value) {
                const dateRangeValue = value as {
                    startDate: Date | string | null;
                    endDate: Date | string | null;
                };
                if (dateRangeValue.startDate) {
                    const luxonStartDate = DateTime.fromJSDate(
                        new Date(dateRangeValue.startDate),
                    );
                    if (luxonStartDate.isValid) {
                        (employeeFilterParams as any)["birthDate_gte"] =
                            luxonStartDate.toFormat("yyyy-MM-dd");
                    }
                }
                if (dateRangeValue.endDate) {
                    const luxonEndDate = DateTime.fromJSDate(
                        new Date(dateRangeValue.endDate),
                    );
                    if (luxonEndDate.isValid) {
                        (employeeFilterParams as any)["birthDate_lte"] =
                            luxonEndDate.toFormat("yyyy-MM-dd");
                    }
                }
                continue;
            }
            // 3. Manejar todos los demás campos name, surname...
            if (value !== null && value !== undefined) {
                (employeeFilterParams as any)[key] = value;
            }
        }

        return employeeFilterParams;
    }

    private _setGridConfiguration(): GridConfiguration {
        const config = createDefaultGridConfiguration({
            columns: [
                {
                    name: "foto",
                    type: "img",
                    label: "img",
                    isSortable: false,
                },
                { name: "id", label: "ID" }, // Añadido label
                { name: "name", label: "Nombre" }, // Añadido label
                { name: "surname", label: "Apellido" /*isSortable: false*/ }, // Añadido label
                { name: "birthDate", label: "Nacimiento" }, // Añadido label
                { name: "gender", label: "genero", isSortable: false },
                { name: "position", label: "Puesto" }, // Añadido label
                { name: "country", label: "Pais" }, // Añadido label
                {
                    name: "active",
                    label: "Activo",
                    style: "status-circle",
                    align: "center",
                },
                {
                    name: "elipsisActions", // Este es el nombre de la propiedad en GridData
                    align: "center",
                    isSortable: false,
                    type: "elipsis", // ¡Indica que es la columna de elipsis!
                },
            ],
            hasInfiniteScroll: true,
            OrderBy: {
                columnName: this._employeeFilterParams.sortColumn || "id",
                direction: (this._employeeFilterParams.sortOrder || "asc") as
                    | "asc"
                    | "desc",
            },
            filterByColumn: "",
            hasInputSearch: false,
            hasChips: false,
            hasExcelDownload: true,
            hasCreateButton: true,
        });
        return config;
    }
}
