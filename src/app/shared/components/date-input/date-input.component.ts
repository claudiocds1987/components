/* eslint-disable @typescript-eslint/no-empty-function */
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
import { SkeletonDirective } from "../../directives/skeleton.directive";

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
        SkeletonDirective,
    ],
    templateUrl: "./date-input.component.html",
    styleUrl: "./date-input.component.scss",
})
export class DateInputComponent implements ControlValueAccessor, OnInit {
    /******************************************************************************************************
     * Este componente DateInputComponent es un componente de formulario personalizado que te permite
     * tener un campo de fecha con matInput y matDatepicker, manejando su estado interno con un FormControl,
     * y añadiendo una lógica inteligente para que la entrada de fechas manual funcione bien y se convierta
     * a un objeto Date para el resto de tu aplicación.
     * En resumen: Este componente se hizo para permitir la entrada de fechas tanto por selección del calendario
     * como por escritura manual (soportando formatos dd/MM/yyyy y dd-MM-yyyy).
     * Se integra con Angular Reactive Forms para manejar su estado y validación.
     * NOTA: Para que el mat-picker trabaje con el formato dd/MM/aaaa, se utiliza "LuxonDateAdapter"
     * Esta configuración esta hecha en el archivo app.config.ts
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
        this.internalControl.valueChanges.subscribe(
            (dateValue: Date | null) => {
                let formattedValue: string | null = null;
                if (dateValue) {
                    const luxonDate = DateTime.fromJSDate(dateValue);
                    if (luxonDate.isValid) {
                        formattedValue = luxonDate.toFormat("yyyy-MM-dd");
                    }
                }
                // Notificamos al formulario padre con el string
                this.onChange(formattedValue);
            },
        );
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
    writeValue(obj: string | null): void {
        let dateObject: Date | null = null;
        if (obj) {
            const luxonDate = DateTime.fromISO(obj);
            if (luxonDate.isValid) {
                dateObject = luxonDate.toJSDate();
            }
        }
        this.internalControl.setValue(dateObject, { emitEvent: false });
    }

    /*-----------------------------------------------------------------------------------------------------
     *  "registerOnChange": Angular te pasa una función (fn) a través de este método.
     *  Esta función (fn) es la que debes llamar cada vez que el valor de tu componente
     *  cambie internamente y quieras notificar al FormControl padre.
     *  vos la guardas en tu onChange privado para usarla después.
     *-----------------------------------------------------------------------------------------------------*/
    registerOnChange(fn: (value: string | null) => void): void {
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

    /*---------------------------------------------------------------------------------------------------------------------------
     *  "onInputBlur": Esta funcion se dispara cuando el usuario sale del campo de texto (evento blur)
     *  o presiona "Enter" (keydown.enter).
     *
     *  Su propósito es tomar lo que el usuario escribió manualmente en el campo, intentar entenderlo como
     *  una fecha y convertirlo en un formato que Angular pueda manejar.
     *
     *  1. Obtiene el texto ingresado:
     *     Consigue el valor actual del campo de texto (inputValue).
     *
     *  2. Manejo de campo vacío: Si inputValue está vacío, el campo se reinicia a null (sin fecha) y notifica
     *     al formulario padre que se interactuó con el campo.
     *
     *  3. Normalización del formato:
     *     Antes de intentar dividir la fecha, reemplaza cualquier guion (-) por una barra (/).
     *     Esto significa que si el usuario escribe 10-05-1985 o 10/05/1985, ambos se convertirán internamente a 10/05/1985.
     *     Así, el resto de la lógica solo necesita manejar un formato.
     *
     *  4. Intenta "parsear" la fecha:
     *      - Divide la cadena normalizada (10/05/1985) por el / para obtener las partes del día, mes y año.
     *      - Convierte esas partes en números (parseInt).
     *      - Realiza varias validaciones básicas para asegurar que los números sean válidos
     *        (ej. el día entre 1 y 31, el mes entre 1 y 12, el año entre 1000 y 9999).
     *      - Si los números parecen válidos, usa DateTime.fromObject de la librería Luxon para
     *        intentar crear un objeto de fecha.
     *      - Incluye una validación extra (candidateDate.day === day && candidateDate.month === month && candidateDate.year === year)
     *        para evitar que Luxon "corrija" fechas imposibles (como el 31/02/2024 que se convertiría a 02/03/2024).
     *        Esta comprobación asegura que la fecha parseada por Luxon coincida exactamente con lo que el usuario pretendía.
     *
     *  5. Actualiza el control interno:
     *      - Si logra parsear una fecha válida (finalParsedDate.isValid), convierte ese objeto Luxon a
     *        un objeto Date nativo de JavaScript (finalParsedDate.toJSDate()) y lo establece como el valor
     *        de internalControl.
     *      - Si no se pudo parsear o la fecha no es válida, internalControl se establece a null.
     *
     *  6. Notifica al formulario padre:
     *      - Finalmente, llama a this.onTouched() para indicarle al FormGroup o FormControl superior
     *        que el usuario interactuó con este campo.
     *-----------------------------------------------------------------------------------------------------------------------------------------*/
    onInputBlur(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const inputValue = inputElement.value;

        if (!inputValue) {
            this.internalControl.setValue(null);
            this.onTouched();
            return;
        }

        let finalParsedDate: DateTime | null = null;
        const normalizedInputValue = inputValue.replace(/-/g, "/"); // Reemplaza todos los '-' por '/'
        const parts = normalizedInputValue.split("/"); // Ahora usa la cadena normalizada

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
                // Intenta crear la fecha con Luxon
                const candidateDate = DateTime.fromObject(
                    { year: year, month: month, day: day },
                    { locale: "es-AR" },
                );

                if (candidateDate.isValid) {
                    // Verificación extra para evitar conversiones no deseadas (ej. 31/02 -> 02/03)
                    if (
                        candidateDate.day === day &&
                        candidateDate.month === month &&
                        candidateDate.year === year
                    ) {
                        finalParsedDate = candidateDate;
                    } else {
                        // Opcional: loguear una advertencia si la fecha no coincide exactamente
                        console.warn(
                            `onInputBlur - Fecha ambigua o inválida para ${inputValue}. Luxon interpretó como ${candidateDate.toISODate()}.`,
                        );
                    }
                }
            }
        }

        if (finalParsedDate && finalParsedDate.isValid) {
            // Establece el valor en el control interno como un Date nativo
            this.internalControl.setValue(finalParsedDate.toJSDate());
        } else {
            // Si no se pudo parsear o es inválida, establece a null
            this.internalControl.setValue(null);
        }
        this.onTouched(); // Notifica al formulario padre que el campo fue tocado
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private onChange: (value: string | null) => void = (_: string | null) => {};
    private onTouched: () => void = () => {};
}
