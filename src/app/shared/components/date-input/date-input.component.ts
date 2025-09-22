/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Component, Input, OnDestroy, OnInit, inject } from "@angular/core";
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
    Validators,
} from "@angular/forms";
import { DateTime } from "luxon";
import { MatLuxonDateModule } from "@angular/material-luxon-adapter";
import { SkeletonDirective } from "../../directives/skeleton.directive";
import { Subject, takeUntil } from "rxjs";
import { RequiredValidationDirective } from "../../directives/required-validation.directive";

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
        RequiredValidationDirective,
    ],
    templateUrl: "./date-input.component.html",
    styleUrl: "./date-input.component.scss",
})
export class DateInputComponent
    implements ControlValueAccessor, OnInit, OnDestroy
{
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

    private _destroy$ = new Subject<void>();

    constructor() {
        if (this.ngControl) {
            // "this" es el encargado de manejar los valores del FormControl al que esté asociado en el formulario padre
            this.ngControl.valueAccessor = this;
        }
    }

    ngOnInit(): void {
        if (this.ngControl) {
            // Aca averigua si el formulario padre al formulario de fecha lo tiene como obligatorio
            // gracias al ngControl que es quien permite conectar el componente con el formulario del padre
            const hasRequiredValidator = this.ngControl.control?.hasValidator(
                Validators.required,
            );
            if (hasRequiredValidator) {
                this.internalControl.setValidators(Validators.required);
                this.internalControl.updateValueAndValidity();
            }

            // Detecta los cambios de estado del control padre
            this.ngControl.control?.statusChanges
                .pipe(takeUntil(this._destroy$))
                .subscribe(() => {
                    // Marca el control interno como touched si el padre es touched
                    if (this.ngControl?.control?.touched) {
                        this.internalControl.markAsTouched();
                    }
                });
        }

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

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
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
     *  "onInputChange": Se ejecuta cada vez que el usuario escribe, borra o edita un carácter en el campo de texto.
     *   Su propósito es validar la entrada de la fecha de forma inmediata y notificar al formulario padre.
     *
     *  1. Captura y Normaliza el Valor: La función toma el valor del campo de texto y estandariza el formato, convirtiendo todos los guiones (-) en barras (/).
     *
     *  2. Validación de Formato y Valor:
     *    - Solo se intenta validar si el usuario ha completado el formato dd/mm/yyyy. Esto evita que el campo se borre o marque como inválido mientras
     *      se está escribiendo.
     *    - Utiliza la librería Luxon para parsear la fecha y confirmar si es una fecha válida.
     *    - Realiza una verificación de consistencia (candidateDate.day === day && candidateDate.month === month && candidateDate.year === year)
     *      para asegurar que la fecha parseada por Luxon coincide exactamente con lo que el usuario escribió. Esto evita que Luxon "corrija" fechas imposibles
     *      Ejemplo: Como febrero solo tiene 28 o 29 días, los días extra se suman a marzo.
     *      Si el año no es bisiesto (28 días): Febrero 29 -> marzo 1, Febrero 30 -> marzo 2, Febrero 31 -> marzo 3
     *      Si el año es bisiesto (29 días): Febrero 30 -> marzo 1, Febrero 31 -> marzo 2
     *
     *  3. Sincronización con el Formulario Padre:
     *     - Si la fecha es válida, la función asigna el objeto Date correspondiente al internalControl, lo que notifica automáticamente al formulario padre
     *       sobre el cambio y su validez.
     *     - Si la entrada es un formato completo pero inválido (ej., 31/02/2024), el valor del internalControl se establece en null. Esto marca el control
     *       del formulario padre como inválido y deshabilita el botón de "Guardar".
     *-----------------------------------------------------------------------------------------------------------------------------------------*/
    onInputChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const inputValue = inputElement.value;
        let finalParsedDate: DateTime | null = null;

        if (inputValue) {
            const normalizedInputValue = inputValue.replace(/-/g, "/");
            const parts = normalizedInputValue.split("/");

            // 💡 Validar solo si el año tiene 4 dígitos
            if (parts.length === 3 && parts[2].length === 4) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const year = parseInt(parts[2], 10);

                const candidateDate = DateTime.fromObject(
                    { year, month, day },
                    { locale: "es-AR" },
                );

                if (candidateDate.isValid) {
                    if (
                        candidateDate.day === day &&
                        candidateDate.month === month &&
                        candidateDate.year === year
                    ) {
                        finalParsedDate = candidateDate;
                    }
                }
            }
        }

        // 💡 Actualiza el control solo si hay una fecha válida
        if (finalParsedDate) {
            this.internalControl.setValue(finalParsedDate.toJSDate());
        } else if (inputValue.length === 10) {
            // Si tiene 10 caracteres pero es inválida, establece el valor en null
            this.internalControl.setValue(null);
        }
        // Notifica el cambio al formulario padre
        this.onChange(
            this.internalControl.value
                ? DateTime.fromJSDate(this.internalControl.value).toFormat(
                      "yyyy-MM-dd",
                  )
                : null,
        );
        this.onTouched();
    }

    onInputBlur(): void {
        this.onTouched();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private onChange: (value: string | null) => void = (_: string | null) => {};
    private onTouched: () => void = () => {};
}
