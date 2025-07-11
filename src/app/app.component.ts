import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { GridConfiguration } from "./shared/models/gridConfiguration";
import { GridComponent } from "./shared/components/grid/grid.component";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [RouterOutlet, MatButtonModule, GridComponent],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
})
export class AppComponent {
    title = "components";

    config: GridConfiguration = {
        column: [{ name: "ID" }, { name: "Name" }, { name: "Email" }],
        OrderBy: { columnName: "ID", direction: "asc" },
        //withPagination: false // si es false en la grilla mostrar scroll infinito
        withPagination: {
            pageSize: 5,
            pageSizeOptions: [5, 10, 20],
            showFirstLastButtons: true,
        },
    };

    data = [
        { ID: 1, Name: "Juan Pérez", Email: "juan@mail.com" },
        { ID: 2, Name: "Ana López", Email: "ana@mail.com" },
        { ID: 3, Name: "Carlos Ruiz", Email: "carlos@mail.com" },
    ];
}
