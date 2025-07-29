import { MatDateFormats } from "@angular/material/core";

export const CUSTOM_DATE_FORMATS: MatDateFormats = {
    parse: {
        // LuxonDateAdapter puede ser más estricto con este formato cuando se le indica.
        dateInput: "dd/MM/yyyy", // <-- Usa 'dd/MM/yyyy' para parsear Día/Mes/Año
    },
    display: {
        dateInput: "dd/MM/yyyy", // <-- Usa 'dd/MM/yyyy' para mostrar Día/Mes/Año
        monthYearLabel: "MMM yyyy", // 'MMM yyyy' para 'Mar 2025'
        dateA11yLabel: "DDD", // Formato para accesibilidad de fecha completa (ej. 'Sunday, March 15, 2025')
        monthYearA11yLabel: "MMMM yyyy", // 'Marzo 2025'
    },
};
