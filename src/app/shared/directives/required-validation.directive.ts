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
    selector: "[appRequiredValidation]",
    standalone: true,
})
export class RequiredValidationDirective implements OnInit, OnDestroy {
    private _el = inject(ElementRef);
    private _ngControl = inject(NgControl, { optional: true });
    private _renderer = inject(Renderer2);
    private _destroy$ = new Subject<void>();
    private _messageElement: HTMLElement | null = null;
    private _matFormField: HTMLElement | null = null;
    private _subscriptWrapperClass: HTMLElement | null = null;

    ngOnInit(): void {
        if (!this._ngControl || !this._ngControl.control) {
            return;
        }
        // "closest" para comenzar la búsqueda desde ese elemento nativo y sube por la jerarquía.
        // Devuelve la referencia al primer elemento ancestro (el más cercano) que tiene la etiqueta <mat-form-field>.
        this._matFormField = this._el.nativeElement.closest("mat-form-field");
        if (this._matFormField) {
            // ".mat-mdc-form-field-subscript-wrapper" es la clase que genera un espacio debajo del input
            this._subscriptWrapperClass = this._matFormField.querySelector(
                ".mat-mdc-form-field-subscript-wrapper",
            );
        }

        this._ngControl.control.statusChanges
            ?.pipe(takeUntil(this._destroy$))
            .subscribe((): void => {
                this.handleValidation();
            });

        // Escuchar el evento 'blur' del elemento nativo para validar al salir del campo
        this._renderer.listen(this._el.nativeElement, "blur", (): void => {
            // Marcar el control como 'tocado' para que la validación se active
            this._ngControl?.control?.markAsTouched();
            // Volver a evaluar la validación después del blur
            this.handleValidation();
        });

        this.handleValidation();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
        this.removeStylesAndMessages();
    }

    private handleValidation(): void {
        const control = this._ngControl?.control;
        if (!control || !this._matFormField) {
            return;
        }

        if (control.invalid && (control.touched || control.dirty)) {
            if (control.hasError("required")) {
                this.addRequiredStyles();
                this.showRequiredMessageAndHideOriginalContainer();
            } else {
                this.removeStylesAndMessages();
            }
        } else {
            this.removeStylesAndMessages();
        }
    }

    private addRequiredStyles(): void {
        if (this._matFormField) {
            this._renderer.addClass(
                this._matFormField,
                "mat-form-field-invalid",
            );
        }
    }

    private showRequiredMessageAndHideOriginalContainer(): void {
        if (this._messageElement || !this._matFormField) {
            return;
        }

        this._messageElement = this._renderer.createElement("mat-error");
        const text = this._renderer.createText("Campo obligatorio");
        this._renderer.appendChild(this._messageElement, text);

        // **Añadir los estilos de color y tamaño de fuente almensaje "Campo obligatorio" **
        this._renderer.setStyle(this._messageElement, "color", "#f44336"); // Color rojo
        this._renderer.setStyle(this._messageElement, "font-size", "12px");

        if (this._subscriptWrapperClass) {
            // this.subscriptWrapper = ".mat-mdc-form-field-subscript-wrapper"
            // aca le quito la clase .mat-mdc-form-field-subscript-wrapper
            // que es la que genera ese espacio debajo del input, para que la descripcion "Campo obligatorio" quede pegada debajo del input sin espaciado.
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

        this._renderer.appendChild(this._matFormField, this._messageElement);
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

            if (this._subscriptWrapperClass) {
                this._renderer.removeStyle(
                    this._subscriptWrapperClass,
                    "display",
                );
                this._renderer.removeStyle(
                    this._subscriptWrapperClass,
                    "padding-top",
                );
            }
        }
    }
}
