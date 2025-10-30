import {
    Directive,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
    Renderer2,
} from "@angular/core";
import { NgControl } from "@angular/forms";
import { Subject, takeUntil, merge } from "rxjs";

@Directive({
    selector: "[appCustomValidationMessage]",
    standalone: true,
})
/**
 * # appCustomValidationMessage (Directiva de Validación Personalizada)
 *
 * ## Propósito
 * Esta directiva tiene dos objetivos principales:
 * 1.  **Sustituir la gestión de errores nativa de Angular Material:** Desactiva y reemplaza
 * el comportamiento por defecto de `<mat-error>` y la clase
 * (`.mat-mdc-form-field-subscript-wrapper`) de `mat-form-field` que genera un espacio entre el input y el mensaje a mostrar.
 * 2.  **Unificar el manejo de validación para todos los tipos de campos:**
 * Asegura que los mensajes de error se muestren de manera consistente (solo cuando el control
 * es `invalid` Y (`touched` o `dirty`)), funcionando correctamente en:
 * * Inputs nativos (`<input>`).
 * * Componentes de Material (`<mat-select>`, `<mat-input>`).
 * * Componentes de Formulario Personalizados (Custom Value Accessors o CVA) como
 * `app-date-input` u otros componentes complejos.
 *
 * ## Mecanismo de Activación (Cuándo se muestra el error)
 * La directiva escucha dos eventos clave del `FormControl` asociado:
 *
 * 1.  **Cambios de Valor/Estado (`merge(statusChanges, valueChanges)`):** Reacciona a cualquier cambio.
 * Esto cubre la validación inmediata mientras se escribe.
 * 2.  **Evento `blur` (Salida de Foco):** Se escucha el evento `blur` del elemento donde se aplica
 * la directiva (`_el.nativeElement`). Esto es fundamental para los errores de campos `required`
 * (obligatorios) no llenados. Al hacer `blur`, se fuerza el `markAsTouched()` y se dispara
 * la validación, asegurando que el mensaje "Campo obligatorio" aparezca al instante.
 *
 * ## Lógica de Búsqueda del Contenedor (`_setupDomElements`)
 *
 * El principal desafío de esta directiva es dónde *insertar* el mensaje de error.
 * Necesita un contenedor estable que no cause problemas con los estilos de Material.
 *
 * ### 1. Búsqueda de `mat-form-field` (Prioridad Alta)
 * La directiva primero intenta encontrar el `<mat-form-field>` más cercano, ya sea como ancestro
 * o como descendiente (en el caso de CVA "Control Value Accesor" que envuelven su propio `mat-form-field` internamente,
 * como `app-date-input`).
 *
 * Si se encuentra un `mat-form-field`, se utiliza como contenedor (`_matFormField`), y se aplican estilos
 * para ocultar su zona de errores nativa (`.mat-mdc-form-field-subscript-wrapper`).
 *
 * ### 2. Búsqueda de `.component-container` (Justificación del uso)
 * Si el campo **no está** dentro de un `mat-form-field` (por ejemplo, es un CVA(Control Value Accesor) que no usa Material,
 * o un campo simple con estilos personalizados que está envuelto en una clase contenedora genérica,
 * como se observó en el componente padre), se intenta buscar la clase **`.component-container`**
 * como un ancestro.
 *
 * **Razón del `.component-container`:**
 * Este es un mecanismo de **contingencia (fallback)**. Se utiliza para proporcionar un punto de
 * inserción para el mensaje de error cuando el campo es un componente custom que no usa
 * `mat-form-field`, asegurando que la directiva pueda adjuntar el error de forma ordenada
 * en algún lugar visible del formulario, manteniendo la coherencia visual.
 * Es decir para los compontes "custom" como "app-date-input" deben estar contenidos en el componente padre en un div con la clase "component-container"
 * para que pueda funcionar la directiva.
 *
 * La ubicación final para insertar el mensaje es el primero que se encuentre: `_matFormField` O `_componentContainer` (`_parentToAppendError`).
 */
export class CustomValidationMessageDirective implements OnInit, OnDestroy {
    private _el = inject(ElementRef);
    private _ngControl = inject(NgControl, { optional: true });
    private _renderer = inject(Renderer2);
    private _destroy$ = new Subject<void>();
    private _messageElement: HTMLElement | null = null;
    private _matFormField: HTMLElement | null = null;
    private _componentContainer: HTMLElement | null = null;
    private _subscriptWrapperClass: HTMLElement | null = null;

