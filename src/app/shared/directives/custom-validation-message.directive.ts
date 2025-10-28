import {
    Directive,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
    Renderer2,
} from "@angular/core";
import { NgControl } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";

@Directive({
    selector: "[appCustomValidationMessage]",
    standalone: true,
})
export class CustomValidationMessageDirective implements OnInit, OnDestroy {
    private _el = inject(ElementRef);
    private _ngControl = inject(NgControl, { optional: true });
    private _renderer = inject(Renderer2);
    private _destroy$ = new Subject<void>();
    private _messageElement: HTMLElement | null = null;
    private _matFormField: HTMLElement | null = null;
    private _subscriptWrapperClass: HTMLElement | null = null;

    private _isDomSetupDone = false;
    private _isFirstErrorShown = false;

    ngOnInit(): void {
        if (!this._ngControl || !this._ngControl.control) {
            return;
        }

        const control = this._ngControl.control;
        const ngControl = this._ngControl;

        control.statusChanges
            ?.pipe(takeUntil(this._destroy$))
            .subscribe((): void => {
                this.handleValidation();
            });

        this._renderer.listen(this._el.nativeElement, "blur", (): void => {
            ngControl?.control?.markAsTouched();
            this.handleValidation();
        });

        this.handleValidation();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
        this.removeStylesAndMessages();
    }

    // CustomValidationMessageDirective.ts

    private setupDomElements(): void {
        if (this._isDomSetupDone) {
            return;
        }

        // 1. Empezamos con el elemento que tiene la directiva (e.g., <app-date-input> o <input>)
        const container = this._el.nativeElement;

        // 2. Si el elemento actual es el CVA (app-date-input), buscamos el mat-form-field INTERNO.
        if (container.tagName === "APP-DATE-INPUT") {
            // Busca el primer mat-form-field dentro del CVA. Este será nuestro target.
            this._matFormField = container.querySelector(
                "mat-form-field",
            ) as HTMLElement | null;
        } else {
            // Si no es un CVA, buscamos el mat-form-field que lo contiene (closest).
            this._matFormField = container.closest(
                "mat-form-field",
            ) as HTMLElement | null;
        }

        if (!this._matFormField) {
            // Si no encontramos el mat-form-field, no podemos continuar.
            return;
        }

        // 3. Busca el wrapper de estilos donde queremos ocultar el contenido de Material.
        this._subscriptWrapperClass =
            this._matFormField.querySelector(
                ".mat-mdc-form-field-subscript-wrapper",
            ) || null;

        this._isDomSetupDone = !!this._matFormField;
    }

    /* private setupDomElements(): void {
        if (this._isDomSetupDone) {
            return;
        }
        // app-date-input es el componente date-input.component
        this._matFormField = this._el.nativeElement.closest(
            "mat-form-field, app-date-input",
        ) as HTMLElement | null;

        if (!this._matFormField) {
            return;
        }

        let targetMatFormField: HTMLElement | null = this._matFormField;

        if (this._matFormField.tagName === "APP-DATE-INPUT") {
            const internalMatFormField =
                this._matFormField.querySelector("mat-form-field");

            targetMatFormField = internalMatFormField as HTMLElement | null;

            if (targetMatFormField) {
                this._matFormField = targetMatFormField;
            } else {
                this._matFormField = null;
                return;
            }
        }

        this._subscriptWrapperClass =
            this._matFormField.querySelector(
                ".mat-mdc-form-field-subscript-wrapper",
            ) || null;

        this._isDomSetupDone = !!this._matFormField;
    } */

    private handleValidation(): void {
        const control = this._ngControl?.control;
        if (!control) {
            return;
        }

        if (!this._isDomSetupDone) {
            this.setupDomElements();
        }

        if (!this._matFormField) {
            return;
        }

        let errorMessage: string | null = null;
        const isControlInvalid =
            control.invalid && (control.touched || control.dirty);

        if (isControlInvalid) {
            if (control.hasError("email")) {
                errorMessage = "Formato de email inválido";
            }
            if (control.hasError("dateRange")) {
                errorMessage = "Debe ser mayor o igual a la fecha desde";
            }
            if (control.hasError("duplicatedEmail")) {
                errorMessage = "Email repetido";
            }
            if (control.hasError("duplicatedDate")) {
                errorMessage = "Fecha repetida";
            }
            // añadir aquí otros validadores de menor prioridad
        }

        if (errorMessage) {
            this.addErrorStyles();
            this.showErrorMessage(errorMessage);
        } else {
            // Limpiamos si no hay errores (válido) o si no ha sido tocado/modificado
            this.removeStylesAndMessages();
        }
    }

