import { SelectItem } from "./select-item.model";

export interface Employee {
    id: number;
    name: string;
    surname: string;
    countryId: number;
    birthDate: Date;
    positionId: number;
    active: boolean;
    imgUrl: string;
    genderId: number;

    // Firma de índice para compatibilidad con Record<string, string | number>
    [key: string]: string | number | Date | boolean | SelectItem | undefined;
    // Si todas las propiedades fueran obligatorias, 'undefined' no sería necesario aca.
}
