import { Component, OnInit } from "@angular/core";
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
export class AppComponent implements OnInit {
    title = "components";

    config: GridConfiguration = {
        columns: [
            { name: "ID", width: "50px" },
            { name: "Name", width: "250px" },
            { name: "Email" },
            { name: "Email2" },
            { name: "Email3" },
            { name: "Email4" },
            { name: "Email5", width: "50px" },
        ],
        OrderBy: { columnName: "ID", direction: "asc" },
        //withPagination: false, // si es false en la grilla mostrar scroll infinito
        withPagination: {
            pageSize: 5,
            pageSizeOptions: [5, 10, 20],
        },
        withInputSearch: true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[] = [];

    ngOnInit(): void {
        // Simulamos llamada al backend
        setTimeout((): void => {
            this.data = Array.from(
                { length: 50 },
                (
                    _: unknown,
                    i: number,
                ): { ID: number; Name: string; Email: string } => {
                    return {
                        ID: i + 1,
                        Name: `Usuario ${i + 1}`,
                        Email: `usuario${i + 1}@mail.com`,
                    };
                },
            );
        }, 2000);
    }

    /* data = [
        { ID: 1, Name: "Juan Pérez", Email: "juan@mail.com" },
        { ID: 2, Name: "Ana López", Email: "ana@mail.com" },
        { ID: 3, Name: "Carlos Ruiz", Email: "carlos@mail.com" },
    ]; */
}