    /* private handleValidation(): void {
        const control = this._ngControl?.control;
        if (!control) {
            return;
        }

        if (!this._isDomSetupDone) {
            this.setupDomElements();
        }

        if (!this._matFormField) {
            return;
        }

        //let errorType: ErrorType | null = null;
        let errorMessage: string | null = null;
        const isControlInvalid =
            control.invalid && (control.touched || control.dirty);

        if (isControlInvalid) {
            if (control.hasError("required")) {
                errorMessage = "Campo obligatorio";
            }
            if (control.hasError("dateRange")) {
                errorMessage = "Debe ser mayor o igual a la fecha desde";
            }
            if (control.hasError("duplicatedEmail")) {
                errorMessage = "Email repetido";
            }
            if (control.hasError("email")) {
                errorMessage = "Formato de email inválido";
            }
            if (control.hasError("duplicatedDate")) {
                errorMessage = "Fecha repetida";
            }
        }

        if (errorMessage) {
            this.addErrorStyles();
            this.showErrorMessage(errorMessage);
        } else if (isControlInvalid) {
            this.removeStylesAndMessages();
        } else {
            this.removeStylesAndMessages();
        }
    } */

    private addErrorStyles(): void {
        if (this._matFormField) {
            this._renderer.addClass(
                this._matFormField,
                "mat-form-field-invalid",
            );
        }
    }

    private showErrorMessage(message: string): void {
        if (!this._matFormField) {
            return;
        }

        // 1. Asegurar que las referencias DOM existan
        if (!this._isDomSetupDone) {
            this.setupDomElements();
        }

        // 2. Crear/Actualizar el mensaje sincrónicamente
        if (this._messageElement) {
            this._renderer.setProperty(
                this._messageElement,
                "textContent",
                message,
            );
        } else {
            this._messageElement = this._renderer.createElement("mat-error");
            const text = this._renderer.createText(message);

            this._renderer.setStyle(this._messageElement, "color", "#f44336");
            this._renderer.setStyle(this._messageElement, "font-size", "12px");

            this._renderer.appendChild(this._messageElement, text);
        }

        this._renderer.appendChild(this._matFormField, this._messageElement);

        // 3. Aplicar estilos de ocultación asincrónicamente (setTimeout(0) para darle tiempo al renderizadeo del DOM)
        // solo la primera vez para evitar el espaciado inicial de la clase material  ".mat-mdc-form-field-subscript-wrapper"
        if (!this._isFirstErrorShown) {
            setTimeout((): void => {
                this._renderer.setStyle(
                    this._matFormField!,
                    "margin-bottom",
                    "0",
                );

                if (this._subscriptWrapperClass) {
                    this._renderer.setStyle(
                        this._subscriptWrapperClass,
                        "display",
                        "none",
                    );
                    this._renderer.setStyle(
                        this._subscriptWrapperClass,
                        "padding-top",
                        "0",
                    );
                }
                this._isFirstErrorShown = true;
            }, 0);
        } else {
            this._renderer.setStyle(this._matFormField, "margin-bottom", "0");

            if (this._subscriptWrapperClass) {
                this._renderer.setStyle(
                    this._subscriptWrapperClass,
                    "display",
                    "none",
                );
                this._renderer.setStyle(
                    this._subscriptWrapperClass,
                    "padding-top",
                    "0",
                );
            }
        }
    }

    private removeStylesAndMessages(): void {
        if (this._matFormField) {
            this._renderer.removeClass(
                this._matFormField,
                "mat-form-field-invalid",
            );

            if (this._messageElement) {
                this._renderer.removeChild(
                    this._matFormField,
                    this._messageElement,
                );
                this._messageElement = null;
            }
            /* if (this._subscriptWrapperClass) {
                this._renderer.removeStyle(
                    this._subscriptWrapperClass,
                    "display",
                );
                this._renderer.removeStyle(
                    this._subscriptWrapperClass,
                    "padding-top",
                );
            } */
        }

        this._isFirstErrorShown = false;
    }
}
