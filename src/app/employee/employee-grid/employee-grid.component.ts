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
import { PositionService } from "../../shared/services/position.service";
import { CountryService } from "../../shared/services/country.service";

interface DateRangeValue {
    startDate: string | null;
    endDate: string | null;
}

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

    isLoadingGridData = true;
    isLoadingFilterGridData = true;

    private _positions: SelectItem[] = [];
    private _countries: SelectItem[] = [];
    private _genders: SelectItem[] = [
        { id: "all", description: "Todos" },
        { id: 0, description: "No binario" },
        { id: 1, description: "Masculino" },
        { id: 2, description: "Femenino" },
    ];

    private _defaultChips = {
        gender: "all",
        position: "all",
        country: "all",
        active: "all",
    };

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
        this._setGridFilterConfig(); // se definen los tipos de inputs(text, date, select) para grod-filter.component
        this._setGridFilterForm(); // se define el formulario en funcion de setGridFilterConfig()
        this._createChips(this._defaultChips); // se crean los chips por default estado,puesto y genero
    }

    ngOnInit(): void {
        this._loadData();
    }

    applyFilter(filterValues: Record<string, unknown>): void {
        this._employeeFilterParams = {};
        this._setEmployeeFilterParameters();
        // En caso que desde grid-filter.component se hizo clic en boton Limpiar filtros, el filtro viene vacio
        const isClearFilter = Object.values(filterValues).every(
            (value): boolean =>
                value === null ||
                (typeof value === "object" &&
                    value !== null &&
                    Object.values(value).every((val): boolean => val === null)),
        );
        // si el filtro de grid-filter.component esta vacio
        if (isClearFilter) {
            // Se crean los chips Estado, Puesto y Genero por default
            this._createChips(this._defaultChips);
            this._setGridFilterForm(); // ser resetea el formulario de grid-filter.component
        } else {
            this._createChips(filterValues);
            const filterParamsForBackend =
                this._mapToEmployeeFilterParams(filterValues);
            Object.assign(this._employeeFilterParams, filterParamsForBackend);
        }
        // Lógica de paginación y obtención de datos que se aplica en ambos casos
        if (this.gridConfig.hasPagination) {
            this.gridConfig.hasPagination.pageIndex = 0;
        }
        this._getEmployees();
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

    onRemoveChip(chip: Chip): void {
        const fieldName = chip.key;
        // Define un mapa de estrategias para manejar cada tipo de filtro
        const resetStrategies = {
            position: (): void =>
                this.gridFilterForm.get(fieldName)?.patchValue("all"),
            country: (): void =>
                this.gridFilterForm.get(fieldName)?.patchValue("all"),
            active: (): void =>
                this.gridFilterForm.get(fieldName)?.patchValue("all"),
            gender: (): void =>
                this.gridFilterForm.get(fieldName)?.patchValue("all"),
            birthDateRange: (): void =>
                this.gridFilterForm.get(fieldName)?.patchValue({
                    startDate: null,
                    endDate: null,
                }),
            // Estrategia por defecto para otros campos (name, surname, etc.)
            default: (): void =>
                this.gridFilterForm.get(fieldName)?.patchValue(null),
        };
        // Obtenemos la estrategia correspondiente o usamos la por defecto
        const resetAction =
            resetStrategies[fieldName as keyof typeof resetStrategies] ||
            resetStrategies.default;
        resetAction();

        this.applyFilter(this.gridFilterForm.value);
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

    private _createChips(filterValues: Record<string, unknown>): void {
        this.chips = this._mapToChipsDescription(filterValues);
    }

    private _mapToChipsDescription(
        filterValues: Record<string, unknown>,
    ): Chip[] {
        const newChips: Chip[] = [];

        const specialCases = {
            position: (value: any): string => {
                if (typeof value === "number") {
                    const item = this._positions.find(
                        (position: SelectItem): boolean =>
                            position.id === value,
                    );
                    return item
                        ? `Puesto: ${item.description}`
                        : `Puesto: ${value}`;
                }
                return "Puesto: Todos";
            },
            country: (value: any): string => {
                if (typeof value === "number") {
                    const item = this._countries.find(
                        (country: SelectItem): boolean => country.id === value,
                    );
                    return item
                        ? `Pais: ${item.description}`
                        : `Pais: ${value}`;
                }
                return "Pais: Todos";
            },
            gender: (value: any): string => {
                if (typeof value === "number") {
                    const item = this._genders.find(
                        (gender: SelectItem): boolean => gender.id === value,
                    );
                    return item
                        ? `Género: ${item.description}`
                        : `Género: ${value}`;
                }
                return "Género: Todos";
            },
            active: (value: any): string => {
                // Maneja el valor 'all' para el caso de 'Estado'
                if (value === "all") {
                    return "Estado: Todos";
                }
                return `Estado: ${value ? "Activo" : "Inactivo"}`;
            },
        };

        for (const [key, value] of Object.entries(filterValues)) {
            if (value === null || value === undefined || value === "") {
                continue;
            }

            let labelText: string;
            const isDisabled: boolean = value === "all";

            if (
                key === "birthDateRange" &&
                typeof value === "object" &&
                value !== null
            ) {
                const dateRangeValue = value as DateRangeValue;
                if (dateRangeValue.startDate || dateRangeValue.endDate) {
                    const formattedStartDate = dateRangeValue.startDate
                        ? DateTime.fromISO(dateRangeValue.startDate).toFormat(
                              "dd/MM/yyyy",
                          )
                        : "N/A";
                    const formattedEndDate = dateRangeValue.endDate
                        ? DateTime.fromISO(dateRangeValue.endDate).toFormat(
                              "dd/MM/yyyy",
                          )
                        : "N/A";
                    labelText = `Fecha de Nacimiento: ${formattedStartDate} - ${formattedEndDate}`;
                    newChips.push({
                        key,
                        label: labelText,
                        value,
                        disabled: isDisabled,
                    });
                }
            } else if (key in specialCases) {
                const creator = specialCases[key as keyof typeof specialCases];
                labelText = creator(value);
                newChips.push({
                    key,
                    label: labelText,
                    value,
                    disabled: isDisabled,
                });
            } else {
                labelText = `${key}: ${value}`;
                newChips.push({
                    key,
                    label: labelText,
                    value,
                    disabled: isDisabled,
                });
            }
        }
        return newChips;
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
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (
                    paginatedListGridData: PaginatedList<GridData>,
                ): void => {
                    this.gridData = paginatedListGridData.items;
                    this._updateGridConfig(paginatedListGridData);
                },
                error: (error: any): void => {
                    console.error(
                        "EmployeeGridComponent: Error al obtener empleados:",
                        error,
                    );
                },
            });
    }

    private _getPositions(): Observable<SelectItem[]> {
        return this._positionServices.getPositions().pipe(
            catchError((error: unknown): Observable<SelectItem[]> => {
                console.error("Error al obtener posiciones:", error);
                return of([]);
            }),
        );
    }
    private _getCountries(): Observable<SelectItem[]> {
        return this._countryServices.getCountries().pipe(
            catchError((error: unknown): Observable<SelectItem[]> => {
                console.error("Error al obtener paises:", error);
                return of([]);
            }),
        );
    }

    private _loadSelects(): Observable<boolean> {
        this.isLoadingFilterGridData = true;
        return forkJoin({
            positions: this._getPositions(),
            countries: this._getCountries(),
        }).pipe(
            map(
                (results: {
                    positions: SelectItem[];
                    countries: SelectItem[];
                }): boolean => {
                    this._positions = results.positions;
                    this._countries = results.countries;

                    const allItem: SelectItem = {
                        id: "all",
                        description: "Todos",
                    };
                    this._positions.unshift(allItem);
                    this._countries.unshift(allItem);

                    this.isLoadingFilterGridData = false;
                    return true;
                },
            ),
        );
    }

    /* private _setConfigurations(): void {
        this._setEmployeeFilterParameters();
        this._setGridFilter();
        this._setGridFilterForm();
    } */

    private _loadData(): void {
        this._loadSelects().subscribe((): void => {
            this._setGridFilterConfig();
            this._setEmployeeFilterParameters();
            this._getEmployees();
        });
    }

    private _mapPaginatedListToGridData(
        paginatedList: PaginatedList<Employee>,
    ): PaginatedList<GridData> {
        const transformedItems: GridData[] = paginatedList.items.map(
            (employee: Employee): GridData => {
                const gridData: GridData = {
                    id: employee.id as number,
                    elipsisActions: this._setElipsisActions(employee),
                };

                for (const key in employee) {
                    const value = (employee as any)[key];

                    if (
                        key === "position" ||
                        key === "gender" ||
                        key === "country"
                    ) {
                        if (typeof value === "object" && value !== null) {
                            gridData[key] = (
                                value as { description: string }
                            ).description;
                        }
                    } else if (key === "active") {
                        if (typeof value === "boolean") {
                            gridData[key] = value;
                        }
                    } else if (typeof value === "string") {
                        const luxonDate = DateTime.fromISO(value);
                        gridData[key] = luxonDate.isValid
                            ? luxonDate.toFormat("dd/MM/yyyy")
                            : value;
                    } else {
                        gridData[key] = value;
                    }
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
        const basePaginationConfig =
            this.gridConfig.hasPagination || this._defaultPaginatorOptions;

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

    private _updateGridConfig(
        paginatedListGridData: PaginatedList<GridData>,
    ): void {
        const { totalCount, pageIndex, pageSize } = paginatedListGridData;
        const { sortColumn = "", sortOrder = "" } = this._employeeFilterParams;
        // Se crea el objeto de paginación
        const paginationConfig = {
            ...(this.gridConfig.hasPagination || this._defaultPaginatorOptions),
            totalCount,
            pageSize,
            pageIndex,
        };
        // Se crea el objeto de ordenamiento
        const orderByConfig = {
            columnName: sortColumn,
            direction: sortOrder as "asc" | "desc" | "",
        };
        // Actualiza la configuración de la grilla con los nuevos datos cambiando la referencia ...this.gridConfig
        this.gridConfig = {
            ...this.gridConfig,
            hasPagination: paginationConfig,
            OrderBy: orderByConfig,
        };
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
            // 2. Para rango de fechas en json server desde(birthDate_gte) hasta (birthDate_lte)
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
            // 3. Manejar todos los demás campos de manera genérica
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
                    width: "70px",
                    label: "img",
                    isSortable: false,
                }, // Añadido label
                { name: "id", width: "70px", label: "ID" }, // Añadido label
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
                }, // Añadido label
                {
                    name: "elipsisActions", // Este es el nombre de la propiedad en GridData
                    //label: "actions", // Opcional: la etiqueta de la columna en el encabezado
                    width: "70px",
                    align: "center",
                    isSortable: false,
                    type: "elipsis", // ¡Indica que es la columna de elipsis!
                    //hasHeaderTooltip: true,
                    //headerIcon: "settings", // Icono para el encabezado de la columna de acciones
                },
            ],
            hasPagination: {
                pageSize: this._employeeFilterParams.limit || 25,
                pageSizeOptions: [25, 50],
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

    private _setGridFilterConfig(): void {
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
                fieldName: "gender",
                fieldType: "select",
                label: "Género",
                selectItems: this._genders,
            },
            {
                fieldName: "birthDateRange",
                fieldType: "dateRange",
                label: "Rango de nacimiento",
            },
            {
                fieldName: "position",
                fieldType: "select",
                label: "Puesto",
                selectItems: this._positions,
            },
            {
                fieldName: "country",
                fieldType: "select",
                label: "Pais",
                selectItems: this._countries,
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
