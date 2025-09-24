/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
    Component,
    Input,
    forwardRef,
    ChangeDetectionStrategy,
} from "@angular/core";
import {
    FormGroup,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
} from "@angular/forms";

import { MatDatepickerModule } from "@angular/material/datepicker";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatNativeDateModule } from "@angular/material/core";

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
    ],

    templateUrl: "./date-range.component.html",
    styleUrl: "./date-range.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeComponent {
    @Input() label = "Rango de fechas";
    @Input() appSkeleton = false;
    @Input() dateRangeFormGroup!: FormGroup;
}
