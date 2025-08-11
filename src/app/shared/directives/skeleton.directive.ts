import { Directive, ElementRef, inject, Input, Renderer2 } from "@angular/core";

@Directive({
    selector: "[appSkeleton]",
    standalone: true,
})
export class SkeletonDirective {
    private el = inject(ElementRef);
    private renderer = inject(Renderer2);

    // La directiva recibe la variable de carga (por ejemplo, isLoadingData)
    @Input() set appSkeleton(isLoading: boolean) {
        if (isLoading) {
            // Si isLoading es true, añadimos la clase que aplica el estilo de esqueleto
            this.renderer.addClass(this.el.nativeElement, "skeleton-loading");
        } else {
            // Si isLoading es false, removemos la clase
            this.renderer.removeClass(
                this.el.nativeElement,
                "skeleton-loading",
            );
        }
    }
}
