import { Routes } from "@angular/router";
import { EmployeeGridPaginationComponent } from "./employee/employee-grid-pagination/employee-grid-pagination.component";
import { EmployeeGridInfiniteComponent } from "./employee/employee-grid-infinite/employee-grid-infinite.component";
import { HomeComponent } from "./home/home/home.component";

export const routes: Routes = [
    // Route for the main menu page
    { path: "", component: HomeComponent },

    // Route for the paginated employee grid
    { path: "employee-grid", component: EmployeeGridPaginationComponent },

    // Route for the infinite scroll employee grid
    {
        path: "employee-grid-infinite",
        component: EmployeeGridInfiniteComponent,
    },

    /* { 
      path: "employees/create", 
      component: EmployeeFormComponent, 
      data: { condition: "create" } 
    }, */
    /* { 
      path: "employees/edit/:id", 
      component: EmployeeFormComponent, 
      data: { condition: "edit" } 
    }, */

    // Add a wildcard route for any path that doesn't match a route.
    // This is good practice for handling 404s.
    { path: "**", redirectTo: "" },
];
