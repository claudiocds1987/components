import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "truncate",
    standalone: true,
})
export class TruncatePipe implements PipeTransform {
    /*
     * Este pipe Trunca un string cuando supera los 25 caracteres y agrega elipsis("...") 
       va devolver un string con 22 caracteres + los "..." = 25 caracteres
     
     * @param value: Aca puede recibir un string/numero para truncar. Si recibe null o undefined
       devuelve un string vacio "".
     * @param limit: Aca recibe el límite de caracteres del string mayor a este valor lo trunca.
     * @param ellipsis: Se establece "true" por defecto para que agregue "..." al final de la cadena truncada.
     * @returns: devuelve un string truncado con 22 caracteres + los "..." = 25 caracteres.
     */
    transform(
        value: string | number | null | undefined,
        limit = 25,
        ellipsis = true,
    ): string {
        if (value === null || value === undefined) return "";
        const str = value.toString();
        return str.length > limit
            ? str.slice(0, limit) + (ellipsis ? "..." : "")
            : str;
    }
}
