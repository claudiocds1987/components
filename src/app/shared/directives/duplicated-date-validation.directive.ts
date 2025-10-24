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

// TIPO DE ERROR AHORA INCLUYE 'required'
type ErrorType = "duplicatedDate" | "required";

@Directive({
    selector: "[appDuplicatedDateValidation]",
    standalone: true,
})
export class DuplicatedDateValidation implements OnInit, OnDestroy {
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

    private setupDomElements(): void {
        if (this._isDomSetupDone) {
            return;
        }

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
    }

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

        let errorType: ErrorType | null = null;
        let errorMessage = "";
        const isControlInvalid =
            control.invalid && (control.touched || control.dirty);

        if (isControlInvalid) {
            // 1. PRIORIDAD: duplicatedDate
            if (control.hasError("duplicatedDate")) {
                errorType = "duplicatedDate";
                errorMessage = "Fecha duplicada";
            }
        }

        if (errorType) {
            this.addErrorStyles();
            this.showErrorMessage(errorMessage);
        } else if (isControlInvalid) {
            this.removeStylesAndMessages();
        } else {
            this.removeStylesAndMessages();
        }
    }

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
        }

        this._isFirstErrorShown = false;
    }
}
