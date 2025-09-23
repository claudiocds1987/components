/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Component, Input, OnInit, OnDestroy, inject } from "@angular/core";
import {
    FormBuilder,
    FormGroup,
    NgControl,
    ReactiveFormsModule,
} from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatNativeDateModule } from "@angular/material/core";
import { SkeletonDirective } from "../../directives/skeleton.directive";

@Component({
    selector: "app-date-range",
    standalone: true,
    imports: [
        CommonModule, // Necesario para directivas como *ngIf o *ngFor si se usan en la plantilla
        ReactiveFormsModule, // Fundamental para los formControls y formGroup
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatButtonModule, // Inclúyelo si tu componente usa botones de Material
        MatNativeDateModule,
        SkeletonDirective,
    ],
    templateUrl: "./date-range.component.html",
    styleUrl: "./date-range.component.scss",
})
export class DateRangeComponent implements OnInit, OnDestroy {
    @Input() label = "Rango de fechas";
    @Input() isDisabled = false;

    // FormGroup interno para gestionar los dos campos de fecha
    internalRangeGroup: FormGroup;

    private ngControl = inject(NgControl, { optional: true, self: true });
    private fb = inject(FormBuilder);
    private destroy$ = new Subject<void>();

    constructor() {
        this.internalRangeGroup = this.fb.group({
            startDate: [null],
            endDate: [null],
        });

        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
    }

    ngOnInit(): void {
        // Escucha los cambios en el FormGroup interno y notifica al padre
        this.internalRangeGroup.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((value) => {
                // Envía el valor al formulario padre.
                // Puedes formatear el valor si necesitas un formato de string (e.g., ISO 8601)
                this.onChange(value);
                this.onTouched(); // Notifica que se ha interactuado con el control
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Métodos de ControlValueAccessor
    writeValue(value: unknown): void {
        if (value) {
            this.internalRangeGroup.setValue(value, { emitEvent: false });
        }
    }

    registerOnChange(fn: (value: unknown) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
        if (isDisabled) {
            this.internalRangeGroup.disable({ emitEvent: false });
        } else {
            this.internalRangeGroup.enable({ emitEvent: false });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private onChange: (value: unknown) => void = (_: unknown) => {};
    private onTouched: () => void = () => {};
}
