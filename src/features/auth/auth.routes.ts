/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/features/auth/auth.routes.ts
import { Routes } from "@angular/router";

export const AUTH_ROUTES: Routes = [
    {
        path: "login",
        // Carga perezosa del componente standalone
        loadComponent: (): Promise<any> =>
            import("./pages/login-page/login-page.component").then(
                (c): any => c.LoginPageComponent,
            ),
    },
    {
        path: "",
        redirectTo: "login",
        pathMatch: "full",
    },
];
