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
    /******************************************************************************************************
    Este componente DateInputComponent es un componente de formulario personalizado que te permite 
    tener un campo de fecha con matInput y matDatepicker, manejando su estado interno con un FormControl, 
    y añadiendo una lógica inteligente para que la entrada de fechas manual funcione bien y se convierta 
    a un objeto Date para el resto de tu aplicación.
    *******************************************************************************************************/

    @Input() label = "Fecha";
    @Input() placeholder = "";
    @Input() isDisabled = false;

    /*-----------------------------------------------------------------------------------------------------
     *  "internalControl" es el cerebro del componente. Es un FormControl de Angular que maneja el valor
     *  interno de este campo de fecha. Guarda la fecha como un objeto Date de JavaScript
     *  (o null si no hay fecha).
     *---------------------------------------------------------------------------------------------------*/
    internalControl = new FormControl<Date | null>(null);

    /*-----------------------------------------------------------------------------------------------------
     * "ngControl" permite que el componente se conecte con el sistema de formularios reactivos de Angular
     * (como FormGroup y FormControl en un componente padre). Al "inyectarlo" (usando inject),
     * le dice a Angular: "Quiero que este componente se comporte como un control de formulario".
     *----------------------------------------------------------------------------------------------------*/
    public ngControl: NgControl | null = inject(NgControl, {
        optional: true,
        self: true,
    });

    constructor() {
        if (this.ngControl) {
            // "this" es el encargado de manejar los valores del FormControl al que esté asociado en el formulario padre
            this.ngControl.valueAccessor = this;
        }
    }

    ngOnInit(): void {
        this.internalControl.valueChanges.subscribe((value) => {
            this.onChange(value);
        });
    }

    // Al implementar la interfaz "ControlValueAccessor" Angular me obliga a implementar los metodos
    // "writeValue", "registerOnChange", "registerOnTouched", "setDisabledState"
    // para que Angular Forms sepa cómo hablar con mi componente

    /*-----------------------------------------------------------------------------------------------------
     *  "writeValue": Angular llama a esta función cuando necesita escribir un valor
     *  Por ejemplo, si en el componente padre cuando se hace miForm.get('miCampoFecha').setValue(new Date())
     *  Angular le pasa ese new Date() a esta función writeValue.
     *  emitEvent: false (para evitar que un setValue interno dispare un bucle de eventos).
     *-----------------------------------------------------------------------------------------------------*/
    writeValue(obj: Date | null): void {
        this.internalControl.setValue(obj, { emitEvent: false });
    }

    /*-----------------------------------------------------------------------------------------------------
     *  "registerOnChange": Angular te pasa una función (fn) a través de este método.
     *  Esta función (fn) es la que debes llamar cada vez que el valor de tu componente
     *  cambie internamente y quieras notificar al FormControl padre.
     *  vos la guardas en tu onChange privado para usarla después.
     *-----------------------------------------------------------------------------------------------------*/
    registerOnChange(fn: (value: Date | null) => void): void {
        this.onChange = fn;
    }

    /*-----------------------------------------------------------------------------------------------------
     *  "registerOnTouched": Angular te pasa una función (fn) para que la llames cuando el usuario
     *  haya "tocado" o interactuado con tu campo (por ejemplo, al salir del foco).
     *  vos la guardas en onTouched.
     *----------------------------------------------------------------------------------------------------*/
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    /* setDisabledState: para habilitar o deshabilitar el input*/
    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
        if (isDisabled) {
            this.internalControl.disable();
        } else {
            this.internalControl.enable();
        }
    }

    /*-----------------------------------------------------------------------------------------------------
     *  "onInputBlur": Esta funcion se dispara cuando el usuario
     *  sale del campo de texto (evento blur) o presiona "Enter" (keydown.enter).
     *  1. Obtiene el texto que el usuario escribió (inputValue).
     *  2. Si el campo está vacío, lo resetea a null y notifica al formulario padre
     *  que se tocó el campo.
     *  3.Intenta "parsear" (convertir de texto a fecha) el inputValue. Espera un formato dd/MM/yyyy.
     *     - Divide el string por / para obtener el día, mes y año.
     *     - Convierte esas partes a números (parseInt).
     *     - Realiza varias validaciones básicas (que sean números, que estén dentro de rangos
     *       razonables para días, meses y años).
     *     - Si los números son válidos, usa DateTime.fromObject de Luxon para crear un objeto fecha.
     *     - Tiene una validación extra para evitar fechas ambiguas o inválidas que Luxon podría
     *       "corregir" automáticamente (ej. 31/02/2024 no es una fecha real, Luxon podría convertirlo
     *        a 02/03/2024). Se asegura que el día y mes parseados sean los mismos que los originales.
     *  4. Si logra parsear una fecha válida (finalParsedDate.isValid), entonces establece ese objeto
     *        Date nativo de JavaScript (obtenido con finalParsedDate.toJSDate()) en tu internalControl.
     *  5. Si no pudo parsear una fecha válida, establece internalControl a null.
     *  6. Finalmente, llama a this.onTouched() para notificar al formulario padre.
     *-----------------------------------------------------------------------------------------------------*/
    onInputBlur(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const inputValue = inputElement.value;

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

                if (candidateDate.isValid) {
                    if (
                        candidateDate.day === day &&
                        candidateDate.month === month
                    ) {
                        finalParsedDate = candidateDate;
                    } else {
                        console.warn(
                            `onInputBlur - Ambiguity detected or invalid date components for ${inputValue}. Luxon interpreted as ${candidateDate.toISODate()}. Original Day: ${day}, Original Month: ${month}.`,
                        );
                    }
                }
            }
        }

        if (finalParsedDate && finalParsedDate.isValid) {
            this.internalControl.setValue(finalParsedDate.toJSDate());
        } else {
            this.internalControl.setValue(null);
        }
        this.onTouched();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    private onChange: (value: Date | null) => void = (_: Date | null) => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private onTouched: () => void = () => {};
}
