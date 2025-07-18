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
            // Ensure this populates the array used in _setGridFilterForm
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
            // Add other filters here if you need them, e.g., a date filter
            {
                fieldName: "fecha",
                fieldType: "date",
                label: "Rango de fechas",
            },
        ];
    }

    private _setGridFilterForm(): void {
        // Initialize the FormGroup ONLY ONCE
        this.gridFilterForm = new FormGroup({});

        // Now, this.gridFilterConfig should contain both 'id' and 'email' (and any other filters you add)
        this.gridFilterConfig.forEach((filter: GridFilterConfig): void => {
            if (filter.fieldType === "date") {
                this.gridFilterForm.addControl(
                    filter.fieldName + "From",
                    new FormControl(null), // Usar null or default value
                );
                this.gridFilterForm.addControl(
                    filter.fieldName + "To",
                    new FormControl(null), // Usar null or default value
                );
            } else {
                this.gridFilterForm.addControl(
                    filter.fieldName,
                    new FormControl(""), // Usar empty string or default value
                );
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
