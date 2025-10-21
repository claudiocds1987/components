/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routes } from "@angular/router";
import { HomeComponent } from "./home/home/home.component";

export const routes: Routes = [
    // 0. Ruta para el login (Lazy Loaded)
    {
        path: "login",
        loadComponent: (): Promise<any> =>
            import(
                "./../features/auth/components/login-form/login-form.component"
            ).then((c): any => c.LoginFormComponent),
    },

    // 1. carga ansiosa - La página principal (Dashboard)
    // En una aplicación real, esta ruta debería estar protegida por un guard.
    { path: "home", component: HomeComponent },

    // 2. Aplicación de Lazy Loaded para los componentes de Employee.
    {
        path: "employee-grid-pagination",
        loadComponent: (): Promise<any> =>
            import(
                "./employee/employee-grid-pagination/employee-grid-pagination.component"
            ).then((c): any => c.EmployeeGridPaginationComponent),
    },
    {
        path: "employee-grid-infinite",
        loadComponent: (): Promise<any> =>
            import(
                "./employee/employee-grid-infinite/employee-grid-infinite.component"
            ).then((c): any => c.EmployeeGridInfiniteComponent),
    },
    {
        path: "employee-grid-all",
        loadComponent: (): Promise<any> =>
            import(
                "./employee/employee-grid-all/employee-grid-all.component"
            ).then((c): any => c.EmployeeGridAllComponent),
    },
    {
        path: "employee/create",
        loadComponent: (): Promise<any> =>
            import("./employee/employee-form/employee-form.component").then(
                (c): any => c.EmployeeFormComponent,
            ),
        data: { operation: "create" },
    },
    {
        path: "employee/edit/:id",
        loadComponent: (): Promise<any> =>
            import("./employee/employee-form/employee-form.component").then(
                (c): any => c.EmployeeFormComponent,
            ),
        data: { operation: "edit" },
    },
    {
        path: "employee-form-array",
        loadComponent: (): Promise<any> =>
            import(
                "./employee/employee-form-array/employee-form-array.component"
            ).then((c): any => c.EmployeeFormArrayComponent),
        data: { operation: "edit" },
    },

    // 3. Configuración para que el login sea la ruta por defecto:
    { path: "", redirectTo: "login", pathMatch: "full" },

    // 4. El wildcard ahora redirige a login si no encuentra la ruta.
    { path: "**", redirectTo: "login" },
];

/* export const routes: Routes = [
    // 1. carga ansiosa
    { path: "home", component: HomeComponent },

    // 2. Aplicación de Lazy Loaded para los componentes.
    {
        path: "employee-grid-pagination",
        loadComponent: (): Promise<any> =>
            import(
                "./employee/employee-grid-pagination/employee-grid-pagination.component"
            ).then((c): any => c.EmployeeGridPaginationComponent),
    },
    {
        path: "employee-grid-infinite",
        loadComponent: (): Promise<any> =>
            import(
                "./employee/employee-grid-infinite/employee-grid-infinite.component"
            ).then((c): any => c.EmployeeGridInfiniteComponent),
    },
    {
        path: "employee-grid-all",
        loadComponent: (): Promise<any> =>
            import(
                "./employee/employee-grid-all/employee-grid-all.component"
            ).then((c): any => c.EmployeeGridAllComponent),
    },
    {
        path: "employee/create",
        loadComponent: (): Promise<any> =>
            import("./employee/employee-form/employee-form.component").then(
                (c): any => c.EmployeeFormComponent,
            ),
        data: { operation: "create" },
    },
    {
        path: "employee/edit/:id",
        loadComponent: (): Promise<any> =>
            import("./employee/employee-form/employee-form.component").then(
                (c): any => c.EmployeeFormComponent,
            ),
        data: { operation: "edit" },
    },

    // 4. redirige a home.component
    { path: "**", redirectTo: "" },
]; */

// Carga ansiosa (sin Lazy Loading)
/* export const routes: Routes = [
    // Route for the main menu page
    { path: "", component: HomeComponent },
    {
        path: "employee-grid-pagination",
        component: EmployeeGridPaginationComponent,
    },
    {
        path: "employee-grid-infinite",
        component: EmployeeGridInfiniteComponent,
    },
    {
        path: "employee-grid-all",
        component: EmployeeGridAllComponent,
    },

    {
        path: "employee/create",
        component: EmployeeFormComponent,
        data: { operation: "create" },
    },
    {
        path: "employee/edit/:id",
        component: EmployeeFormComponent,
        data: { operation: "edit" },
    },

    // Add a wildcard route for any path that doesn't match a route.
    // This is good practice for handling 404s.
    { path: "**", redirectTo: "" },
];
 */
