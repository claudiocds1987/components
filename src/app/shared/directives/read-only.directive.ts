import {
    Directive,
    ElementRef,
    inject,
    Input,
    Renderer2,
    OnInit,
} from "@angular/core";

@Directive({
    selector: "[appReadOnly]",
    standalone: true,
})
export class ReadOnlyDirective implements OnInit {
    /*****************************************************************************************************************************
     * Directiva 'appReadOnly':
     * * 1. Propósito: Aplica estilos de 'solo lectura' a un mat-form-field sin usar la propiedad nativa 'disabled'.
     * * 2. Efecto Visual:
     * - Cambia el fondo del campo a un gris sutil (rgba(0,0,0,.04)), imitando el estado disabled de Material.
     * - Elimina el contorno (borde) si usa appearance="outline".
     * * 3. Interacción:
     * - Hace que el campo sea NO INTERACTIVO (pointer-events: none) para prevenir clics o focus.
     * - Evita que el usuario pueda seleccionar o copiar el texto (user-select: none).
     * - Oculta el cursor de escritura (caret-color: transparent).
     * * 4. Implementación: Inyecta una etiqueta <style> con el CSS necesario en el <head> del documento
     * y añade la clase 'read-only-disabled-style' al mat-form-field padre del elemento host.
     *****************************************************************************************************************************/

    // Bandera para asegurar que los estilos solo se inyecten una vez
    private static stylesInjected = false;

    // El input de la directiva, que recibe el valor booleano
    @Input() appReadOnly: boolean | undefined = false;

    private _el = inject(ElementRef);
    private renderer = inject(Renderer2);
    private _matFormField: HTMLElement | null = null;

    ngOnInit(): void {
        // En este punto, this._el.nativeElement es el <input matInput>
        this._matFormField = this._el.nativeElement.closest("mat-form-field");

        if (this.appReadOnly && this._matFormField) {
            // ⭐️ 1. Establecer el atributo [readonly] en el input host.
            // Esto es necesario para que el CSS inyectado por la directiva aplique los estilos de no interacción.
            this.renderer.setAttribute(
                this._el.nativeElement,
                "readonly",
                "true",
            );

            // 2. Inyectar los estilos una sola vez en el <head>
            this.injectStyles();

            // 3. Se agrega al mat-form-field la clase read-only-disabled-style
            this.renderer.addClass(
                this._matFormField,
                "read-only-disabled-style",
            );
        }
    }

    private injectStyles(): void {
        if (ReadOnlyDirective.stylesInjected) {
            return;
        }

        const disabledBgColor = "rgba(0, 0, 0, 0.04)";

        const css = `
            /* ESTILOS DE FONDO */
            /* 1. Aplica el color de fondo gris de Material (disabled) al contenedor interno (MDC) */
            .read-only-disabled-style .mat-mdc-text-field-wrapper {
                background-color: ${disabledBgColor} !important;
            }
            
            /* 2. Opcional: Elimina el contorno de la apariencia "outline" */
            .read-only-disabled-style.mat-mdc-form-field-appearance-outline .mat-mdc-notched-outline {
                border: none !important;
            }

            /* 3. Evita que el usuario seleccione el texto y elimina el cursor/caret */
            .read-only-disabled-style input.mat-mdc-input[readonly] {
                /* Evita que el cursor de texto (caret) aparezca */
                caret-color: transparent !important; 
                
                /* Evita que el usuario seleccione el texto */
                user-select: none !important;
                -webkit-user-select: none !important;
                
                /* Garantiza que no se muestre ningún color de fondo superpuesto */
                background-color: transparent !important;
            }

            /* 4. Evita TODA interacción (clics, enfoque, etc.) en el mat-form-field wrapper */
            .read-only-disabled-style .mat-mdc-text-field-wrapper {
                pointer-events: none;
            }
        `;

        // Crea e inyecta el elemento <style>
        const style = this.renderer.createElement("style");
        this.renderer.setAttribute(style, "type", "text/css");
        this.renderer.appendChild(style, this.renderer.createText(css));

        // Añade el elemento <style> al <head> del documento
        const head = this.renderer.selectRootElement("head", true);
        this.renderer.appendChild(head, style);

        ReadOnlyDirective.stylesInjected = true;
    }
}
