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
import { finalize, map } from "rxjs";
import { HttpClientModule } from "@angular/common/http";
import { PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import { ExportService } from "../../shared/services/export.service";
import { SpinnerService } from "../../shared/services/spinner.service";
import {
    ChipsComponent,
    Chip,
} from "../../shared/components/chips/chips/chips.component";

@Component({
    selector: "app-employee-grid",
    standalone: true,
    imports: [
        CommonModule,
        HttpClientModule,
        GridComponent,
        GridFilterComponent,
        ChipsComponent,
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
    isLoadingData = false;

    private _employeeFilterParams: EmployeeFilterParams = {};
    private _employeeServices = inject(EmployeeService);
    private _exportService = inject(ExportService);
    private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
    private _spinnerService = inject(SpinnerService);

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

    applyFilter(filterValues: Record<string, unknown>): void {
        // 1. Mapeamos `filterValues` a `EmployeeFilterParams`
        const filterParamsForBackend =
            this._mapToEmployeeFilterParams(filterValues);
        this._employeeFilterParams.page = 1; // Aseguramos que la página sea 1 al aplicar un nuevo filtro
        // 2. con Object.assign() Copiamos los valores de filterParamsForBackend
        // (donde tiene las fecha formateadas a dd/mm/yyyy con los otros datos que vienen del filtro) a `_employeeFilterParams`,
        //"_employeeFilterParams" es lo que se envía al servicio.
        Object.assign(this._employeeFilterParams, filterParamsForBackend);

        if (this.gridConfig.hasPagination) {
            this.gridConfig.hasPagination.pageIndex = 0;
        }

        this._getEmployees();
    }

    onGridSortChange(sortEvent: Sort): void {
        this._employeeFilterParams = {
            ...this._employeeFilterParams,
            sortColumn: sortEvent.active,
            sortOrder: sortEvent.direction,
            page: 1,
        };

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
        // 1. Tomamos los parámetros actuales
        const params = { ...this._employeeFilterParams };

        // 2. Creamos un nuevo objeto para los parámetros de la URL
        const exportParams: any = {};

        // 3. Adaptamos los parámetros a la sintaxis de json-server
        if (params.sortColumn) {
            exportParams["_sort"] = params.sortColumn;
        }
        if (params.sortOrder) {
            exportParams["_order"] = params.sortOrder;
        }
        // Añade el resto de los filtros de tu grilla
        if (params.id) {
            exportParams["id"] = params.id;
        }

        if (params.name) {
            exportParams["name"] = params.name;
        }
        if (params.surname) {
            exportParams["surname"] = params.surname;
        }
        if (params.birthDate) {
            exportParams["birthDate"] = params.birthDate;
        }
        if (params.position) {
            exportParams["position"] = params.position;
        }
        // 4. Eliminamos los parámetros de paginación que no queremos en el Excel
        delete params.page;
        delete params.limit;

        //this.isLoadingData = true;
        const fileName = "Empleados.xlsx";

        this._exportService
            .exportDataToExcel(
                // Se agrega `?_delay=2000` para simular un retraso de 2 segundos
                // para poder mostrar el spinner
                "http://localhost:3000/employees?_delay=2000", // ruta json-server
                exportParams,
                fileName,
            )
            .pipe(
                finalize((): void => {
                    this._spinnerService.hide();
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                error: (error: unknown): void => {
                    this._spinnerService.hide();
                    console.error(
                        "Error al descargar el archivo de Excel:",
                        error,
                    );
                    // Muestra un mensaje de error al usuario
                },
            });
    }

    onFilterDescriptionsEmitted(chips: Chip[]): void {
        this.chips = chips;
        console.log("Chips activos actualizados:", this.chips);
    }

    onRemoveChip(chip: Chip): void {
        // Obtenemos el nombre del campo del filtro que se va a quitar
        const fieldName = chip.key;
        // Reseteamos el valor del formulario para ese campo
        this.gridFilterForm.get(fieldName)?.reset();
        // Llamamos a applyFilter con los valores actualizados del formulario
        this.applyFilter(this.gridFilterForm.value);
        // Actualizamos la lista de chips activos
        this.chips = this.chips.filter(
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            (c) => c.key !== fieldName,
        );
    }

    private _setEmployeeFilterParameters(): void {
        // Aca se establece por defecto como va a aparecer la grilla paginada por 1ra vez.
        this._employeeFilterParams.page = 1;
        this._employeeFilterParams.limit = 25;
        this._employeeFilterParams.sortColumn = "id";
        this._employeeFilterParams.sortOrder = "asc";
    }

    private _getEmployees(): void {
        this.isLoadingData = true;
        this._employeeServices
            .getEmployees(this._employeeFilterParams)
            .pipe(
                map(this._transformPaginatedListToGridData.bind(this)),
                finalize((): void => {
                    this.isLoadingData = false; // Manejamos el estado de carga aquí
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (
                    paginatedListGridData: PaginatedList<GridData>,
                ): void => {
                    // Tipo explícito para next
                    this.gridData = paginatedListGridData.items;
                    this._updateGridConfigOnDataReceived(paginatedListGridData); // Nueva función para actualizar config
                },
                error: (error: any): void => {
                    // Tipo explícito para error
                    console.error(
                        "EmployeeGridComponent: Error al obtener empleados:",
                        error,
                    );
                },
            });
    }

    private _transformPaginatedListToGridData(
        paginatedList: PaginatedList<Employee>,
    ): PaginatedList<GridData> {
        const transformedItems: GridData[] = paginatedList.items.map(
            (employee: Employee): GridData => {
                // Aseguramos que 'id' exista y sea un número para GridData
                const gridData: GridData = { id: employee.id as number };
                for (const key in employee) {
                    // No copiar la propiedad 'id' directamente si ya la asignamos arriba
                    if (key === "id") continue;

                    const value = (employee as any)[key]; // Valor tal como viene del backend
                    // Verifica si el valor es un string y si puede ser parseado como una fecha YYYY-MM-DD (ISO)
                    if (typeof value === "string") {
                        // Intenta parsear como ISO (YYYY-MM-DD es ISO 8601)
                        const luxonDate = DateTime.fromISO(value);

                        if (luxonDate.isValid) {
                            // Si se parseó con éxito, significa que es una fecha que queremos formatear
                            gridData[key] = luxonDate.toFormat("dd/MM/yyyy"); // Formato para la UI
                        } else {
                            // Si no es una fecha ISO válida, mantenemos el string original (ej. un nombre, un texto)
                            gridData[key] = value;
                        }
                    }
                    // Si no es un string, simplemente asigna el valor tal cual
                    else {
                        gridData[key] = value;
                    }
                }

                // Aca se añaden las acciones de elipsis
                // Pasa el `employee` completo para que la función `_setElipsisActions` pueda acceder a todas sus propiedades
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
                // Condición de ejemplo: usa employeeData capturado por el closure
                condition: (): boolean => (employee.id as number) % 2 !== 0,
            },
            {
                id: "delete",
                label: "Eliminar",
                icon: "delete_forever",
                action: (id: number): void => this._deleteEmployee(id),

                // Condición de ejemplo: solo eliminable si el ID es par
                condition: (): boolean => (employee.id as number) % 2 === 0,
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
            // aca creo nueva referencia del objeto gridConfig para que ChangeDetectionStrategy.OnPush detecte el cambio
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
        }
    }

    private _mapToEmployeeFilterParams(obj: unknown): EmployeeFilterParams {
        const newObj: Partial<EmployeeFilterParams> = {
            ...(obj as Record<string, unknown>),
        };

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

    private _setGridConfiguration(): GridConfiguration {
        const config = createDefaultGridConfiguration({
            columns: [
                { name: "id", width: "70px", label: "ID" }, // Añadido label
                { name: "name", label: "Nombre" }, // Añadido label
                { name: "surname", label: "Apellido" /*isSortable: false*/ }, // Añadido label
                { name: "birthDate", label: "Fecha de Nacimiento" }, // Añadido label
                { name: "position", label: "Puesto" }, // Añadido label
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
            /* {
                fieldName: "domicilio",
                fieldType: "text",
                label: "domicilio",
            }, */
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
            {
                fieldName: "position",
                fieldType: "select",
                label: "Puesto",
                selectItems: [
                    { value: "all", label: "Todos" },
                    {
                        value: "Desarrollador Senior",
                        label: "Desarrollador Senior",
                    },
                    {
                        value: "Desarrollador Junior",
                        label: "Desarrollador Junior",
                    },
                    { value: "Diseñador UX/UI", label: "Diseñador UX/UI" },
                    { value: "Soporte Técnico", label: "Soporte Técnico" },
                    { value: "Analista de Datos", label: "Analista de Datos" },
                    { value: "Especialista QA", label: "Especialista QA" },
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
}
