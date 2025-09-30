/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit,
    signal,
} from "@angular/core";

import {
    createDefaultGridConfiguration,
    GridConfiguration,
    GridData,
    PaginationConfig,
    ElipsisAction,
} from "../../shared/models/grid-configuration.model";
import { GridComponent } from "../../shared/components/grid/grid.component";

import { CommonModule } from "@angular/common";
import { DateTime } from "luxon";
import { EmployeeService } from "../../shared/services/employee.service";
import { EmployeeFilterParams } from "../../shared/models/employee-filter-params.model";
import { PaginatedList } from "../../shared/models/paginated-list.model";
import { Employee } from "../../shared/models/employee.model";
import { catchError, finalize, forkJoin, map, Observable, of } from "rxjs";
import { HttpClientModule, HttpErrorResponse } from "@angular/common/http";
import { PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import { ExportService } from "../../shared/services/export.service";
import { SpinnerService } from "../../shared/services/spinner.service";

import { MatDialogModule } from "@angular/material/dialog";

import { BreadcrumbComponent } from "../../shared/components/breadcrumb/breadcrumb.component";
import { BreadcrumbService } from "../../shared/services/breadcrumb.service";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { AlertService } from "../../shared/services/alert.service";
import { SelectItem } from "../../shared/models/select-item.model";
import { PositionService } from "../../shared/services/position.service";
import { CountryService } from "../../shared/services/country.service";
import { Router } from "@angular/router";

@Component({
    selector: "app-employee-grid-infinite",
    standalone: true,
    imports: [
        CommonModule,
        HttpClientModule,
        GridComponent,
        MatDialogModule,
        BreadcrumbComponent,
        AlertComponent,
    ],
    templateUrl: "./employee-grid-infinite.component.html",
    styleUrl: "./employee-grid-infinite.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeGridInfiniteComponent implements OnInit, OnDestroy {
    gridConfig: GridConfiguration;
    gridData: GridData[] = [];
    isLoadingGridData = signal(true);

    private _positions: SelectItem[] = [];
    private _countries: SelectItem[] = [];
    private _genders: SelectItem[] = [
        { id: "all", description: "Todos" },
        { id: 0, description: "No binario" },
        { id: 1, description: "Masculino" },
        { id: 2, description: "Femenino" },
    ];
    private _queryParams = {
        componentPath: "employee-grid-infinite",
        componentName: "Grilla scroll infinito",
    };

    private _employeeFilterParams: EmployeeFilterParams = {};
    private _employeeServices = inject(EmployeeService);
    private _exportService = inject(ExportService);
    private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
    private _spinnerService = inject(SpinnerService);
    private _breadcrumbService = inject(BreadcrumbService);
    private _alertService = inject(AlertService);
    private _positionServices = inject(PositionService);
    private _countryServices = inject(CountryService);
    private _router = inject(Router);

    constructor() {
        this._alertService.clearAlerts();
        this._setBreadcrumb();
        this.gridConfig = this._setGridConfiguration(); // seteando la grilla para grid.component
    }

    ngOnInit(): void {
        this._loadData();
    }

    ngOnDestroy(): void {
        // Limpio breadcrumb al salir del componente para evitar fugas de memoria.
        this._breadcrumbService.clearBreadcrumbs();
    }

    onRowDblClick(rowData: any): void {
        const employee = rowData as Employee;
        this._editEmployee(employee.id);
    }

    onCreateEmployee(): void {
        // Navega al formulario de creación del empleado y la ruta del componente origen ("employee-grid-pagination")
        // como parámetro de consulta. Esto permite que el formulario de creación sepa a qué grilla debe regresar al cancelar
        // o al finalizar la creación. También se le envía el nombre del componente para usarse en el breadCrumb.
        this._router.navigate(["/employee/create"], {
            queryParams: this._queryParams,
        });
    }

    // Método para manejar el evento de scroll al final
    onInfiniteGridScroll(): void {
        const totalCount =
            (this.gridConfig.paginator as PaginationConfig)?.totalCount || 0;
        const currentDataCount = this.gridData.length;

        if (this.isLoadingGridData() || currentDataCount >= totalCount) {
            return;
        }

        this.isLoadingGridData.set(true);

        this._employeeFilterParams = {
            ...this._employeeFilterParams,
            page: (this._employeeFilterParams.page || 1) + 1,
        };

        // Llamada unificada a la función de carga de empleados
        this._getEmployees(true); // Pasar true para indicar que es un scroll
    }

    onGridSortChange(sortEvent: Sort): void {
        // obteniendo nombre de la columna
        const sortColumnName = sortEvent.active;
        const sortOrder = sortEvent.direction;

        this._employeeFilterParams = {
            ...this._employeeFilterParams,
            sortColumn: sortColumnName,
            sortOrder: sortOrder,
            page: 1,
        };

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
        this._spinnerService.show();
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
                    // hago simular tiempo de descarga con setTimeout porque json-server responde muy rapido por ser local
                    setTimeout((): void => {
                        this._exportService.exportToExcel(
                            processedData,
                            fileName,
                        );
                        this._spinnerService.hide();
                        this._cdr.markForCheck();
                    }, 1500);
                },
                error: (): void => {
                    this._spinnerService.hide();
                    this._cdr.markForCheck();
                    this._alertService.showDanger("Error al descargar Excel");
                },
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
                puesto: this._getPositionDescription(employee.positionId),
                pais: this._getCountryDescription(employee.countryId),
                genero: this._getGenderDescription(employee.genderId),
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
        this.isLoadingGridData.set(true);
        if (!isScrolling) {
            // Para limpiar la grilla para carga inicial o al cambiar de página
            this.gridData = [];
        }

        this._employeeServices
            .getEmployees(this._employeeFilterParams)
            .pipe(
                map(
                    (
                        paginatedList: PaginatedList<Employee>,
                    ): PaginatedList<GridData> => {
                        return this._mapPaginatedListToGridData(paginatedList);
                    },
                ),
                finalize((): void => {
                    this.isLoadingGridData.set(false);
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (paginatedGridData: PaginatedList<GridData>): void => {
                    // Si es scroll, se concatenan los datos.
                    // Si es carga inicial, se reemplazan los datos.
                    this.gridData = isScrolling
                        ? [...this.gridData, ...paginatedGridData.items]
                        : paginatedGridData.items;

                    this._updateGridConfig(paginatedGridData);
                },
                error: (error: HttpErrorResponse): void => {
                    this.isLoadingGridData.set(false);
                    this._alertService.showDanger(
                        `Error al obtener empleados. ${error.statusText}`,
                    );
                },
            });
    }

    private _loadData(): void {
        this._setEmployeeFilterParameters();
        forkJoin({
            positions: this._getPositions(),
            countries: this._getCountries(),
        })
            .pipe(
                finalize((): void => {
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (results): void => {
                    this._positions = results.positions;
                    this._countries = results.countries;
                    // Llama a _getEmployees para la carga inicial de la grilla
                    this._getEmployees();
                },
                error: (error: HttpErrorResponse): void => {
                    this.isLoadingGridData.set(false);
                    this._alertService.showDanger(
                        `Error al cargar datos. ${error.statusText}`,
                    );
                },
            });
    }

    private _getPositions(): Observable<SelectItem[]> {
        return this._positionServices.getPositions().pipe(
            catchError((error: HttpErrorResponse): Observable<SelectItem[]> => {
                this._alertService.showDanger(
                    `Error al cargar la lista de puestos. ${error.statusText}`,
                );
                return of([]);
            }),
        );
    }

    private _getCountries(): Observable<SelectItem[]> {
        return this._countryServices.getCountries().pipe(
            catchError((error: HttpErrorResponse): Observable<SelectItem[]> => {
                this._alertService.showDanger(
                    `Error al cargar la lista de paises. ${error.statusText}`,
                );
                return of([]);
            }),
        );
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
                    birthDate: employee.birthDate,
                    active: employee.active,
                    position: this._getPositionDescription(employee.positionId),
                    gender: this._getGenderDescription(employee.genderId),
                    country: this._getCountryDescription(employee.countryId),
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

    private _getCountryDescription(countryId: number): string {
        return (
            this._countries.find(
                (country: SelectItem): boolean => country.id === countryId,
            )?.description || ""
        );
    }

    private _getPositionDescription(positionId: number): string {
        return (
            this._positions.find(
                (position: SelectItem): boolean => position.id === positionId,
            )?.description || ""
        );
    }

    private _getGenderDescription(genderId: number): string {
        return (
            this._genders.find(
                (gender: SelectItem): boolean => gender.id === genderId,
            )?.description || ""
        );
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
                // Condición de ejemplo: solo eliminable si el usuario esta inactivo
                condition: (): boolean => employee.active === false,
            },
        ];
    }

    private _editEmployee(id: number): void {
        // Navega al formulario de edición del empleado, pasando el ID como parámetro de la URL
        // y la ruta del componente origen ("employee-grid-pagination") como parámetro de consulta.
        // Esto permite que el formulario de edición sepa a qué grilla debe regresar al cancelar o al finalizar la edición.
        // También se le envía el nombre del componente para usarse en el breadCrumb.
        this._router.navigate([`/employee/edit/${id}`], {
            queryParams: this._queryParams,
        });
    }

    private _deleteEmployee(id: number): void {
        // QUE PONGA EL EMPLEADO COMO INACTIVO NO LO BORRE
        console.log(`Parent Log: Intentando eliminar empleado con ID: ${id}`);
    }

    private _updateGridConfig(
        paginatedListGridData: PaginatedList<GridData>,
    ): void {
        const { totalCount, pageIndex, pageSize } = paginatedListGridData;
        const { sortColumn = "", sortOrder = "" } = this._employeeFilterParams;

        // Actualizamos la configuración de la paginación con los datos del servidor.
        // Usamos el operador de nulidad para asegurar que 'hasPaginator' es un objeto.
        const currentPaginator = this.gridConfig.paginator as PaginationConfig;
        if (currentPaginator) {
            currentPaginator.totalCount = totalCount;
            currentPaginator.pageSize = pageSize;
            currentPaginator.pageIndex = pageIndex;
        }

        // Actualizamos el ordenamiento de la grilla.
        const newOrderBy = {
            columnName: sortColumn,
            direction: sortOrder as "asc" | "desc",
        };

        // Creamos un nuevo objeto de configuración para asegurar la reactividad.
        this.gridConfig = {
            ...this.gridConfig,
            paginator: currentPaginator,
            OrderBy: newOrderBy,
        };
    }

    private _setGridConfiguration(): GridConfiguration {
        const config = createDefaultGridConfiguration({
            columns: [
                {
                    name: "imgUrl",
                    type: "img",
                    width: "20px",
                    isSortable: false,
                    hasHeader: false,
                },
                { name: "id", width: "20px" },
                { name: "name" },
                { name: "surname" },
                { name: "birthDate" },
                { name: "gender", isSortable: false }, // false por que ordenaria por id no alfabeticamente
                { name: "position", isSortable: false }, // false por que ordenaria por id no alfabeticamente
                { name: "country", isSortable: false }, // false por que ordenaria por id no alfabeticamente
                {
                    name: "active",
                    class: "status-circle",
                    align: "center",
                    width: "20px",
                },
                {
                    name: "elipsisActions", // Este es el nombre de la propiedad en GridData
                    align: "center",
                    isSortable: false,
                    type: "elipsis", // Indica que es la columna de elipsis
                    hasHeader: false,
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
            actionButtons: [
                {
                    class: "primary-button",
                    icon: "/assets/person.svg",
                    label: "Agregar",
                    action: (): void => this.onCreateEmployee(),
                },
                {
                    class: "download-button",
                    type: "download",
                    icon: "/assets/download.svg",
                    tooltip: "Descargar excel",
                },
            ],
        });
        return config;
    }

    private _setBreadcrumb(): void {
        this._breadcrumbService.setBreadcrumbs([
            { label: "Inicio", path: "/" },
            { label: `${this._queryParams.componentName}`, path: "/employees" },
            // { label: employeeName, path: `/employees/${this.employeeId}` }
        ]);
    }
}
