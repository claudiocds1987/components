import {
    Directive,
    ElementRef,
    inject,
    OnDestroy,
    Renderer2,
    OnInit,
    Input,
} from "@angular/core";
import {
    AbstractControl,
    FormGroup,
    NG_VALIDATORS,
    NgControl,
    ValidationErrors,
    Validator,
} from "@angular/forms";
import { Subject, takeUntil } from "rxjs";

@Directive({
    selector: "[appDateRangeValidation]",
    standalone: true,
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: DateRangeValidationDirective,
            multi: true,
        },
    ],
})
export class DateRangeValidationDirective implements OnInit, OnDestroy {
    @Input() control!: NgControl;

    private _el = inject(ElementRef);
    private _renderer = inject(Renderer2);
    private _destroy$ = new Subject<void>();
    private _messageElement: HTMLElement | null = null;
    private _matFormField: HTMLElement | null = null;
    private _subscriptWrapperClass: HTMLElement | null = null;

    ngOnInit(): void {
        const ngControl = this.control;
        if (!ngControl || !ngControl.control) {
            return;
        }

        this._matFormField = this._el.nativeElement.closest("mat-form-field");
        if (this._matFormField) {
            this._subscriptWrapperClass = this._matFormField.querySelector(
                ".mat-mdc-form-field-subscript-wrapper",
            );
        }

        ngControl.control.statusChanges
            ?.pipe(takeUntil(this._destroy$))
            .subscribe((): void => {
                this.handleValidationDisplay();
            });

        this.handleValidationDisplay();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
        this.removeStylesAndMessages();
    }

    private handleValidationDisplay(): void {
        const control = this.control?.control;
        if (!control || !this._matFormField) {
            return;
        }

        if (
            control.hasError("invalidDateRange") &&
            (control.touched || control.dirty)
        ) {
            this.addInvalidStyles();
            this.showErrorMessageAndHideOriginalContainer();
        } else {
            this.removeStylesAndMessages();
        }
    }

    private addInvalidStyles(): void {
        if (this._matFormField) {
            this._renderer.addClass(
                this._matFormField,
                "mat-form-field-invalid",
            );
        }
    }

    private showErrorMessageAndHideOriginalContainer(): void {
        if (this._messageElement || !this._matFormField) {
            return;
        }
        this._messageElement = this._renderer.createElement("mat-error");
        const text = this._renderer.createText(
            "El rango de fechas no es válido",
        );
        this._renderer.appendChild(this._messageElement, text);

        this._renderer.setStyle(this._messageElement, "color", "#f44336");
        this._renderer.setStyle(this._messageElement, "font-size", "12px");

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
