import { Component, ViewChild, AfterViewInit } from "@angular/core";
import { CommonModule, TitleCasePipe } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";

interface GridData {
    id: number;
    name: string;
    email: string;
}

@Component({
    selector: "app-grid",
    standalone: true,
    imports: [CommonModule, TitleCasePipe, MatTableModule, MatSortModule],
    templateUrl: "./grid.component.html",
    styleUrl: "./grid.component.scss",
})
export class GridComponent implements AfterViewInit {
    displayedColumns: string[] = ["id", "name", "email"];
    dataSource = new MatTableDataSource<GridData>([
        { id: 1, name: "Juan Pérez", email: "juan@mail.com" },
        { id: 2, name: "Ana López", email: "ana@mail.com" },
        { id: 3, name: "Carlos Ruiz", email: "carlos@mail.com" },
    ]);

    @ViewChild(MatSort) sort!: MatSort;

    ngAfterViewInit() {
        this.applySort();
    }

    applySort() {
        this.dataSource.sort = this.sort;
    }
}
