/* import {
    Directive,
    ElementRef,
    AfterViewInit,
    HostListener,
    Input,
    inject,
} from "@angular/core";
import { MatTooltip } from "@angular/material/tooltip";

@Directive({
    selector: "[appTruncateTooltip]",
    standalone: true,
})
export class TruncateTooltipDirective implements AfterViewInit {
    @Input("appTruncateTooltip") tooltipContent = "";

    private readonly el: ElementRef<HTMLElement> = inject(ElementRef);
    private readonly tooltip: MatTooltip = inject(MatTooltip);

    ngAfterViewInit(): void {
        setTimeout((): void => this.updateTooltip());
    }

    @HostListener("window:resize")
    onResize(): void {
        this.updateTooltip();
    }

    private updateTooltip(): void {
        const element = this.el.nativeElement;
        const isTruncated = element.scrollWidth > element.clientWidth;

        console.log("Tooltip check:", {
            text: this.tooltipContent,
            truncated: isTruncated,
        });

        this.tooltip.message = isTruncated ? this.tooltipContent : "";
    }
}
 */
import {
    Directive,
    ElementRef,
    Renderer2,
    AfterViewInit,
    HostListener,
    Input,
    inject,
} from "@angular/core";

@Directive({
    selector: "[appTruncateTooltip]",
    standalone: true,
})
export class TruncateTooltipDirective implements AfterViewInit {
    @Input("appTruncateTooltip") tooltipContent = "";

    private el = inject(ElementRef<HTMLElement>);
    private renderer = inject(Renderer2);

    ngAfterViewInit(): void {
        this._updateTooltip();
    }

    @HostListener("window:resize")
    onResize(): void {
        this._updateTooltip();
    }

    private _updateTooltip(): void {
        const element = this.el.nativeElement;

        const isTruncated = element.scrollWidth > element.clientWidth;

        if (isTruncated) {
            this.renderer.setAttribute(
                element,
                "matTooltip",
                this.tooltipContent,
            );
            this.renderer.setAttribute(element, "matTooltipPosition", "above");
        } else {
            this.renderer.removeAttribute(element, "matTooltip");
            this.renderer.removeAttribute(element, "matTooltipPosition");
        }
    }
}
