/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from "@angular/core";
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

@Component({
    selector: "app-employee-grid",
    standalone: true,
    imports: [CommonModule, GridComponent, GridFilterComponent],
    templateUrl: "./employee-grid.component.html",
    styleUrl: "./employee-grid.component.scss",
})
export class EmployeeGridComponent implements OnInit {
    gridFilterConfig: GridFilterConfig[] = []; // Changed from 'filtersConfig' to 'gridFilterConfig' to match your provided code
    gridFilterForm!: FormGroup;
    gridConfig: GridConfiguration;
    gridData: GridDataItem[] = [];

    constructor() {
        // 1. FIRST, define the filter configurations so 'gridFilterConfig' is populated.
        this._setGridFilter();

        // 2. THEN, initialize the FormGroup, using the already defined configurations.
        this._setGridFilterForm();

        // 3. Finally, set the grid configuration.
        this.gridConfig = this._setGridConfiguration();
    }

    ngOnInit(): void {
        this._mockGetEmployees();

        // Optional: Subscribe to form value changes here if you want to react to filter changes
        // this.gridFilterForm.valueChanges
        //     .pipe(debounceTime(300)) // Add debounceTime if needed to prevent excessive calls
        //     .subscribe(filterValues => {
        //         console.log('Filter values:', filterValues);
        //         // Add your logic to filter the grid data here
        //     });
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
                { name: "Name" },
                { name: "Email", isSortable: false },
                { name: "Domicilio" },
                { name: "CodPostal", align: "center" },
                { name: "Puesto" },
                { name: "Dni" },
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
        // Simulates backend call
        setTimeout((): void => {
            this.gridData = Array.from(
                { length: 100 },
                (
                    _: unknown,
                    i: number,
                ): {
                    ID: number;
                    Name: string;
                    Email: string;
                    Domicilio: string;
                    CodPostal: string;
                    Puesto: string;
                    Dni: string;
                    Elipsis: string;
                } => {
                    return {
                        ID: i + 1,
                        Name: `JUAN CARLOS ALBERTO JOSE MARIA ${i + 1}`,
                        Email: `usuario${i + 1}@mail.com`,
                        Domicilio: `Av.Libertador 1${i + 1}`,
                        CodPostal: `164${i + 1}`,
                        Puesto: `Administrativo ${i + 1}`,
                        Dni: `2 ${i + 1}.310.510`,
                        Elipsis: "...",
                    };
                },
            );
        }, 2000);
    }
}
