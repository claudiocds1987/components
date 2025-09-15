/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit,
} from "@angular/core";
import { EmployeeService } from "../../shared/services/employee.service";
import { AlertService } from "../../shared/services/alert.service";
import { BreadcrumbService } from "../../shared/services/breadcrumb.service";
import { Employee } from "../../shared/models/employee.model";
import { HttpClientModule, HttpErrorResponse } from "@angular/common/http";
import {
    createDefaultGridConfiguration,
    ElipsisAction,
    GridConfiguration,
    GridData,
} from "../../shared/models/grid-configuration.model";
import { DateTime } from "luxon";
import { CommonModule } from "@angular/common";
import { GridComponent } from "../../shared/components/grid/grid.component";
import { MatDialogModule } from "@angular/material/dialog";
import { BreadcrumbComponent } from "../../shared/components/breadcrumb/breadcrumb.component";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { catchError, finalize, forkJoin, Observable, of } from "rxjs";
import { SelectItem } from "../../shared/models/select-item.model";
import { PositionService } from "../../shared/services/position.service";
import { CountryService } from "../../shared/services/country.service";
import { ExportService } from "../../shared/services/export.service";
import { SpinnerService } from "../../shared/services/spinner.service";
import { Sort } from "@angular/material/sort";
import { Router } from "@angular/router";

@Component({
    selector: "app-employee-grid-all",
    standalone: true,
    imports: [
        CommonModule,
        HttpClientModule,
        GridComponent,
        MatDialogModule,
        BreadcrumbComponent,
        AlertComponent,
    ],
    templateUrl: "./employee-grid-all.component.html",
    styleUrl: "./employee-grid-all.component.scss",
})
export class EmployeeGridAllComponent implements OnInit, OnDestroy {
    gridConfig: GridConfiguration;
    gridData: GridData[] = [];
    isLoadingGridData = true;

    private _employees: Employee[] = [];
    private _positions: SelectItem[] = [];
    private _countries: SelectItem[] = [];
    private _genders: SelectItem[] = [
        { id: "all", description: "Todos" },
        { id: 0, description: "No binario" },
        { id: 1, description: "Masculino" },
        { id: 2, description: "Femenino" },
    ];
    private _queryParams = {
        componentPath: "employee-grid-all",
        componentName: "Grilla no paginada",
    };

    private _employeeService = inject(EmployeeService);
    private _exportService = inject(ExportService);
    private _spinnerService = inject(SpinnerService);
    private _changeDetectorRef: ChangeDetectorRef = inject(ChangeDetectorRef);
    private _alertService = inject(AlertService);
    private _breadcrumbService = inject(BreadcrumbService);
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

    onExportToExcel(sort?: Sort | void): void {
        this._spinnerService.show();
        let sortedData;

        if (sort) {
            sortedData = this._sortGridData(this._employees, sort);
        } else {
            sortedData = this._employees;
        }

        const processedData = this._mapEmployeesForExport(sortedData);

        const fileName = "Empleados.xlsx";
        setTimeout((): void => {
            this._exportService.exportToExcel(processedData, fileName);
            this._spinnerService.hide();
            this._changeDetectorRef.markForCheck();
        }, 1500);
    }

    // función para ordenar la data localmente
    private _sortGridData(data: Employee[], sort: Sort): Employee[] {
        if (!sort.active || sort.direction === "") {
            return data;
        }

        return data.sort((a, b): number => {
            const isAsc = sort.direction === "asc";
            const valueA = a[sort.active] ?? "";
            const valueB = b[sort.active] ?? "";

            return (valueA < valueB ? -1 : 1) * (isAsc ? 1 : -1);
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

    private _loadData(): void {
        forkJoin({
            positions: this._getPositions(),
            countries: this._getCountries(),
            employees: this._getEmployeeAll(),
        })
            .pipe(
                finalize((): void => {
                    this.isLoadingGridData = false;
                    this._changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (results): void => {
                    this._positions = results.positions;
                    this._countries = results.countries;
                    this._employees = results.employees;
                    this.gridData = this._mapEmployeeListToGridData(
                        this._employees,
                    );
                },
                error: (error: HttpErrorResponse): void => {
                    this.isLoadingGridData = false;
                    this._alertService.showDanger(
                        `Error al cargar datos. ${error.statusText}`,
                    );
                },
            });
    }

    private _getEmployeeAll(): Observable<Employee[]> {
        return this._employeeService.getEmployeesAll().pipe(
            catchError((error: HttpErrorResponse): Observable<Employee[]> => {
                this._alertService.showDanger(
                    `Error al cargar la lista de empleados. ${error.statusText}`,
                );
                return of([]);
            }),
        );
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

    private _mapEmployeeListToGridData(employeeList: Employee[]): GridData[] {
        const transformedItems: GridData[] = employeeList.map(
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
        return transformedItems;
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
                { name: "birthDate", type: "date" },
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
            filterByColumn: "id",
            hasInputSearch: true,
            hasChips: false,
            hasExcelDownload: true,
            hasCreateButton: true,
            paginator: {
                pageSizeOptions: [25, 50],
                pageSize: 25,
                pageIndex: 0,
                totalCount: 0,
                isServerSide: false, // Al ser no paginada se indica false para que la propia grilla maneje el paginador
            },
            hasSorting: {
                isServerSide: false, // Al ser no paginada se indica false para que la propia grilla maneje el sort
            },
        });
        return config;
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

    private _setBreadcrumb(): void {
        this._breadcrumbService.setBreadcrumbs([
            { label: "Inicio", path: "/" },
            { label: `${this._queryParams.componentName}`, path: "/employees" },
            // { label: employeeName, path: `/employees/${this.employeeId}` }
        ]);
    }
}