    private _isDomSetupDone = false;
    private _isFirstErrorShown = false;

    private get _parentToAppendError(): HTMLElement | null {
        return this._matFormField || this._componentContainer;
    }

    ngOnInit(): void {
        if (!this._ngControl || !this._ngControl.control) {
            return;
        }

        const control = this._ngControl.control;
        const ngControl = this._ngControl;

        // 1. Unificar las suscripciones de estado y valor.
        merge(control.statusChanges!, control.valueChanges!)
            .pipe(takeUntil(this._destroy$))
            .subscribe((): void => {
                // Se ejecuta la validación si el control ha sido tocado o modificado,
                // O si el control está siendo evaluado por el sistema de formularios (statusChanges).
                if (control.touched || control.dirty || control.invalid) {
                    this._handleValidation();
                }
            });

        // 2. ESCUCHA DE BLUR (aplicable a <input>, <mat-select>, o CVA).
        // Esto asegura que al salir del foco, el error de 'required' se muestre.
        this._renderer.listen(this._el.nativeElement, "blur", (): void => {
            // Marca como touched y fuerza la validación.
            ngControl?.control?.markAsTouched();
            this._handleValidation(); // <-- Forzamos el manejo de validación aca
        });

        // Aseguramos la preparación del DOM
        this._setupDomElements();
        this._handleValidation();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
        this._removeStylesAndMessages();
    }

    // --- Lógica de DOM y Búsqueda ---

    private _setupDomElements(): void {
        if (this._isDomSetupDone) {
            return;
        }

        const container = this._el.nativeElement;

        // --- Búsqueda Prioritaria (Mat-form-field) ---
        if (container.tagName === "APP-DATE-INPUT") {
            this._matFormField = container.querySelector(
                "mat-form-field",
            ) as HTMLElement | null;
        }
        if (!this._matFormField) {
            this._matFormField = container.closest(
                "mat-form-field",
            ) as HTMLElement | null;
        }

        // --- Búsqueda Secundaria de la clase "component-container" (div que envuelve en el componente padre los componentes custom como app-date-input) ---
        if (!this._matFormField) {
            this._componentContainer = container.closest(
                ".component-container",
            ) as HTMLElement | null;

            if (this._componentContainer) {
                this._renderer.setStyle(
                    this._componentContainer,
                    "display",
                    "block",
                );
            }
        }

        // --- Lógica del Wrapper de Material (Solo si se encontró mat-form-field) ---
        if (this._matFormField) {
            this._subscriptWrapperClass =
                this._matFormField.querySelector(
                    ".mat-mdc-form-field-subscript-wrapper",
                ) || null;
            // Aca se quita la clase de material "mat-mdc-form-field-subscript-wrapper-active" que genera el espacio entre el input y el mensaje
            // de esta forma el mensaje de error se pone pegado al input sin espacio.
            if (this._subscriptWrapperClass) {
                this._renderer.setStyle(
                    this._subscriptWrapperClass,
                    "display",
                    "none",
                );
                this._renderer.setStyle(
                    this._subscriptWrapperClass,
                    "min-height",
                    "0",
                );
                this._renderer.removeClass(
                    this._subscriptWrapperClass,
                    "mat-mdc-form-field-subscript-wrapper-active",
                );
            }
        }

        this._isDomSetupDone =
            !!this._matFormField || !!this._componentContainer;
    }

    // --- Lógica de Validación y Estilos ---

