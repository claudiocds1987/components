/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ChangeDetectionStrategy,
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
} from "../../shared/models/gridConfiguration";
import { GridComponent } from "../../shared/components/grid/grid.component";
import { GridFilterComponent } from "../../shared/components/grid/grid-filter/grid-filter.component";
import { CommonModule } from "@angular/common";
import { DateTime } from "luxon";
import { EmployeeService } from "../../shared/services/employee.service";
import { EmployeeFilterParams } from "../../shared/models/employee-filter-params.model";
import { PaginatedList } from "../../shared/models/paginated-list.model";
import { Employee } from "../../shared/models/employee.model";
import { finalize, map } from "rxjs";
import { HttpClientModule } from "@angular/common/http";

@Component({
    selector: "app-employee-grid",
    standalone: true,
    imports: [
        CommonModule,
        HttpClientModule,
        GridComponent,
        GridFilterComponent,
    ],
    templateUrl: "./employee-grid.component.html",
    styleUrl: "./employee-grid.component.scss",
    //changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeGridComponent implements OnInit {
    gridFilterConfig: GridFilterConfig[] = []; // Changed from 'filtersConfig' to 'gridFilterConfig' to match your provided code
    gridFilterForm!: FormGroup;
    gridConfig: GridConfiguration;
    gridData: GridDataItem[] = [];
    employees: Employee[] = [];
    private _employeeFilterParams: EmployeeFilterParams = {};
    private _employeeServices = inject(EmployeeService);

    constructor() {
        // 1. Definimos/seteamos la configuración para el componente filtro (grid-filter.component)
        this._setGridFilter();

        // 2. Inicializamos el formulario para el componente filtro (grid-filter.component)
        this._setGridFilterForm();

        // 3. Definimos/seteamos la configuracion para el componente grilla (grid.component).
        this.gridConfig = this._setGridConfiguration();

        // 4. Definimos/seteamos los parametros para el filtro del empleado
        this._employeeFilterParams.page = 1;
        this._employeeFilterParams.limit = 25;
    }

    ngOnInit(): void {
        this._mockGetEmployees();
        //this._getEmployees();
    }

    applyFilter(filterValues: unknown): void {
        const formattedFilterValues = this._formatDatesInObject(filterValues);
        console.log(
            "Valores de filtro con fechas formateadas:",
            formattedFilterValues,
        );

        // Aquí puedes usar formattedFilterValues para tus operaciones posteriores,
        // como llamar a un servicio para filtrar datos.
    }

    private _getEmployees(): void {
        //this.isLoadingData = true;

        this._employeeServices
            .getEmployees(this._employeeFilterParams)
            .pipe(
                map(
                    (
                        paginatedList: PaginatedList<Employee>,
                    ): PaginatedList<GridDataItem> => {
                        // Aquí es donde tipamos la función flecha del map
                        const transformedItems: GridDataItem[] =
                            paginatedList.items.map(
                                (employee: Employee): GridDataItem => {
                                    const gridItem: GridDataItem = {};
                                    for (const key in employee) {
                                        const value = (employee as any)[key];
                                        if (
                                            typeof value === "string" ||
                                            typeof value === "number"
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
                        };
                    },
                ),
                finalize((): void => {
                    //this.isLoadingData = false;
                }),
            )
            .subscribe({
                next: (paginatedList: PaginatedList<GridDataItem>): void => {
                    this.gridData = paginatedList.items;
                    console.log(
                        "Empleados cargados exitosamente (formato GridData):",
                        this.gridData,
                    );
                },
                error: (error: any): void => {
                    console.error("Error al obtener empleados:", error);
                },
                complete: (): void => {
                    console.log("Obtención de empleados completada.");
                },
            });
    }

    private _formatDatesInObject(obj: any): any {
        // Creando una copia para no modificar el original directamente
        const newObj: any = { ...obj };

        for (const key in newObj) {
            if (Object.prototype.hasOwnProperty.call(newObj, key)) {
                const value = newObj[key];
                // Verificamos si el objeto tiene fecha/fechas de tipo "Date"
                if (value instanceof Date) {
                    // Formateando a cadena ISO 8601, con Luxon DateTime.fromJSDate.
                    newObj[key] = DateTime.fromJSDate(value);
                } else if (typeof value === "object" && value !== null) {
                    // Si la propiedad es un objeto (y no null), recursivamente la procesamos
                    newObj[key] = this._formatDatesInObject(value);
                }
            }
        }
        return newObj;
    }

    private _setGridConfiguration(): GridConfiguration {
        const config = createDefaultGridConfiguration({
            columns: [
                { name: "ID", width: "70px" },
                { name: "Nombre" },
                { name: "Apellido", isSortable: false },
                { name: "Nacimiento" },
                { name: "Puesto" },
                {
                    name: "Elipsis",
                    width: "70px",
                    align: "center",
                    isSortable: false,
                    hasHeaderTooltip: true,
                },
            ],
        });
        return config;
    }

    private _setGridFilter(): void {
        this.gridFilterConfig = [
            // Configuration del filtrode la grilla
            {
                fieldName: "id",
                fieldType: "text",
                label: "Id",
            },
            {
                fieldName: "email",
                fieldType: "text",
                label: "Email",
            },
            {
                fieldName: "Estados",
                fieldType: "select",
                label: "Estado",
                selectItems: [
                    { value: "all", label: "Todos" }, // Default option
                    { value: "active", label: "Activo" },
                    { value: "inactive", label: "Inactivo" },
                    { value: "pendient", label: "Pendiente" },
                ],
            },
            // Add other filters here if you need them, e.g., a date filter
            {
                fieldName: "date",
                fieldType: "date",
                label: "Rango de fechas",
            },
        ];
    }

    private _setGridFilterForm(): void {
        // Inicializa FormGroup
        this.gridFilterForm = new FormGroup({});
        // Creando el formulario en base a la configuración de filtros en funcion setGridFilter()
        this.gridFilterConfig.forEach((filter: GridFilterConfig): void => {
            if (filter.fieldType === "text") {
                this.gridFilterForm.addControl(
                    filter.fieldName,
                    new FormControl(""), // Usar empty string or default value
                );
                return;
            }

            if (filter.fieldType === "select") {
                this.gridFilterForm.addControl(
                    filter.fieldName,
                    new FormControl(""), // Usar empty string or default value
                );
                return;
            }

            if (filter.fieldType === "date") {
                this.gridFilterForm.addControl(
                    filter.fieldName + "From",
                    new FormControl(null), // Usar null or default value
                );
                this.gridFilterForm.addControl(
                    filter.fieldName + "To",
                    new FormControl(null), // Usar null or default value
                );
                return;
            }
        });
    }

    private _mockGetEmployees(): void {
        // Seteamos la data en "gridData" para visualizarla en el componente grilla (grid.component)
        setTimeout((): void => {
            this.gridData = Array.from(
                { length: 100 },
                (
                    _: unknown,
                    i: number,
                ): {
                    ID: number;
                    Nombre: string;
                    Apellido: string;
                    //Nacimiento:
                    Puesto: string;
                    Elipsis: string;
                } => {
                    return {
                        ID: i + 1,
                        Nombre: `JUAN CARLOS ALBERTO JOSE MARIA ${i + 1}`,
                        Apellido: `usuario${i + 1}@mail.com`,
                        //Nacimiento:
                        Puesto: `Administrativo ${i + 1}`,
                        Elipsis: "...",
                    };
                },
            );
        }, 2000);
    }
}
