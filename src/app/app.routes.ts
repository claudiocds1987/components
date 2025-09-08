import { Routes } from "@angular/router";
import { EmployeeGridPaginationComponent } from "./employee/employee-grid-pagination/employee-grid-pagination.component";
import { EmployeeGridInfiniteComponent } from "./employee/employee-grid-infinite/employee-grid-infinite.component";
import { HomeComponent } from "./home/home/home.component";
import { EmployeeGridAllComponent } from "./employee/employee-grid-all/employee-grid-all.component";
import { EmployeeFormComponent } from "./employee/employee-form/employee-form-container/employee-form/employee-form.component";

export const routes: Routes = [
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
        path: "employee-create",
        component: EmployeeFormComponent,
        data: { condition: "create" },
    },
    /* { 
      path: "employees/edit/:id", 
      component: EmployeeFormComponent, 
      data: { condition: "edit" } 
    }, */

    // Add a wildcard route for any path that doesn't match a route.
    // This is good practice for handling 404s.
    { path: "**", redirectTo: "" },
];
