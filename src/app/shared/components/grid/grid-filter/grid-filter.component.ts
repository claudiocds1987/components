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
    //@Output() emitFilterDescriptions = new EventEmitter<Chip[]>();

    applyFilter(): void {
        const filterFormValues = this.filterForm.value;
        this.emitFilterApplied.emit(filterFormValues);
        //const filterChips = this._mapFilterValuesToChips(filterFormValues); //esto sacarlo tambien
        //this.emitFilterDescriptions.emit(filterChips); // este sacarlo cuando se resuelva todo
    }

    clearFilter(): void {
        this.filterForm.reset();
        this.emitFilterApplied.emit(this.filterForm.value);
        //this.emitFilterDescriptions.emit([]);
    }

    isButtonDisabled(): boolean {
        return !this.filterForm?.valid || !this.filterForm?.dirty;
    }

    // borrar esta funcion
    private _mapFilterValuesToChips(
        filterValues: Record<string, unknown>,
    ): Chip[] {
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
        const chips: Chip[] = [];

        Object.keys(filterValues).forEach((key: string): void => {
            const value = filterValues[key];
            const filterConfig = this.config.find(
                (c): boolean => c.fieldName === key,
            );

            if (
                !filterConfig ||
                value === null ||
                typeof value === "undefined" ||
                value === ""
            ) {
                return;
            }

            if (
                filterConfig.fieldType === "select" &&
                (value === "all" || value === "Todos")
            ) {
                return;
            }

            let displayValue: string | number | boolean;
            let chipType: Chip["type"] = filterConfig.fieldType;

            switch (filterConfig.fieldType) {
                case "date": {
                    const luxonDate = DateTime.fromISO(value as string);
                    displayValue = luxonDate.isValid
                        ? luxonDate.toFormat("dd/MM/yyyy")
                        : "Fecha inválida";
                    break;
                }
                case "dateRange": {
                    const dateRangeValue = value as {
                        startDate?: string;
                        endDate?: string;
                    };
                    const startLuxon = dateRangeValue.startDate
                        ? DateTime.fromISO(dateRangeValue.startDate)
                        : null;
                    const endLuxon = dateRangeValue.endDate
                        ? DateTime.fromISO(dateRangeValue.endDate)
                        : null;

                    if (startLuxon && endLuxon) {
                        displayValue = `${startLuxon.toFormat("dd/MM/yyyy")} - ${endLuxon.toFormat("dd/MM/yyyy")}`;
                    } else if (startLuxon) {
                        displayValue = `Desde: ${startLuxon.toFormat("dd/MM/yyyy")}`;
                    } else if (endLuxon) {
                        displayValue = `Hasta: ${endLuxon.toFormat("dd/MM/yyyy")}`;
                    } else {
                        return;
                    }
                    break;
                }
                case "select": {
                    const selectedItem = filterConfig.selectItems?.find(
                        (item): boolean => item.id === value,
                    );
                    displayValue = selectedItem?.description || `${value}`;
                    break;
                }
                case "text":
                default:
                    displayValue = `${value}`;
                    chipType = filterConfig.fieldType;
                    break;
            }

            const newChip: Chip = {
                key: key,
                label: `${filterConfig.label}: ${displayValue}`,
                value: value,
                disabled: false,
                type: chipType,
            };

            chips.push(newChip);
        });

        return chips;
    }
}
