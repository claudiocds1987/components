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
    GridData,
    PaginationConfig,
    ElipsisAction,
} from "../../shared/models/gridConfiguration";
import { GridComponent } from "../../shared/components/grid/grid.component"; // Correct path for GridComponent
import { GridFilterComponent } from "../../shared/components/grid/grid-filter/grid-filter.component"; // Correct path for GridFilterComponent
import { CommonModule } from "@angular/common";
import { DateTime } from "luxon";
import { EmployeeService } from "../../shared/services/employee.service";
import { EmployeeFilterParams } from "../../shared/models/employee-filter-params.model";
import { PaginatedList } from "../../shared/models/paginated-list.model";
import { Employee } from "../../shared/models/employee.model";
import { catchError, finalize, forkJoin, map, Observable, of } from "rxjs";
import { HttpClientModule } from "@angular/common/http";
import { PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import { ExportService } from "../../shared/services/export.service";
import { SpinnerService } from "../../shared/services/spinner.service";
import { Chip } from "../../shared/components/chips/chips/chips.component";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { EmployeeFormComponent } from "../employee-form/employee-form/employee-form.component";
import { SelectItem } from "../../shared/models/select-item.model";
import { CountryService } from "../../shared/services/country.service";
import { PositionService } from "../../shared/services/position.service";

@Component({
    selector: "app-employee-grid",
    standalone: true,
    imports: [
        CommonModule,
        HttpClientModule,
        GridComponent,
        GridFilterComponent,
        MatDialogModule,
    ],
    templateUrl: "./employee-grid.component.html",
    styleUrl: "./employee-grid.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeGridComponent implements OnInit {
    gridFilterConfig: GridFilterConfig[] = [];
    gridFilterForm!: FormGroup;
    gridConfig: GridConfiguration;
    gridData: GridData[] = [];
    employees: Employee[] = [];
    chips: Chip[] = [];
    countries: SelectItem[] = [];
    positions: SelectItem[] = [];
    isLoadingGridData = true;
    isLoadingFilterGridData = true;

    private _employeeFilterParams: EmployeeFilterParams = {};
    private _employeeServices = inject(EmployeeService);
    private _countryServices = inject(CountryService);
    private _positionServices = inject(PositionService);
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
        this._setGridFilter();
        this._setGridFilterForm();
        this.gridConfig = this._setGridConfiguration();
    }

    ngOnInit(): void {
        this._loadData();
    }

    applyFilter(filterValues: Record<string, unknown>): void {
        console.log("Valores del filtro aplicados:", filterValues);
        // 1. Mapeamos `filterValues` a `EmployeeFilterParams`
        const filterParamsForBackend =
            this._mapToEmployeeFilterParams(filterValues);
        console.log("Valores del filtro mapeados:", filterValues);
        // 2. Reiniciamos completamente el objeto de parámetros.
        //    Esto garantiza que no se arrastren filtros antiguos.
        this._employeeFilterParams = {};
        // 3. Reasignamos los parámetros de paginación por defecto.
        this._setEmployeeFilterParameters();
        // 4. con Object.assign() Copiamos los valores de filterParamsForBackend
        // (donde tiene las fecha formateadas a dd/mm/yyyy con los otros datos que vienen del filtro) a `_employeeFilterParams`,
        //"_employeeFilterParams" es lo que se envía al servicio.
        Object.assign(this._employeeFilterParams, filterParamsForBackend);
        console.log(
            "Valores del employeeFilterParams asign:",
            this._employeeFilterParams,
        );

        if (this.gridConfig.hasPagination) {
            this.gridConfig.hasPagination.pageIndex = 0;
        }

        this._getEmployees();
    }

    onGridSortChange(sortEvent: Sort): void {
        // obteniendo nombre de la columna
        let sortColumnName = sortEvent.active;

        // Si la columna activa es 'position', ajusta el nombre
        if (sortEvent.active === "position") {
            sortColumnName = "position.description";
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
        this._employeeFilterParams = {
            ...this._employeeFilterParams,
            page: event.pageIndex + 1,
            limit: event.pageSize,
        };
        this._getEmployees();
    }

    onExportToExcel(): void {
        this._spinnerService.show();
        // Obtener todos los valores del formulario
        const filterValues = this.gridFilterForm.value;
        // Pasa los valores del formulario a la función de mapeo.
        const exportParams = this._mapToEmployeeFilterParams(filterValues);
        console.log("exportParams: ", exportParams);
        // Asigna los parámetros de ordenamiento.
        if (this._employeeFilterParams.sortColumn) {
            exportParams.sortColumn = this._employeeFilterParams.sortColumn;
        }
        if (this._employeeFilterParams.sortOrder) {
            exportParams.sortOrder = this._employeeFilterParams.sortOrder;
        }
        // El resto de la función se mantiene igual.
        this._employeeServices
            .getEmployeesForExportJsonServer(exportParams)
            .pipe(
                map((employees: Employee[]): any =>
                    this._mapEmployeesForExport(employees),
                ),
                finalize((): void => {
                    this._spinnerService.hide();
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (processedData: any[]): void => {
                    const fileName = "Empleados.xlsx";
                    this._exportService.exportToExcel(processedData, fileName);
                },
                error: (error: unknown): void => {
                    console.error(
                        "Error al descargar el archivo de Excel:",
                        error,
                    );
                },
            });
    }

    /* onExportToExcel2(): void {
        this._spinnerService.show();
        // Obtener los valores del formulario de filtro.
        const filterValues = this.gridFilterForm.value;
        // Usamos el tipo EmployeeFilterParams para los parametros en json-server.
        const exportParams: EmployeeFilterParams = {};

        console.log("filtervalues: ", filterValues);

        if (filterValues.id) {
            exportParams.id = filterValues.id;
        }
        if (filterValues.name) {
            exportParams.name = filterValues.name;
        }
        if (filterValues.surname) {
            exportParams.surname = filterValues.surname;
        }
        if (filterValues.birthDate) {
            exportParams.birthDate = filterValues.birthDate;
        }

        if (filterValues.position && filterValues.position !== "all") {
            exportParams.position = filterValues.position;
        }

        if (filterValues.active !== null && filterValues.active !== "all") {
            // Usa los valores numéricos 1 y 0 para 'active'
            exportParams.active = filterValues.active;
        }
        // Asigna los parámetros de ordenamiento.
        if (this._employeeFilterParams.sortColumn) {
            exportParams.sortColumn = this._employeeFilterParams.sortColumn;
        }
        if (this._employeeFilterParams.sortOrder) {
            exportParams.sortOrder = this._employeeFilterParams.sortOrder;
        }
        // Obtener todos los datos del backend con los filtros y ordenamiento aplicados
        this._employeeServices
            .getEmployeesForExportJsonServer(exportParams)
            .pipe(
                map((employees: Employee[]): any =>
                    // this._mapEmployeesForExport() para que en en excel salga en position la descripcion, fecha formateada, activo como activo/inactivo
                    this._mapEmployeesForExport(employees),
                ),
            )
            .subscribe({
                next: (processedData: any[]): void => {
                    const fileName = "Empleados.xlsx";
                    // Simulación de descarga con setTimeout
                    setTimeout((): void => {
                        this._exportService.exportToExcel(
                            processedData,
                            fileName,
                        );
                        this._spinnerService.hide();
                        this._cdr.markForCheck();
                    }, 2000); // 2000 ms = 2 segundos
                },
                error: (error: unknown): void => {
                    console.error(
                        "Error al descargar el archivo de Excel:",
                        error,
                    );
                },
            });
    } */

    onFilterDescriptionsEmitted(chips: Chip[]): void {
        // Actualizamos la lista de chips en la grilla
        this.chips = chips.map(
            (chip: Chip): Chip => ({
                ...chip,
                disabled: chip.value === "all", // si se elige opcion "todos" desabilitamos el chip
            }),
        );
    }

    onRemoveChip(chip: Chip): void {
        // Obtenemos el nombre del campo del filtro que se va a quitar ej: 'name', 'position'
        const fieldName = chip.key;
        // Reseteamos el valor del formulario para campo position o active
        if (chip.key === "position" || chip.key === "active") {
            this.gridFilterForm.get(fieldName)?.patchValue("all");
        } else {
            this.gridFilterForm.get(fieldName)?.patchValue(null);
        }
        // Llamamos a applyFilter con los valores actualizados del formulario
        this.applyFilter(this.gridFilterForm.value);
        // Actualizamos la lista de chips activos
        this.chips = this.chips.filter(
            (c: Chip): boolean => c.key !== fieldName,
        );
        // para que los chips position y active al borrarse, siempre aparezcan por defecto con la opcion "Todos"
        if (fieldName === "position" || fieldName === "active") {
            const filterConfig = this.gridFilterConfig.find(
                (c: GridFilterConfig): boolean => c.fieldName === fieldName,
            );
            if (filterConfig) {
                const defaultChip: Chip = {
                    key: fieldName,
                    label: `${filterConfig.label}: Todos`,
                    value: "all",
                    disabled: true,
                };
                this.chips.push(defaultChip);
            }
        }
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
                // Aquí puedes llamar a tu servicio para guardar los datos
                //this._saveNewEmployee(result);
            } else {
                console.log("Formulario de empleado cancelado.");
            }
        });
    }

    private _mapEmployeesForExport(employees: Employee[]): any[] {
        return employees.map((employee): any => {
            const mappedEmployee: any = { ...employee };
            if (
                mappedEmployee.position &&
                mappedEmployee.position.description
            ) {
                mappedEmployee.position = mappedEmployee.position.description;
            }

            if (typeof mappedEmployee.active === "boolean") {
                mappedEmployee.active = mappedEmployee.active
                    ? "Activo"
                    : "Inactivo";
            }

            if (typeof mappedEmployee.birthDate === "string") {
                const luxonDate = DateTime.fromISO(mappedEmployee.birthDate);
                if (luxonDate.isValid) {
                    mappedEmployee.birthDate = luxonDate.toFormat("dd/MM/yyyy");
                }
            }

            return mappedEmployee;
        });
    }

    private _setEmployeeFilterParameters(): void {
        // Aca se establece por defecto como va a aparecer la grilla paginada por 1ra vez.
        this._employeeFilterParams.page = 1;
        this._employeeFilterParams.limit = 25;
        this._employeeFilterParams.sortColumn = "id";
        this._employeeFilterParams.sortOrder = "asc";
    }

    private _getEmployees(): void {
        this.isLoadingGridData = true;
        this._employeeServices
            .getEmployees(this._employeeFilterParams)
            .pipe(
                map(this._mapPaginatedListToGridData.bind(this)),
                finalize((): void => {
                    this.isLoadingGridData = false;
                    // usamos markForCheck en isLoadingGridData para avisarle a Angular que actualize su valor
                    // a false ya que isLoadingGridData no se puede cambiar por referencia porque no es un objeto
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (
                    paginatedListGridData: PaginatedList<GridData>,
                ): void => {
                    this.gridData = paginatedListGridData.items;
                    this._updateGridConfigOnDataReceived(paginatedListGridData);
                },
                error: (error: any): void => {
                    console.error(
                        "EmployeeGridComponent: Error al obtener empleados:",
                        error,
                    );
                },
            });
    }

    private _getCountriesObservable(): Observable<SelectItem[]> {
        // La función ahora solo devuelve el observable del servicio.
        return this._countryServices.getCountries().pipe(
            catchError((error: unknown): Observable<SelectItem[]> => {
                console.error("Error al obtener países:", error);
                // Devolvemos un observable vacío para que el forkJoin no falle.
                return of([]);
            }),
        );
    }

    private _getPositionsObservable(): Observable<SelectItem[]> {
        // La función solo devuelve el observable del servicio.
        return this._positionServices.getPositions().pipe(
            catchError((error: unknown): Observable<SelectItem[]> => {
                console.error("Error al obtener posiciones:", error);
                return of([]);
            }),
        );
    }

    private _loadData(): void {
        forkJoin({
            positions: this._getPositionsObservable(),
            countries: this._getCountriesObservable(),
        }).subscribe({
            next: (results: {
                positions: SelectItem[];
                countries: SelectItem[];
            }): void => {
                this.positions = results.positions;
                this.countries = results.countries;
                const allPositionsItem: SelectItem = {
                    id: "all",
                    description: "Todos",
                };
                // Agregando opcion "Todos" al inicio de la lista de posiciones
                this.positions.unshift(allPositionsItem);
                // le asigno los puestos al gridFilterConfig haciendo cambio de referencia
                // para que onPush detecte el cambio
                this.gridFilterConfig = this.gridFilterConfig.map(
                    (config: GridFilterConfig): GridFilterConfig =>
                        config.fieldName === "position"
                            ? { ...config, selectItems: this.positions }
                            : config,
                );

                // ✅ Modificación clave: Inicializar los chips aquí
                this.onFilterDescriptionsEmitted([
                    {
                        key: "position",
                        label: "Puesto: Todos",
                        value: "all",
                        disabled: true,
                    },
                    {
                        key: "active",
                        label: "Estado: Todos",
                        value: "all",
                        disabled: true,
                    },
                ]);

                this.isLoadingFilterGridData = false;
                this._setEmployeeFilterParameters();
                this._getEmployees();
            },
            error: (error: unknown): void => {
                console.error("Error en forkJoin:", error);
            },
        });
    }

    private _mapPaginatedListToGridData(
        paginatedList: PaginatedList<Employee>,
    ): PaginatedList<GridData> {
        const transformedItems: GridData[] = paginatedList.items.map(
            (employee: Employee): GridData => {
                const gridData: GridData = { id: employee.id as number };

                for (const key in employee) {
                    const value = (employee as any)[key];
                    // para manejar la propiedad 'position'
                    if (
                        key === "position" &&
                        typeof value === "object" &&
                        value !== null
                    ) {
                        // Asigna el valor de la propiedad 'description' a la celda de la grilla
                        gridData[key] = (
                            value as { description: string }
                        ).description;
                    }
                    //  para manejar la propiedad 'active' (que es un booleano)
                    else if (key === "active" && typeof value === "boolean") {
                        gridData[key] = value ? "Activo" : "Inactivo";
                    }
                    // Si el valor es una fecha, la formateamos
                    else if (typeof value === "string") {
                        const luxonDate = DateTime.fromISO(value);
                        if (luxonDate.isValid) {
                            gridData[key] = luxonDate.toFormat("dd/MM/yyyy");
                        } else {
                            gridData[key] = value;
                        }
                    }
                    // Si no es ninguno de los casos anteriores, asignamos el valor tal cual
                    else {
                        gridData[key] = value;
                    }
                }

                gridData["elipsisActions"] = this._setElipsisActions(employee);
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
            // Puedes agregar más opciones aquí
            // {
            //     id: 'view',
            //     label: 'Ver Detalles',
            //     icon: 'visibility',
            //     action: (id: number): void => console.log(`Ver detalles de ${id}`),
            //     condition: (row: GridData): boolean => true // Siempre visible
            // }
        ];
    }

    private _editEmployee(id: number): void {
        console.log(`Editando empleado con ID: ${id}`);
        // Aquí iría tu lógica para navegar a la página de edición o abrir un modal
        // Por ejemplo: this._router.navigate(['/employees', id, 'edit']);
    }

    private _deleteEmployee(id: number): void {
        // QUE PONGA EL EMPLEADO COMO INACTIVO NO LO BORRE
        console.log(`Intentando eliminar empleado con ID: ${id}`);
        // Idealmente, aquí tendrías un diálogo de confirmación antes de la eliminación real.
        //this.isLoadingData = true;
        /* this._employeeServices
            .deleteEmployee(id)
            .pipe(
                finalize((): void => {
                    // Tipo explícito para finalize
                    this.isLoadingData = false;
                    this._cdr.markForCheck(); // Forzar detección de cambios después de la eliminación
                }),
            )
            .subscribe({
                next: (): void => {
                    // Tipo explícito para next
                    console.log(`El registro con ID ${id} ha sido eliminado.`);
                    // Después de eliminar, recargamos la grilla para reflejar el cambio.
                    // Podrías también solo quitar el elemento de `gridData` si el backend confirma la eliminación.
                    this._getEmployees();
                },
                error: (error: any): void => {
                    // Tipo explícito para error
                    console.error(
                        `Error al eliminar el registro con ID ${id}:`,
                        error,
                    );
                    // Manejar el error, mostrar un mensaje al usuario, etc.
                },
            }); */
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
    }

    private _updateGridConfigOnDataReceived(
        paginatedListGridData: PaginatedList<GridData>,
    ): void {
        // 1. Obtiene la configuración de paginación actual de manera concisa.
        const currentPaginationConfig =
            this.gridConfig.hasPagination || this._defaultPaginatorOptions;

        // 2. Desestructuramos los valores del servicio para que el código sea más legible.
        const { totalCount, pageIndex, pageSize } = paginatedListGridData;
        const { sortColumn = "", sortOrder = "" } = this._employeeFilterParams;

        // 3. Comprueba si los valores han cambiado.
        const paginationChanged =
            currentPaginationConfig.totalCount !== totalCount ||
            currentPaginationConfig.pageIndex !== pageIndex ||
            currentPaginationConfig.pageSize !== pageSize;

        const orderByChanged =
            this.gridConfig.OrderBy.columnName !== sortColumn ||
            this.gridConfig.OrderBy.direction !== sortOrder;

        // 4. Si hay algún cambio, crea un nuevo objeto para forzar la detección de cambios.
        if (paginationChanged || orderByChanged) {
            this.gridConfig = {
                ...this.gridConfig,
                hasPagination: {
                    ...currentPaginationConfig,
                    totalCount,
                    pageSize,
                    pageIndex,
                },
                OrderBy: {
                    columnName: sortColumn,
                    direction: sortOrder as "asc" | "desc" | "",
                },
            };
        }
    }

    private _mapToEmployeeFilterParams(obj: unknown): EmployeeFilterParams {
        // NOTA: EL CODIGO ES LARGO PORQUE JSON-SERVER NO ES MUY DINAMICO PARA FILTROS
        const params: EmployeeFilterParams = {};
        const source = obj as Record<string, unknown>;

        console.log("Valores de filtro originales:", source);

        // Iterar sobre el objeto de filtro completo
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                const value = source[key];

                // 1. Manejar el campo 'active' de forma especial
                if (
                    key === "active" &&
                    (value === "all" || value === "Todos" || value === "")
                ) {
                    continue;
                }

                // 2. Manejar el campo de rango de fechas de forma explícita
                if (key === "birthDateRange" && value) {
                    const dateRangeValue = value as {
                        startDate: Date | string | null;
                        endDate: Date | string | null;
                    };

                    const newDateRange: {
                        startDate?: string;
                        endDate?: string;
                    } = {};

                    if (dateRangeValue.startDate) {
                        const dateObj =
                            dateRangeValue.startDate instanceof Date
                                ? dateRangeValue.startDate
                                : new Date(dateRangeValue.startDate);
                        const luxonStartDate = DateTime.fromJSDate(dateObj);
                        if (luxonStartDate.isValid) {
                            newDateRange.startDate =
                                luxonStartDate.toFormat("yyyy-MM-dd");
                        }
                    }

                    if (dateRangeValue.endDate) {
                        const dateObj =
                            dateRangeValue.endDate instanceof Date
                                ? dateRangeValue.endDate
                                : new Date(dateRangeValue.endDate);
                        const luxonEndDate = DateTime.fromJSDate(dateObj);
                        if (luxonEndDate.isValid) {
                            newDateRange.endDate =
                                luxonEndDate.toFormat("yyyy-MM-dd");
                        }
                    }

                    // Asignamos el objeto de rango de fechas formateado a 'params'
                    (params as any).birthDateRange = newDateRange;
                    continue;
                }
                // si solo usa el filtro birthDate
                if (key === "birthDate" && value instanceof Date) {
                    const luxonDate = DateTime.fromJSDate(value);
                    if (luxonDate.isValid) {
                        (params as any)[key] = luxonDate.toFormat("yyyy-MM-dd");
                    }
                    continue;
                }

                // 3. Manejar los otros campos
                if (
                    typeof value === "string" &&
                    value !== "" &&
                    value !== "all" &&
                    value !== "Todos"
                ) {
                    if (key === "position") {
                        // Para position.id, que es un filtro anidado
                        (params as any)["position.id"] = value;
                    } else {
                        // Para otros filtros de texto como 'name', 'surname'
                        (params as any)[key] = value;
                    }
                } else if (
                    typeof value === "boolean" ||
                    typeof value === "number"
                ) {
                    // Para booleanos como 'active' o números como 'id'
                    (params as any)[key] = value;
                }
            }
        }

        console.log("Parámetros finales para el backend:", params);
        return params;
    }

    /* private _mapToEmployeeFilterParamsMEJORADA(
        obj: unknown,
    ): EmployeeFilterParams {
        const params: EmployeeFilterParams = {};
        const source = obj as Record<string, unknown>;

        console.log("Valores de filtro originales:", source);

        // ✅ Paso 1: Procesar el campo de rango de fechas
        if (source["birthDateRange"]) {
            const dateRangeValue = source["birthDateRange"] as {
                startDate: Date | string | null;
                endDate: Date | string | null;
            };

            const newDateRange: { startDate?: string; endDate?: string } = {};

            if (dateRangeValue.startDate) {
                const dateObj =
                    dateRangeValue.startDate instanceof Date
                        ? dateRangeValue.startDate
                        : new Date(dateRangeValue.startDate);
                const luxonStartDate = DateTime.fromJSDate(dateObj);
                if (luxonStartDate.isValid) {
                    newDateRange.startDate =
                        luxonStartDate.toFormat("yyyy-MM-dd");
                }
            }

            if (dateRangeValue.endDate) {
                const dateObj =
                    dateRangeValue.endDate instanceof Date
                        ? dateRangeValue.endDate
                        : new Date(dateRangeValue.endDate);
                const luxonEndDate = DateTime.fromJSDate(dateObj);
                if (luxonEndDate.isValid) {
                    newDateRange.endDate = luxonEndDate.toFormat("yyyy-MM-dd");
                }
            }

            // Asignamos el objeto de rango de fechas formateado a 'params'
            (params as any).birthDateRange = newDateRange;
        }

        // ✅ Paso 2: Iterar sobre el resto de los campos
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                const value = source[key];

                // Ignoramos la propiedad 'birthDateRange' para evitar duplicarla
                if (key === "birthDateRange") {
                    continue;
                }

                // Asignamos el resto de los valores
                if (
                    typeof value === "string" &&
                    value !== "" &&
                    value !== "all" &&
                    value !== "Todos"
                ) {
                    (params as any)[key] = value;
                } else if (value instanceof Date) {
                    const luxonDate = DateTime.fromJSDate(value);
                    if (luxonDate.isValid) {
                        (params as any)[key] = luxonDate.toFormat("yyyy-MM-dd");
                    }
                } else if (typeof value === "boolean") {
                    (params as any)[key] = value;
                }
            }
        }

        // ✅ Paso 3: Manejar el campo 'active'
        if (
            (params.active as unknown as string) === "all" ||
            (params.active as unknown as string) === "Todos" ||
            (params.active as unknown as string) === ""
        ) {
            delete params.active;
        }

        console.log("Parámetros finales (formato para UI):", params);
        return params;
    }
 */
    // Mapea para funcionar con json-server
    /*  private _mapToEmployeeFilterParams2(obj: unknown): EmployeeFilterParams {
        const newObj: Partial<EmployeeFilterParams> = {
            ...(obj as Record<string, unknown>),
        };
        console.log("mapToEmployeeFilter: ", newObj);

        // Primero, verificamos si la propiedad 'active' existe y si es un string.
        if (typeof newObj.active === "string") {
            // Ahora que sabemos que es un string, podemos compararlo con 'all' o '' de forma segura.
            if (newObj.active === "Todos" || newObj.active === "") {
                // borramos la propiedad 'active' si es 'all' o '' porque json server
                // el campo active es boolean no tiene el valor "all"
                delete newObj.active;
            }
        }

        for (const key in newObj) {
            if (Object.prototype.hasOwnProperty.call(newObj, key)) {
                const value = newObj[
                    key as keyof Partial<EmployeeFilterParams>
                ] as unknown;

                let luxonDate: DateTime | null = null;

                // 1. Verifica si es un Date nativo
                if (value instanceof Date) {
                    luxonDate = DateTime.fromJSDate(value);
                }
                // 2. Si no es un Date nativo, verifica si es un objeto DateTime de Luxon
                else if (value instanceof DateTime) {
                    luxonDate = value;
                }
                // Si se logró obtener un objeto Luxon DateTime válido
                if (luxonDate && luxonDate.isValid) {
                    // Formatear a YYYY-MM-DD para el backend (json-server)
                    (newObj as any)[key] = luxonDate.toFormat("yyyy-MM-dd");
                }

                // 4. Manejo de otros tipos (objetos anidados, null, undefined, string, number, boolean)
                else if (
                    typeof value === "object" &&
                    value !== null &&
                    !Array.isArray(value)
                ) {
                    // Llamada recursiva para objetos anidados que podrían contener más fechas
                    (newObj as any)[key] =
                        this._mapToEmployeeFilterParams(value);
                } else {
                    // Para valores nulos, indefinidos, strings, numbers, booleans, etc. Se asigna el valor tal cual.
                    (newObj as any)[key] = value;
                }
            }
        }
        return newObj as EmployeeFilterParams;
    }
 */
    private _setGridConfiguration(): GridConfiguration {
        const config = createDefaultGridConfiguration({
            columns: [
                { name: "id", width: "70px", label: "ID" }, // Añadido label
                { name: "name", label: "Nombre" }, // Añadido label
                { name: "surname", label: "Apellido" /*isSortable: false*/ }, // Añadido label
                { name: "birthDate", label: "Fecha de Nacimiento" }, // Añadido label
                { name: "position", label: "Puesto" }, // Añadido label
                { name: "active", label: "Estado" }, // Añadido label
                {
                    name: "elipsisActions", // Este es el nombre de la propiedad en GridData
                    label: "actions", // Opcional: la etiqueta de la columna en el encabezado
                    width: "70px",
                    align: "center",
                    isSortable: false,
                    isElipsisColumn: true, // ¡Indica que es la columna de elipsis!
                    hasHeaderTooltip: true,
                    //headerIcon: "settings", // Icono para el encabezado de la columna de acciones
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
            hasInputSearch: false, // true para que aparezca
            hasChips: true, // Para mostrar los chips de filtros aplicados
            hasExcelDownload: true, // Valor por defecto
            hasCreateButton: true, // Valor por defecto
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
                fieldName: "name",
                fieldType: "text",
                label: "Nombre",
            },
            {
                fieldName: "surname",
                fieldType: "text",
                label: "Apellido",
            },
            {
                fieldName: "birthDate",
                fieldType: "date",
                label: "Fecha de nacimiento",
            },
            // Campo daterange para filtrar por un rango de fechas de nacimiento
            {
                fieldName: "birthDateRange",
                fieldType: "dateRange",
                label: "Rango de nacimiento",
            },
            {
                fieldName: "position",
                fieldType: "select",
                label: "Puesto",
                selectItems: [],
            },
            {
                fieldName: "active",
                fieldType: "select",
                label: "Estado",
                selectItems: [
                    { description: "Todos", id: "all" },
                    {
                        description: "activo",
                        id: 1,
                    },
                    {
                        description: "inactivo",
                        id: 0,
                    },
                ],
            },

            // se puede seguir agregando mas campos de tipo text, date, select.
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
                // Inicializamos los select con 'all'
                this.gridFilterForm.addControl(
                    filter.fieldName,
                    new FormControl("all"),
                );
                return;
            }

            if (filter.fieldType === "date") {
                this.gridFilterForm.addControl(
                    filter.fieldName,
                    new FormControl(null),
                );
            }

            if (filter.fieldType === "dateRange") {
                this.gridFilterForm.addControl(
                    filter.fieldName,
                    new FormGroup({
                        startDate: new FormControl(null),
                        endDate: new FormControl(null),
                    }),
                );
            }
        });
    }
}
