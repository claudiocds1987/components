export interface Employee {
    id: number;
    name: string;
    email: string;
    domicilio: string;
    codPostal: string;
    puesto: string;
    dni: string;

    // ¡NUEVA LÍNEA! Firma de índice para compatibilidad con Record<string, string | number>
    [key: string]: string | number | undefined;
    // Añadimos 'undefined' porque 'Elipsis' es opcional y podría no estar presente.
    // Si todas tus propiedades fueran obligatorias, 'undefined' no sería necesario aquí.
}
