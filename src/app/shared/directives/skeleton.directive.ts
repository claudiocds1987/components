import { Directive, ElementRef, inject, Input, Renderer2 } from "@angular/core";

@Directive({
    selector: "[appSkeleton]",
    standalone: true,
})
export class SkeletonDirective {
    private el = inject(ElementRef);
    private renderer = inject(Renderer2);
    private subscriptWrapperClass: HTMLElement | null = null;

    @Input() set appSkeleton(isLoading: boolean) {
        if (isLoading) {
            // Si esta cargando se aplica la clase de estilo skeleton
            this.renderer.addClass(this.el.nativeElement, "skeleton-loading");
        } else {
            // si termino de cargar se quita clase de skeleton
            this.renderer.removeClass(
                this.el.nativeElement,
                "skeleton-loading",
            );
        }
        // Lógica de Material: Mantenemos el setTimeout por si se usa en form-fields
        setTimeout((): void => {
            // Buscamos el elemento dentro del setter si no lo hemos encontrado antes
            if (!this.subscriptWrapperClass) {
                // Se busca la clase ".mat-mdc-form-field-subscript-wrapper" que es una clase de material que genera un espacio debajo del input
                this.subscriptWrapperClass =
                    this.el.nativeElement.querySelector(
                        ".mat-mdc-form-field-subscript-wrapper",
                    );
            }
            if (this.subscriptWrapperClass) {
                if (isLoading) {
                    // Se quita la clase de material ".mat-mdc-form-field-subscript-wrapper" que genera un espacio debajo del input
                    this.renderer.setStyle(
                        this.subscriptWrapperClass,
                        "display",
                        "none",
                    );
                } else {
                    // Para restaurar el estilo .mat-mdc-form-field-subscript-wrapper definido por material
                    this.renderer.removeStyle(
                        this.subscriptWrapperClass,
                        "display",
                    );
                }
            }
        }, 0);
    }
}
