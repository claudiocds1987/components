import {
    Directive,
    ElementRef,
    inject,
    Input,
    OnInit,
    Renderer2,
} from "@angular/core";

@Directive({
    selector: "[appSkeleton]",
    standalone: true,
})
export class SkeletonDirective {
    private el = inject(ElementRef);
    private renderer = inject(Renderer2);
    private subscriptWrapperClass: HTMLElement | null = null;

    @Input() set appSkeleton(isLoading: boolean) {
        setTimeout((): void => {
            // Buscamos el elemento dentro del setter si no lo hemos encontrado antes
            if (!this.subscriptWrapperClass) {
                // Se busca la clase ".mat-mdc-form-field-subscript-wrapper" que es una clase de material que genera un espacio debajo del input
                this.subscriptWrapperClass =
                    this.el.nativeElement.querySelector(
                        ".mat-mdc-form-field-subscript-wrapper",
                    );
            }

            if (isLoading) {
                // 1.Se Aplica la clase de estilo skeleton
                this.renderer.addClass(
                    this.el.nativeElement,
                    "skeleton-loading",
                );
                // 2. Se Oculta la clase .mat-mdc-form-field-subscript-wrapper") para eliminar el espacio debajo del input
                if (this.subscriptWrapperClass) {
                    this.renderer.setStyle(
                        this.subscriptWrapperClass,
                        "display",
                        "none",
                    );
                }
            } else {
                // Se remueve la clase de estilo skeleton
                this.renderer.removeClass(
                    this.el.nativeElement,
                    "skeleton-loading",
                );
                // Para Restaurar el estilo .mat-mdc-form-field-subscript-wrapper definido por material
                if (this.subscriptWrapperClass) {
                    this.renderer.removeStyle(
                        this.subscriptWrapperClass,
                        "display",
                    );
                }
            }
        }, 0); // Ejecuta después de que el ciclo de detección de cambios actual se complete
    }
}
