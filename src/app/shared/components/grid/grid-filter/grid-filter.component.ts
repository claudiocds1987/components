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
import { GridFilterConfig } from "../../../models/grid-filter-configuration.model";
import { DateInputComponent } from "../../date-input/date-input.component";
import { SkeletonDirective } from "../../../directives/skeleton.directive";
import { DateRangeComponent } from "../../date-range/date-range.component";
import { DateRangeValidationDirective } from "../../../directives/date-range-validation.directive";

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

    /*  La funcíon getNestedFormGroup() es asegurar de que si en filterForm hay un formGroup (por ej el caso de stratDate y endDate de birthDateRange) 
        este sea devuelto y tratado explícitamente como un FormGroup. para poder pasarle el FormGroup startDate y endDate a date-range-component que por input recibe un FormGroup:   
            new FormGroup({
                startDate: new FormControl(null),
                endDate: new FormControl(null),
            }),
    */

    public getNestedFormGroup(fieldName: string): FormGroup {
        const control = this.filterForm.get(fieldName);
        if (!control) {
            // En un caso real, puedes manejar esto de forma más elegante
            // (por ejemplo, devolviendo null y manejándolo en la plantilla),
            // pero para evitar el error de compilación, lanzamos un error explícito.
            throw new Error(`FormControl with name '${fieldName}' not found.`);
        }
        // Realizamos la aserción de tipo aquí para que la plantilla no tenga errores.
        return control as FormGroup;
    }

    applyFilter(): void {
        const filterFormValues = this.filterForm.value;
        this.emitFilterApplied.emit(filterFormValues);
    }

    clearFilter(): void {
        this.filterForm.reset();
        this.emitFilterApplied.emit(this.filterForm.value);
    }

    isButtonDisabled(): boolean {
        return !this.filterForm?.valid || !this.filterForm?.dirty;
    }
}
