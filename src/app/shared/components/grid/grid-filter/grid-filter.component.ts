import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    signal,
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
    @Input() config: GridFilterConfig[] = [];
    @Input() filterForm!: FormGroup;
    @Input() isLoading = false;
    @Output() emitFilterApplied = new EventEmitter<Record<string, unknown>>();
    @Output() isCollapsedChange = new EventEmitter<boolean>(); // Output para notificar el estado de colapso al padre

    isCollapsed = signal<boolean>(false);

    /*  La funcíon getFormGroupByName() es asegurar de que si en filterForm hay un formGroup (por ej el caso de stratDate y endDate de birthDateRange) 
        este sea devuelto y tratado explícitamente como un FormGroup. para poder pasarle el FormGroup startDate y endDate a date-range-component que por input recibe un FormGroup:   
            new FormGroup({
                startDate: new FormControl(null),
                endDate: new FormControl(null),
            }),
    */

    getFormGroupByName(fieldName: string): FormGroup | null {
        const control = this.filterForm.get(fieldName);
        return control as FormGroup | null;
    }

    toggleCollapse(): void {
        this.isCollapsed.update((val): boolean => {
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
        if (!this.filterForm || !this.config) {
            return false;
        }

        const values = this.filterForm.value;

        /**
         *  Función auxiliar para verificar si un valor de campo es "vacío" o "neutral".
         *  aca se agrega la verificación para "all" y 0, ya que estos pueden ser valores
         *  predeterminados en los selectores y no deberían contar como filtros activos.
         *  Esta función va a determinar si el boton Limpiar filtros debe estar habilitado o no.
         *  si hay filtros aplicados, el boton se habilita. caso contrario, se deshabilita.
         */
        const isValueEmpty = (value: unknown): boolean => {
            if (value === null || value === undefined) {
                return true;
            }
            if (typeof value === "string") {
                const trimmedLower = value.trim().toLowerCase();
                // Verifica si es cadena vacía O el valor neutral "all"
                if (trimmedLower === "" || trimmedLower === "all") {
                    return true;
                }
            }
            // Verifica si es el número 0 (común para IDs o valores predeterminados)
            if (typeof value === "number" && value === 0) {
                return true;
            }
            return false;
        };

        for (const filter of this.config) {
            const fieldName = filter.fieldName;
            const value = values[fieldName];

            // 1. Manejo de campos simples (text, select, date)
            if (filter.fieldType !== "dateRange") {
                if (!isValueEmpty(value)) {
                    return true;
                }
            } else {
                // 2. Manejo de dateRange (FormGroup anidado)
                const dateRangeGroup = this.getFormGroupByName(fieldName);
                if (dateRangeGroup) {
                    // Verificamos si al menos uno de los controles internos (startDate o endDate) tiene valor.
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
        const filterFormValues = this.filterForm.value;
        this.emitFilterApplied.emit(filterFormValues);
        this.filterForm.markAsPristine();
    }

    clearFilter(): void {
        this.filterForm.reset();

        this.filterForm.markAsPristine();
        this.filterForm.markAsUntouched();

        this.emitFilterApplied.emit(this.filterForm.value);
    }

    isReadyToApply(): boolean {
        return !this.filterForm?.valid || !this.filterForm?.dirty;
    }
}
