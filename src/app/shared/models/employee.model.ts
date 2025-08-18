import { SelectItem } from "./select-item.model";

export interface Employee {
    id: number;
    name: string;
    surname: string;
    countryId: number;
    birthDate: Date;
    position: SelectItem;
    active: boolean;
    imgUrl: string;
    gender: SelectItem;

    // ¡NUEVA LÍNEA! Firma de índice para compatibilidad con Record<string, string | number>
    [key: string]: string | number | Date | boolean | SelectItem | undefined;
    // Si todas las propiedades fueran obligatorias, 'undefined' no sería necesario aquí.
}