    private _handleValidation(): void {
        const control = this._ngControl?.control;
        if (!control) {
            return;
        }

        if (!this._isDomSetupDone) {
            this._setupDomElements();
        }

        const parentElement = this._parentToAppendError;
        if (!parentElement) {
            return;
        }

        let errorMessage: string | null = null;
        // Solo mostramos error si es inválido Y ha sido tocado O modificado.
        const isControlInvalid =
            control.invalid && (control.touched || control.dirty);

        if (isControlInvalid) {
            if (control.hasError("required")) {
                errorMessage = "Campo obligatorio";
            } else if (control.hasError("email")) {
                errorMessage = "Formato de email inválido";
            }

            // REVISIÓN: Capturamos el mensaje del validador "custom-date-validators.ts"
            if (control.hasError("dateRange")) {
                // Aca se pone el mensaje creado desde el validador el validador "custom-date-validators.ts"
                const rangeError = control.getError("dateRange");
                errorMessage =
                    rangeError?.message || "Error en el rango de fechas";
            }

            if (control.hasError("duplicatedEmail")) {
                errorMessage = "Email repetido";
            }
            if (control.hasError("duplicatedDate")) {
                errorMessage = "Fecha repetida";
            }
            if (control.hasError("greaterThan")) {
                errorMessage = "Fecha desde no puede ser mayor a fecha hasta";
            }
        }

        if (errorMessage) {
            this._addErrorStyles(parentElement);
            this._showErrorMessage(errorMessage, parentElement);
        } else {
            this._removeStylesAndMessages(parentElement);
        }
    }

    private _addErrorStyles(targetElement: HTMLElement): void {
        if (targetElement === this._matFormField && this._matFormField) {
            this._renderer.addClass(
                this._matFormField,
                "mat-form-field-invalid",
            );
        }
    }

    private _showErrorMessage(
        message: string,
        parentElement: HTMLElement,
    ): void {
        if (!this._isDomSetupDone) {
            this._setupDomElements();
        }

        if (parentElement === this._matFormField && this._matFormField) {
            this._renderer.setStyle(this._matFormField, "margin-bottom", "0");
            if (this._subscriptWrapperClass) {
                // Se reafirma para quitar la clase de material "mat-mdc-form-field-subscript-wrapper-active" que genera el espacio entre el input y el mensaje
                // de esta forma el mensaje de error se pone pegado al input sin espacio.
                this._renderer.setStyle(
                    this._subscriptWrapperClass,
                    "display",
                    "none",
                );
                this._renderer.setStyle(
                    this._subscriptWrapperClass,
                    "min-height",
                    "0",
                );
                this._renderer.setStyle(
                    this._subscriptWrapperClass,
                    "padding-top",
                    "0",
                );
                this._renderer.removeClass(
                    this._subscriptWrapperClass,
                    "mat-mdc-form-field-subscript-wrapper-active",
                );
            }
        }

        if (this._messageElement) {
            this._renderer.setProperty(
                this._messageElement,
                "textContent",
                message,
            );
        } else {
            const elementTag =
                parentElement === this._matFormField ? "mat-error" : "span";

            this._messageElement = this._renderer.createElement(elementTag);
            this._renderer.addClass(
                this._messageElement,
                "custom-validation-error",
            );
            const text = this._renderer.createText(message);

            this._renderer.setStyle(this._messageElement, "color", "#f44336");
            this._renderer.setStyle(this._messageElement, "font-size", "12px");
            this._renderer.setStyle(this._messageElement, "display", "block");

            this._renderer.appendChild(this._messageElement, text);
        }

        this._renderer.appendChild(parentElement, this._messageElement);
        this._isFirstErrorShown = true;
    }

    private _removeStylesAndMessages(
        parentElement: HTMLElement | null = null,
    ): void {
        const targetElement = parentElement || this._parentToAppendError;

        if (targetElement) {
            if (targetElement === this._matFormField && this._matFormField) {
                this._renderer.removeClass(
                    this._matFormField,
                    "mat-form-field-invalid",
                );
                this._renderer.removeStyle(this._matFormField, "margin-bottom");
            }

            if (this._messageElement) {
                this._renderer.removeChild(targetElement, this._messageElement);
                this._messageElement = null;
            }

            if (
                targetElement === this._matFormField &&
                this._subscriptWrapperClass
            ) {
                this._renderer.removeStyle(
                    this._subscriptWrapperClass,
                    "display",
                );
                this._renderer.removeStyle(
                    this._subscriptWrapperClass,
                    "min-height",
                );
                this._renderer.removeStyle(
                    this._subscriptWrapperClass,
                    "padding-top",
                );
                this._renderer.addClass(
                    this._subscriptWrapperClass,
                    "mat-mdc-form-field-subscript-wrapper-active",
                );
            }
        }

        this._isFirstErrorShown = false;
    }
}
