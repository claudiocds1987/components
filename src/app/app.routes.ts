import { Routes } from "@angular/router";
import { GridComponent } from "./shared/components/grid/grid.component";

export const routes: Routes = [
    { path: "grid", component: GridComponent },
    // Ruta para crear un nuevo empleado
    // Usamos la propiedad `data` para pasar la condición 'create'
    /* { 
      path: "employees/create", 
      component: EmployeeFormComponent, 
      data: { condition: "create" } 
    }, */

    // Ruta para editar un empleado existente
    // La condición 'edit' se pasa a través de `data`
    // También incluimos un parámetro de ruta `:id` para saber qué empleado editar
    /* { 
      path: "employees/edit/:id", 
      component: EmployeeFormComponent, 
      data: { condition: "edit" } 
    }, */
];
