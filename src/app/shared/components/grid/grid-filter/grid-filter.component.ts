import {
    Component,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    signal,
    input,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatButtonModule } from "@angular/material/button";
import { GridFilterConfig } from "../../../models/grid-filter-configuration.model";
import { DateInputComponent } from "../../date-input/date-input.component";
import { SkeletonDirective } from "../../../directives/skeleton.directive";
import { DateRangeComponent } from "../../date-range/date-range.component";
import { DateRangeValidationDirective } from "../../../directives/date-range-validation.directive";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";

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
        DateRangeComponent,
        SkeletonDirective,
        DateRangeValidationDirective,
        MatIcon,
        MatTooltip,
    ],
    templateUrl: "./grid-filter.component.html",
    styleUrls: [
        "./grid-filter.component.scss",
        "../../../styles/skeleton.scss",
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridFilterComponent {
    configSig = input<GridFilterConfig[]>([]);
    filterFormSig = input.required<FormGroup>(); // Usamos required() para campos obligatorios sin valor inicial
    isLoadingSig = input<boolean>(false);
    @Output() emitFilterApplied = new EventEmitter<Record<string, unknown>>();
    @Output() isCollapsedChange = new EventEmitter<boolean>(); // Output para notificar el estado de colapso al padre

    isCollapsedSig = signal<boolean>(false);

    /*  La funcíon getFormGroupByName() es asegurar de que si en filterForm hay un formGroup (por ej el caso de stratDate y endDate de birthDateRange) 
        este sea devuelto y tratado explícitamente como un FormGroup. para poder pasarle el FormGroup startDate y endDate a date-range-component que por input recibe un FormGroup:   
            new FormGroup({
                startDate: new FormControl(null),
                endDate: new FormControl(null),
            }),
    */

    getFormGroupByName(fieldName: string): FormGroup | null {
        const control = this.filterFormSig().get(fieldName);
        return control as FormGroup | null;
    }

    toggleCollapse(): void {
        this.isCollapsedSig.update((val): boolean => {
            const newValue = !val;
            // 💡 Emitir el nuevo estado de colapso
            this.isCollapsedChange.emit(newValue);
            return newValue;
        });
    }

    /**
     *  la funcion hasActiveFilters() verifica si hay filtros activos en el formulario de filtro.
     *  Un filtro se considera activo si su valor no es nulo, indefinido, una cadena vacía,
     *  el valor neutral "all" (para selectores) o 0 (común para IDs o valores predeterminados).
     */
    public hasActiveFilters(): boolean {
        // Accedemos a los valores de las signals
        const currentFilterForm = this.filterFormSig();
        const currentConfig = this.configSig();

        if (!currentFilterForm || !currentConfig) {
            return false;
        }
        // Función auxiliar para verificar si un valor es "vacío" o neutral
        const isValueEmpty = (value: unknown): boolean => {
            if (value === null || value === undefined) return true;
            if (typeof value === "string") {
                const trimmedLower = value.trim().toLowerCase();
                if (trimmedLower === "" || trimmedLower === "all") return true;
            }
            if (typeof value === "number" && value === 0) return true;
            return false;
        };

        for (const filter of currentConfig) {
            const fieldName = filter.fieldName;

            // .get(fieldName)?.value para obtener el valor del control específico.
            const value = currentFilterForm.get(fieldName)?.value;

            // 1. Manejo de campos simples (text, select, date)
            if (filter.fieldType !== "dateRange") {
                // Pasamos el valor del campo específico
                if (!isValueEmpty(value)) {
                    return true;
                }
            } else {
                const dateRangeGroup = this.getFormGroupByName(fieldName);
                if (dateRangeGroup) {
                    const startValue = dateRangeGroup.get("startDate")?.value;
                    const endValue = dateRangeGroup.get("endDate")?.value;

                    if (!isValueEmpty(startValue) || !isValueEmpty(endValue)) {
                        return true;
                    }
                }
            }
        }
        // Si el bucle termina, todos los campos están vacíos/nulos/neutrales.
        return false;
    }

    applyFilter(): void {
        const filterFormValues: Record<string, unknown> =
            this.filterFormSig().value;
        this.emitFilterApplied.emit(filterFormValues);
        this.filterFormSig().markAsPristine();
    }

    clearFilter(): void {
        this.filterFormSig().reset();
        this.filterFormSig().markAsPristine();
        this.filterFormSig().markAsUntouched();
        const filterFormValues: Record<string, unknown> =
            this.filterFormSig().value;
        this.emitFilterApplied.emit(filterFormValues);
    }

    isReadyToApply(): boolean {
        return !this.filterFormSig()?.valid || !this.filterFormSig()?.dirty;
    }
}
