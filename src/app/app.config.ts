// src/app/app.config.ts

import { ApplicationConfig } from "@angular/core";
import { provideRouter, withHashLocation } from "@angular/router";

import { routes } from "./app.routes";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideHttpClient } from "@angular/common/http";
import {
    DateAdapter,
    MAT_DATE_FORMATS,
    MAT_DATE_LOCALE,
} from "@angular/material/core";
import { CUSTOM_DATE_FORMATS } from "./shared/utils/custom-date-formats";
import {
    LuxonDateAdapter,
    MatLuxonDateModule,
    MAT_LUXON_DATE_ADAPTER_OPTIONS,
} from "@angular/material-luxon-adapter";

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideAnimationsAsync(),
        provideHttpClient(),
        // Cambiamos provideRouter(routes) por:
        provideRouter(routes, withHashLocation()), // Para github pages

        // ¡CLAVE! Este debe ser 'es-AR'
        { provide: MAT_DATE_LOCALE, useValue: "es-AR" },

        // ¡CLAVE! useUtc DEBE ser false. firstDayOfWeek 1 para lunes.
        // Esto influye en cómo Luxon y el picker interpreten las fechas y zonas horarias.
        {
            provide: MAT_LUXON_DATE_ADAPTER_OPTIONS,
            useValue: { useUtc: false, firstDayOfWeek: 1 },
        },
        // ¡Importante! Aca es donde le dices a Material que use LuxonDateAdapter para formatear
        // las fechas
        {
            provide: DateAdapter,
            useClass: LuxonDateAdapter,
            deps: [MAT_DATE_LOCALE, MAT_LUXON_DATE_ADAPTER_OPTIONS],
        },
        // aca le digo que fromatee las fechas al formato dd/mm/yyyy
        { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },

        MatLuxonDateModule,
    ],
};
