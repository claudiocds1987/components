import { Component, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import {
    createDefaultGridConfiguration,
    GridConfiguration,
} from "./shared/models/gridConfiguration";
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

    config = createDefaultGridConfiguration({
        //OrderBy: { columnName: "ID", direction: "asc" },
        columns: [
            { name: "ID", width: "70px" },
            { name: "Name" },
            { name: "Email" },
            { name: "COL1" },
            { name: "COL2" },
            { name: "COL3" },
            { name: "COL4" },
            { name: "COL5" },
        ],
    });
    /* config: GridConfiguration = {
        OrderBy: { columnName: "ID", direction: "asc" },
        withInputSearch: true,
        withExcelDownload: false, // si es true en la grilla mostrar botón de descarga a Excel
        //withPagination: false, // si es false en la grilla mostrar scroll infinito
        withPagination: {
            pageSize: 5,
            pageSizeOptions: [5, 10, 20],
        },
        columns: [
            { name: "ID", width: "80px" },
            { name: "Name" },
            { name: "Email" },
            { name: "COL1" },
            { name: "COL2" },
            { name: "COL3" },
            { name: "COL4" },
            { name: "COL5" },
        ],
    }; */

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[] = [];

    ngOnInit(): void {
        // Simulamos llamada al backend
        setTimeout((): void => {
            this.data = Array.from(
                { length: 100 },
                (
                    _: unknown,
                    i: number,
                ): { ID: number; Name: string; Email: string } => {
                    return {
                        ID: i + 1,
                        Name: `JUAN CARLOS ALBERTO JOSE MARIA ${i + 1}`,
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
