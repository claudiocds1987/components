/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Component, Input, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatIconModule } from "@angular/material/icon";

import {
    ControlValueAccessor,
    NgControl,
    FormControl,
    ReactiveFormsModule,
} from "@angular/forms";
import { DateTime } from "luxon";
import { MatLuxonDateModule } from "@angular/material-luxon-adapter";

@Component({
    selector: "app-date-input",
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatIconModule,
        MatLuxonDateModule,
    ],
    templateUrl: "./date-input.component.html",
    styleUrl: "./date-input.component.scss",
})
export class DateInputComponent implements ControlValueAccessor, OnInit {
    @Input() label = "Fecha";
    @Input() placeholder = "";
    @Input() isDisabled = false;

    internalControl = new FormControl<Date | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    public ngControl: NgControl | null = inject(NgControl, {
        optional: true,
        self: true,
    });

    constructor() {
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
    }

    ngOnInit(): void {
        this.internalControl.valueChanges.subscribe((value) => {
            console.log("internalControl valueChanges (to parent):", value); // DEBUG
            this.onChange(value);
        });
    }

    writeValue(obj: Date | null): void {
        console.log("writeValue (from parent):", obj); // DEBUG
        this.internalControl.setValue(obj, { emitEvent: false });
    }

    registerOnChange(fn: (value: Date | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
        if (isDisabled) {
            this.internalControl.disable();
        } else {
            this.internalControl.enable();
        }
    }

    onInputBlur(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const inputValue = inputElement.value;
        console.log("onInputBlur - Input Value CAPTURADO:", inputValue); // ¡DEBUG CLAVE!

        if (!inputValue) {
            this.internalControl.setValue(null);
            this.onTouched();
            return;
        }

        let finalParsedDate: DateTime | null = null;

        const parts = inputValue.split("/");

        if (parts.length === 3) {
            const dayStr = parts[0];
            const monthStr = parts[1];
            const yearStr = parts[2];

            const day = parseInt(dayStr, 10);
            const month = parseInt(monthStr, 10);
            const year = parseInt(yearStr, 10);

            if (
                !isNaN(day) &&
                day >= 1 &&
                day <= 31 &&
                !isNaN(month) &&
                month >= 1 &&
                month <= 12 &&
                !isNaN(year) &&
                year >= 1000 &&
                year <= 9999
            ) {
                const candidateDate = DateTime.fromObject(
                    { year: year, month: month, day: day },
                    { locale: "es-AR" },
                );
                console.log(
                    "onInputBlur - Candidate Date fromObject (DD/MM/YYYY):",
                    candidateDate.isValid
                        ? candidateDate.toISODate()
                        : "Invalid",
                );

                if (candidateDate.isValid) {
                    if (
                        candidateDate.day === day &&
                        candidateDate.month === month
                    ) {
                        finalParsedDate = candidateDate;
                        console.log(
                            "onInputBlur - Final Parsed Date (DD/MM/YYYY confirmed):",
                            finalParsedDate.toISODate(),
                        );
                    } else {
                        console.warn(
                            `onInputBlur - Ambiguity detected or invalid date components for ${inputValue}. Luxon interpreted as ${candidateDate.toISODate()}. Original Day: ${day}, Original Month: ${month}.`,
                        );
                    }
                }
            }
        }

        if (finalParsedDate && finalParsedDate.isValid) {
            // reviasar aca creo que tansofrma a fri May 10 1985
            this.internalControl.setValue(finalParsedDate.toJSDate());
        } else {
            this.internalControl.setValue(null);
            console.log(
                "onInputBlur - Failed to parse date correctly, setting to null.",
            );
        }
        this.onTouched();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    private onChange: (value: Date | null) => void = (_: Date | null) => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private onTouched: () => void = () => {};
}
