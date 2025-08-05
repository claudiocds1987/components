import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import {
    MatDatepickerInputEvent,
    MatDatepickerModule,
} from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatButtonModule } from "@angular/material/button";
import { GridFilterConfig } from "../../../models/grid-filter-config.model";
import { DateTime } from "luxon";
import { DateInputComponent } from "../../date-input/date-input.component";
import { Chip } from "../../chips/chips/chips.component";

@Component({
    selector: "app-grid-filter",
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        DateInputComponent,
    ],
    templateUrl: "./grid-filter.component.html",
    styleUrls: ["./grid-filter.component.scss"],
})
export class GridFilterComponent {
    @Input() config: GridFilterConfig[] = [];
    @Input() filterForm!: FormGroup;
    //@Output() emitFilterApplied = new EventEmitter<unknown>(); // Considerar un tipo más específico para los valores del filtro
    @Output() emitFilterApplied = new EventEmitter<Record<string, unknown>>();
    @Output() emitFilterDescriptions = new EventEmitter<Chip[]>();

    applyFilter(): void {
        //this.emitFilterApplied.emit(this.filterForm.value);
        const filterValues = this.filterForm.value;
        this.emitFilterApplied.emit(filterValues);
        const filterChips = this._mapFilterValuesToChips(filterValues);
        this.emitFilterDescriptions.emit(filterChips);
    }

    clearFilter(): void {
        this.filterForm.reset();
        this.emitFilterApplied.emit(this.filterForm.value); // Emitir filtro vacío para recargar datos
        this.emitFilterDescriptions.emit([]);
    }

    private _mapFilterValuesToChips(filterValues: any): Chip[] {
        const chips: Chip[] = [];

        // Aquí se tipifica el parámetro 'key' como string en la función flecha.
        Object.keys(filterValues).forEach((key: string) => {
            const value = filterValues[key];

            // Ignora valores nulos, indefinidos o cadenas vacías
            if (
                value === null ||
                typeof value === "undefined" ||
                value === ""
            ) {
                return;
            }

            let displayValue: string;

            // Lógica para formatear la fecha
            if (value instanceof DateTime) {
                displayValue = value.toFormat("dd/MM/yyyy");
            } else if (value instanceof Date) {
                displayValue =
                    DateTime.fromJSDate(value).toFormat("dd/MM/yyyy");
            } else {
                // Convierte cualquier otro tipo de valor a una cadena
                displayValue = `${value}`;
            }

            // Simula la lógica para crear un chip. Usamos `displayValue` para la etiqueta
            // y el `value` original para mantener el valor del filtro sin formatear.
            const chip = {
                key: key,
                label: `${key}: ${displayValue}`,
                value: value,
            };
            chips.push(chip);
        });

        return chips;
    }
}
