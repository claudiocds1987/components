export interface Employee {
    id: number;
    name: string;
    surname: string;
    birthDate: Date;
    position: string;

    // ¡NUEVA LÍNEA! Firma de índice para compatibilidad con Record<string, string | number>
    [key: string]: string | number | Date | undefined;
    // Si todas tus propiedades fueran obligatorias, 'undefined' no sería necesario aquí.
}
