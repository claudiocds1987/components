import { Component, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { createDefaultGridConfiguration } from "./shared/models/gridConfiguration";
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
            { name: "Email", isSortable: false },
            { name: "Domicilio" },
            { name: "CodPostal", align: "center" },
            { name: "Puesto" },
            { name: "Dni" },
            {
                name: "Elipsis",
                width: "70px",
                align: "center",
                isSortable: false,
            },
        ],
    });

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
                ): {
                    ID: number;
                    Name: string;
                    Email: string;
                    Domicilio: string;
                    CodPostal: string;
                    Puesto: string;
                    Dni: string;
                    Elipsis: string;
                } => {
                    return {
                        ID: i + 1,
                        Name: `JUAN CARLOS ALBERTO JOSE MARIA ${i + 1}`,
                        Email: `usuario${i + 1}@mail.com`,
                        Domicilio: `Av.Libertador 1${i + 1}`,
                        CodPostal: `164${i + 1}`,
                        Puesto: `Administrativo ${i + 1}`,
                        Dni: `2 ${i + 1}.310.510`,
                        Elipsis: "...",
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
