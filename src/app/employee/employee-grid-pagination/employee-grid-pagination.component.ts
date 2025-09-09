/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit,
} from "@angular/core";
import { GridFilterConfig } from "../../shared/models/grid-filter-configuration.model";
import { FormControl, FormGroup } from "@angular/forms";
import {
    createDefaultGridConfiguration,
    GridConfiguration,
    GridData,
    PaginationConfig,
    ElipsisAction,
} from "../../shared/models/grid-configuration.model";
import { GridComponent } from "../../shared/components/grid/grid.component"; // Correct path for GridComponent
import { GridFilterComponent } from "../../shared/components/grid/grid-filter/grid-filter.component"; // Correct path for GridFilterComponent
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
import { Chip } from "../../shared/components/chips/chips/chips.component";
import { MatDialogModule } from "@angular/material/dialog";

import { SelectItem } from "../../shared/models/select-item.model";
import { PositionService } from "../../shared/services/position.service";
import { CountryService } from "../../shared/services/country.service";
import { BreadcrumbComponent } from "../../shared/components/breadcrumb/breadcrumb.component";
import { BreadcrumbService } from "../../shared/services/breadcrumb.service";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { AlertService } from "../../shared/services/alert.service";
import { Router } from "@angular/router";

interface DateRangeValue {
    startDate: string | null;
    endDate: string | null;
}

