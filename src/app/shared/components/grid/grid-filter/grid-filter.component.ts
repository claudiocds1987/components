import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatButtonModule } from "@angular/material/button";
import { GridFilterConfig } from "../../../models/grid-filter-config.model";
import { DateTime } from "luxon";
import { DateInputComponent } from "../../date-input/date-input.component";
import { Chip } from "../../chips/chips/chips.component";
import { SkeletonDirective } from "../../../directives/skeleton.directive";

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
        SkeletonDirective,
    ],
    templateUrl: "./grid-filter.component.html",
    styleUrls: [
        "./grid-filter.component.scss",
        "../../../styles/skeleton.scss",
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridFilterComponent {
    @Input() config: GridFilterConfig[] = [];
    @Input() filterForm!: FormGroup;
    @Input() isLoading = false;
    @Output() emitFilterApplied = new EventEmitter<Record<string, unknown>>();
    @Output() emitFilterDescriptions = new EventEmitter<Chip[]>();

    applyFilter(): void {
        const filterFormValues = this.filterForm.value;
        this.emitFilterApplied.emit(filterFormValues);
        const filterChips = this._mapFilterValuesToChips(filterFormValues);
        this.emitFilterDescriptions.emit(filterChips);
    }

    clearFilter(): void {
        this.filterForm.reset();
        this.emitFilterApplied.emit(this.filterForm.value);
        this.emitFilterDescriptions.emit([]);
    }

    isButtonDisabled(): boolean {
        // Verifica si el formulario es válido y si tiene algún valor modificado
        return !this.filterForm.valid || !this.filterForm.dirty;
    }

    private _mapFilterValuesToChips(
        filterValues: Record<string, unknown>,
    ): Chip[] {
        const chips: Chip[] = [];

        Object.keys(filterValues).forEach((key: string): void => {
            const value = filterValues[key];

            if (
                value === null ||
                typeof value === "undefined" ||
                value === ""
            ) {
                return;
            }

            let displayValue: string | number | boolean;

            const filterConfig = this.config.find(
                (c): boolean => c.fieldName === key,
            );

            // --- Lógica corregida para manejar el mat-select de 'activo/inactivo' ---
            if (
                filterConfig &&
                filterConfig.fieldType === "select" &&
                filterConfig.selectItems
            ) {
                // Se debe buscar el item por su ID, que es el valor que viene en filterValues[key]
                const selectedItem = filterConfig.selectItems.find(
                    (item): boolean => item.id === value,
                );

                // Si se encuentra el item, se usa su 'description' para mostrarlo en el chip
                displayValue = selectedItem
                    ? selectedItem.description
                    : `${value}`;
            }
            // --- Fin de la lógica corregida ---
            else if (value instanceof DateTime) {
                displayValue = value.toFormat("dd/MM/yyyy");
            } else if (value instanceof Date) {
                displayValue =
                    DateTime.fromJSDate(value).toFormat("dd/MM/yyyy");
            } else {
                displayValue = `${value}`;
            }

            const label = filterConfig ? filterConfig.label : key;

            const chip = {
                key: key,
                label: `${label}: ${displayValue}`,
                value: value,
            };
            chips.push(chip);
        });

        return chips;
    }

    private _mapFilterValuesToChips1(
        filterValues: Record<string, unknown>,
    ): Chip[] {
        const chips: Chip[] = [];

        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        Object.keys(filterValues).forEach((key: string) => {
            console.log("key 1", filterValues);
            console.log("key", filterValues[key]);
            /* filterValues es el objeto con los valores de los filtros aplicados ej:
            {
                birthDate: null
                id: ""
                name: "Maria"
                position: ""
                surname: "perez"
            }
            "key" es cada propiedad del objeto birthDate, id, name, position, surname 
            filterValues[key]; es el valor de cada propiedad del objeto ej "Maria"
            */

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
