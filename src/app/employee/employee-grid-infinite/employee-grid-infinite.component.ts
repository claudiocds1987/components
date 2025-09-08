/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit,
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
import { finalize, map } from "rxjs";
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
    isLoadingGridData = true;

    private _employeeFilterParams: EmployeeFilterParams = {};
    private _employeeServices = inject(EmployeeService);
    private _exportService = inject(ExportService);
    private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
    private _spinnerService = inject(SpinnerService);
    private _breadcrumbService = inject(BreadcrumbService);
    private _alertService = inject(AlertService);

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

    onCreateEmployee(): void {
        // hacer redireccion a url de employee-form
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
            this.isLoadingGridData = true; // Para carga inicial o cambio de orden con mat-sort
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
                error: (error: HttpErrorResponse): void => {
                    this._alertService.showDanger(
                        `Error al obtener empleados. ${error.statusText}`,
                    );
                },
            });
    }

    private _loadData(): void {
        this._setEmployeeFilterParameters();
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

    private _updateGridConfig(
        paginatedListGridData: PaginatedList<GridData>,
    ): void {
        const { totalCount, pageIndex, pageSize } = paginatedListGridData;
        const { sortColumn = "", sortOrder = "" } = this._employeeFilterParams;

        // Actualizamos la configuración de la paginación con los datos del servidor.
        // Usamos el operador de nulidad para asegurar que 'hasPaginator' es un objeto.
        const currentPaginator = this.gridConfig
            .hasPaginator as PaginationConfig;
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
            hasPaginator: currentPaginator, // O usa un nuevo objeto si es necesario
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
                { name: "gender", isSortable: false },
                { name: "position" },
                { name: "country" },
                {
                    name: "active",
                    style: "status-circle",
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
            hasExcelDownload: true,
            hasCreateButton: true,
        });
        return config;
    }

    private _setBreadcrumb(): void {
        this._breadcrumbService.setBreadcrumbs([
            { label: "Inicio", path: "/" },
            { label: "Grilla Infinita", path: "/employees" },
            // { label: employeeName, path: `/employees/${this.employeeId}` }
        ]);
    }
}