@Component({
    selector: "app-employee-grid-pagination",
    standalone: true,
    imports: [
        CommonModule,
        HttpClientModule,
        GridComponent,
        GridFilterComponent,
        MatDialogModule,
        BreadcrumbComponent,
        AlertComponent,
    ],
    templateUrl: "./employee-grid-pagination.component.html",
    styleUrl: "./employee-grid-pagination.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeGridPaginationComponent implements OnInit, OnDestroy {
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
    private _breadcrumbService = inject(BreadcrumbService);
    private _alertService = inject(AlertService);

    private _defaultPaginatorOptions: PaginationConfig = {
        pageIndex: 0,
        pageSize: 25,
        pageSizeOptions: [5, 10, 25, 100],
        totalCount: 0,
        isServerSide: true,
    };

    private _router = inject(Router);

    constructor() {
        this._alertService.clearAlerts();
        this._setBreadcrumb();
        this.gridConfig = this._setGridConfiguration();
        this._setGridFilterConfig();
        this._setGridFilterForm();
        this._createChips(this._defaultChips);
    }

    ngOnInit(): void {
        this._loadData();
    }

    ngOnDestroy(): void {
        this._breadcrumbService.clearBreadcrumbs();
    }

    applyFilter(filterValues: Record<string, unknown>): void {
        this._employeeFilterParams = {};
        this._setEmployeeFilterParameters();
        const isClearFilter = Object.values(filterValues).every(
            (value): boolean =>
                value === null ||
                (typeof value === "object" &&
                    value !== null &&
                    Object.values(value).every((val): boolean => val === null)),
        );
        if (isClearFilter) {
            this._createChips(this._defaultChips);
            this._setGridFilterForm();
        } else {
            this._createChips(filterValues);
            const filterParamsForBackend =
                this._mapToEmployeeFilterParams(filterValues);
            Object.assign(this._employeeFilterParams, filterParamsForBackend);
        }
        if (this.gridConfig.hasPaginator) {
            this.gridConfig.hasPaginator.pageIndex = 0;
        }
        this._reloadGridData();
    }

    onGridSortChange(sortEvent: Sort): void {
        let sortColumnName = sortEvent.active;
        const sortOrder = sortEvent.direction;
        console.log("sorEvent: ", sortEvent);

        if (sortEvent.active === "country") {
            sortColumnName = "countryId";
        }
        if (sortEvent.active === "position") {
            sortColumnName = "positionId";
        }

        this._employeeFilterParams = {
            ...this._employeeFilterParams,
            sortColumn: sortColumnName,
            sortOrder: sortOrder,
            page: 1,
        };

        this._updateGridConfigOnSortChange(sortEvent);
        this._reloadGridData();
    }

    onGridPageChange(event: PageEvent): void {
        this._employeeFilterParams = {
            ...this._employeeFilterParams,
            page: event.pageIndex + 1,
            limit: event.pageSize,
        };
        this._reloadGridData(); // Llama a la nueva función
    }

    onExportToExcel(): void {
        this._spinnerService.show();
        const filterValues = this.gridFilterForm.value;
        const exportParams = this._mapToEmployeeFilterParams(filterValues);
        if (this._employeeFilterParams.sortColumn) {
            exportParams.sortColumn = this._employeeFilterParams.sortColumn;
        }
        if (this._employeeFilterParams.sortOrder) {
            exportParams.sortOrder = this._employeeFilterParams.sortOrder;
        }

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
                    this._alertService.showDanger(
                        "Error al descargar el archivo de Excel",
                    );
                },
            });
    }

    onRemoveChip(chip: Chip): void {
        const fieldName = chip.key;
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
            default: (): void =>
                this.gridFilterForm.get(fieldName)?.patchValue(null),
        };
        const resetAction =
            resetStrategies[fieldName as keyof typeof resetStrategies] ||
            resetStrategies.default;
        resetAction();
        this.gridFilterForm.markAsPristine();
        this.applyFilter(this.gridFilterForm.value);
    }

    onCreateEmployee(): void {
        this._router.navigate(["/employee/create"]);
    }

    private _createChips(filterValues: Record<string, unknown>): void {
        this.chips = this._mapToChipsDescription(filterValues);
    }

    private _mapToChipsDescription(
        filterValues: Record<string, unknown>,
    ): Chip[] {
        const newChips: Chip[] = [];
        // Helper para buscar un ítem por ID y retornar su descripción
        const findDescriptionById = (
            items: SelectItem[],
            id: number,
        ): string | null => {
            const item = items.find((i: SelectItem): boolean => i.id === id);
            return item ? item.description : null;
        };
        // Helper para generar las etiquetas de los chips de forma dinámica
        const getChipLabel = (key: string, value: any): string => {
            switch (key) {
                case "position": {
                    const positionDesc =
                        typeof value === "number"
                            ? findDescriptionById(this._positions, value)
                            : null;
                    return `Puesto: ${positionDesc || "Todos"}`;
                }
                case "country": {
                    const countryDesc =
                        typeof value === "number"
                            ? findDescriptionById(this._countries, value)
                            : null;
                    return `País: ${countryDesc || "Todos"}`;
                }
                case "gender": {
                    const genderDesc =
                        typeof value === "number"
                            ? findDescriptionById(this._genders, value)
                            : null;
                    return `Género: ${genderDesc || "Todos"}`;
                }
                case "active":
                    return `Estado: ${value === "all" ? "Todos" : value ? "Activo" : "Inactivo"}`;
                case "birthDateRange": {
                    const dateRange = value as DateRangeValue;
                    const startDate = dateRange.startDate
                        ? DateTime.fromISO(dateRange.startDate).toFormat(
                              "dd/MM/yyyy",
                          )
                        : "N/A";
                    const endDate = dateRange.endDate
                        ? DateTime.fromISO(dateRange.endDate).toFormat(
                              "dd/MM/yyyy",
                          )
                        : "N/A";
                    return `Fecha de Nacimiento: ${startDate} - ${endDate}`;
                }
                default:
                    return `${key}: ${value}`;
            }
        };

        for (const [key, value] of Object.entries(filterValues)) {
            if (value === null || value === undefined || value === "") {
                continue;
            }

            const shouldCreateChip =
                value !== "all" ||
                ["position", "country", "gender", "active"].includes(key);

            const isDisabled = value === "all";

            if (key === "birthDateRange") {
                const dateRangeValue = value as DateRangeValue;
                if (!dateRangeValue.startDate && !dateRangeValue.endDate) {
                    continue;
                }
            }

            if (shouldCreateChip) {
                newChips.push({
                    key,
                    label: getChipLabel(key, value),
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

    private _reloadGridData(): void {
        this.isLoadingGridData = true;
        this.isLoadingFilterGridData = true;
        this._employeeServices
            .getEmployees(this._employeeFilterParams)
            .pipe(
                map(this._mapPaginatedListToGridData.bind(this)),
                finalize((): void => {
                    this.isLoadingGridData = false;
                    this.isLoadingFilterGridData = false;
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
                error: (error: HttpErrorResponse): void => {
                    this._alertService.showDanger(
                        `Error al obtener empleados. ${error.statusText}`,
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

    private _loadData(): void {
        this.isLoadingGridData = true;
        this.isLoadingFilterGridData = true;
        this._setEmployeeFilterParameters(); // Inicializa los parámetros de filtro
        forkJoin({
            positions: this._getPositions(),
            countries: this._getCountries(),
            employees: this._employeeServices.getEmployees(
                this._employeeFilterParams,
            ),
        })
            .pipe(
                finalize((): void => {
                    this.isLoadingGridData = false;
                    this.isLoadingFilterGridData = false;
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (results: {
                    positions: SelectItem[];
                    countries: SelectItem[];
                    employees: PaginatedList<Employee>;
                }): void => {
                    this._positions = results.positions;
                    this._countries = results.countries;

                    const allItem: SelectItem = {
                        id: "all",
                        description: "Todos",
                    };
                    this._positions.unshift(allItem);
                    this._countries.unshift(allItem);
                    this._setGridFilterConfig();
                    // Mapear y actualizar la grilla con los datos de empleados
                    const paginatedGridData = this._mapPaginatedListToGridData(
                        results.employees,
                    );
                    this.gridData = paginatedGridData.items;
                    this._updateGridConfig(paginatedGridData);
                },
                error: (error: HttpErrorResponse): void => {
                    this._alertService.showDanger(
                        `Error al cargar datos. ${error.statusText}`,
                    );
                },
            });
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
            this._countries.find((c): boolean => c.id === countryId)
                ?.description || ""
        );
    }

    private _getPositionDescription(positionId: number): string {
        return (
            this._positions.find(
                (position): boolean => position.id === positionId,
            )?.description || ""
        );
    }

    private _getGenderDescription(genderId: number): string {
        return (
            this._genders.find((gender): boolean => gender.id === genderId)
                ?.description || ""
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
                condition: (): boolean => employee.active === true,
            },
        ];
    }

    private _editEmployee(id: number): void {
        this._router.navigate([`/employee/edit/${id}`]);
    }

    private _deleteEmployee(id: number): void {
        // no eliminar pasasr el empleado de activo a inactivo
        console.log(`Intentando eliminar empleado con ID: ${id}`);
    }

    private _updateGridConfigOnSortChange(sortEvent: Sort): void {
        const basePaginationConfig =
            this.gridConfig.hasPaginator || this._defaultPaginatorOptions;

        this.gridConfig = {
            ...this.gridConfig,
            OrderBy: {
                columnName: sortEvent.active,
                direction: sortEvent.direction,
            },
            hasPaginator: {
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
        const paginationConfig = {
            ...(this.gridConfig.hasPaginator || this._defaultPaginatorOptions),
            totalCount,
            pageSize,
            pageIndex,
        };
        const orderByConfig = {
            columnName: sortColumn,
            direction: sortOrder as "asc" | "desc" | "",
        };
        this.gridConfig = {
            ...this.gridConfig,
            hasPaginator: paginationConfig,
            OrderBy: orderByConfig,
        };
    }

    private _mapToEmployeeFilterParams(obj: unknown): EmployeeFilterParams {
        const employeeFilterParams: EmployeeFilterParams = {};
        const source = obj as Record<string, unknown>;
        for (const key in source) {
            const value = source[key];
            if (["active", "position", "gender", "country"].includes(key)) {
                if (value === "all" || value === "Todos" || value === "") {
                    continue;
                }
            }
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
                    name: "imgUrl",
                    width: "20px",
                    type: "img",
                    isSortable: false,
                    hasHeader: false,
                },
                { name: "id" },
                { name: "name" /*headerTooltip: "nombre completo"*/ },
                { name: "surname" },
                { name: "birthDate" },
                { name: "gender", isSortable: false }, // false por que ordenaria por id no alfabeticamente
                { name: "position", isSortable: false }, // false por que ordenaria por id no alfabeticamente
                { name: "country", isSortable: false }, // false por que ordenaria por id no alfabeticamente
                {
                    name: "active",
                    style: "status-circle",
                    align: "center",
                },
                {
                    name: "elipsisActions",
                    align: "center",
                    isSortable: false,
                    type: "elipsis",
                    hasHeader: false,
                },
            ],
            hasPaginator: {
                pageSize: this._employeeFilterParams.limit || 25,
                pageSizeOptions: [25, 50],
                totalCount: 0,
                pageIndex: 0,
                isServerSide: true,
            },
            hasSorting: { isServerSide: true },
            OrderBy: {
                columnName: this._employeeFilterParams.sortColumn || "id",
                direction: (this._employeeFilterParams.sortOrder || "asc") as
                    | "asc"
                    | "desc",
            },
            filterByColumn: "",
            hasInputSearch: false,
            hasChips: true,
            hasExcelDownload: true,
            hasCreateButton: true,
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
                this.gridFilterForm.addControl(
                    filter.fieldName,
                    new FormControl("all"),
                );
                return;
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

    private _setBreadcrumb(): void {
        this._breadcrumbService.setBreadcrumbs([
            { label: "Inicio", path: "/" },
            { label: "Grilla Full", path: "/employees" },
        ]);
    }
}
