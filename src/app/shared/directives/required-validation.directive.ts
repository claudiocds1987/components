import {
    Directive,
    ElementRef,
    inject,
    Input,
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
    private el = inject(ElementRef);
    private ngControl = inject(NgControl, { optional: true });
    private renderer = inject(Renderer2);
    private destroy$ = new Subject<void>();
    private messageElement: HTMLElement | null = null;
    private matFormField: HTMLElement | null = null;
    private subscriptWrapper: HTMLElement | null = null;

    ngOnInit(): void {
        if (!this.ngControl || !this.ngControl.control) {
            return;
        }

        this.matFormField = this.el.nativeElement.closest("mat-form-field");
        if (this.matFormField) {
            // ".mat-mdc-form-field-subscript-wrapper" es la clase que genera un espacio debajo del input
            this.subscriptWrapper = this.matFormField.querySelector(
                ".mat-mdc-form-field-subscript-wrapper",
            );
        }

        this.ngControl.control.statusChanges
            ?.pipe(takeUntil(this.destroy$))
            .subscribe((): void => {
                this.handleValidation();
            });

        // Escuchar el evento 'blur' del elemento nativo para validar al salir del campo
        this.renderer.listen(this.el.nativeElement, "blur", (): void => {
            // Marcar el control como 'tocado' para que la validación se active
            this.ngControl?.control?.markAsTouched();
            // Volver a evaluar la validación después del blur
            this.handleValidation();
        });

        this.handleValidation();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.removeStylesAndMessages();
    }

    private handleValidation(): void {
        const control = this.ngControl?.control;
        if (!control || !this.matFormField) {
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
        if (this.matFormField) {
            this.renderer.addClass(this.matFormField, "mat-form-field-invalid");
        }
    }

    private showRequiredMessageAndHideOriginalContainer(): void {
        if (this.messageElement || !this.matFormField) {
            return;
        }

        this.messageElement = this.renderer.createElement("mat-error");
        const text = this.renderer.createText("Campo obligatorio");
        this.renderer.appendChild(this.messageElement, text);

        // **Añadir los estilos de color y tamaño de fuente almensaje "Campo obligatorio" **
        this.renderer.setStyle(this.messageElement, "color", "#f44336"); // Color rojo
        this.renderer.setStyle(this.messageElement, "font-size", "12px");

        if (this.subscriptWrapper) {
            // this.subscriptWrapper = ".mat-mdc-form-field-subscript-wrapper"
            // aca le quito la clase .mat-mdc-form-field-subscript-wrapper
            // que es la que genera ese espacio debajo del input, para que la descripcion "Campo obligatorio" quede pegada debajo del input sin espaciado.
            this.renderer.setStyle(this.subscriptWrapper, "display", "none");
            this.renderer.setStyle(this.subscriptWrapper, "padding-top", "0");
        }

        this.renderer.appendChild(this.matFormField, this.messageElement);
    }

    private removeStylesAndMessages(): void {
        if (this.matFormField) {
            this.renderer.removeClass(
                this.matFormField,
                "mat-form-field-invalid",
            );

            if (this.messageElement) {
                this.renderer.removeChild(
                    this.matFormField,
                    this.messageElement,
                );
                this.messageElement = null;
            }

            if (this.subscriptWrapper) {
                this.renderer.removeStyle(this.subscriptWrapper, "display");
                this.renderer.removeStyle(this.subscriptWrapper, "padding-top");
            }
        }
    }
}
