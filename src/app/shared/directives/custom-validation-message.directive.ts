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
                this._handleValidation();
            });

        this._renderer.listen(this._el.nativeElement, "blur", (): void => {
            ngControl?.control?.markAsTouched();
            this._handleValidation();
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

        // 1. Lógica para encontrar el mat-form-field (soporta CVA como app-date-input)
        if (container.tagName === "APP-DATE-INPUT") {
            this._matFormField = container.querySelector(
                "mat-form-field",
            ) as HTMLElement | null;
        } else {
            this._matFormField = container.closest(
                "mat-form-field",
            ) as HTMLElement | null;
        }

        if (!this._matFormField) {
            return;
        }

        // 2. Busca el wrapper de Material
        this._subscriptWrapperClass =
            this._matFormField.querySelector(
                ".mat-mdc-form-field-subscript-wrapper",
            ) || null;

        // Eliminación de la clase ".mat-mdc-form-field-subscript-wrapper" de material que genera el espacio inicial
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

        this._isDomSetupDone = !!this._matFormField;
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

        if (!this._matFormField) {
            return;
        }

        let errorMessage: string | null = null;
        const isControlInvalid =
            control.invalid && (control.touched || control.dirty);

        if (isControlInvalid) {
            if (control.hasError("required")) {
                errorMessage = "Campo obligatorio";
            }
            // El resto de validadores
            else if (control.hasError("email")) {
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
        }

        if (errorMessage) {
            this._addErrorStyles();
            this._showErrorMessage(errorMessage);
        } else {
            this._removeStylesAndMessages();
        }
    }

    private _addErrorStyles(): void {
        if (this._matFormField) {
            this._renderer.addClass(
                this._matFormField,
                "mat-form-field-invalid",
            );
        }
    }

    private _showErrorMessage(message: string): void {
        if (!this._matFormField) {
            return;
        }

        if (!this._isDomSetupDone) {
            this._setupDomElements();
        }

        // 1. Ocultar agresivamente el wrapper de Material (Anulación de Espacio)
        this._renderer.setStyle(this._matFormField, "margin-bottom", "0");
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

        // 2. Crear/Actualizar el mensaje
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
        this._isFirstErrorShown = true;
    }

    private _removeStylesAndMessages(): void {
        if (this._matFormField) {
            this._renderer.removeClass(
                this._matFormField,
                "mat-form-field-invalid",
            );

            // 1. Restaurar estilos del mat-form-field
            this._renderer.removeStyle(this._matFormField, "margin-bottom");

            if (this._messageElement) {
                this._renderer.removeChild(
                    this._matFormField,
                    this._messageElement,
                );
                this._messageElement = null;
            }

            // 2. Restaurar el subscript wrapper a su estado original
            if (this._subscriptWrapperClass) {
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
                // Se puede restaurar la clase activa si se desea mostrar hint/contador
                this._renderer.addClass(
                    this._subscriptWrapperClass,
                    "mat-mdc-form-field-subscript-wrapper-active",
                );
            }
        }

        this._isFirstErrorShown = false;
    }
}
