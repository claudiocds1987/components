import {
    Component,
    ViewChild,
    AfterViewInit,
    Input,
    OnChanges,
    SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { GridConfiguration } from "../../models/gridConfiguration";

@Component({
    selector: "app-grid",
    standalone: true,
    imports: [CommonModule, MatTableModule, MatSortModule],
    templateUrl: "./grid.component.html",
    styleUrl: "./grid.component.scss",
})
export class GridComponent implements AfterViewInit, OnChanges {
    @Input() config!: GridConfiguration;
    @Input() data: Record<string, string | number>[] = [];
    dataSource = new MatTableDataSource<Record<string, string | number>>();

    get columnNames(): string[] {
        return this.config?.column?.map((c) => c.name) || [];
    }

    getCellValue(
        row: Record<string, string | number>,
        colName: string,
    ): string | number | undefined {
        return row[colName];
    }

    @ViewChild(MatSort) sort!: MatSort;

    ngAfterViewInit() {
        this.dataSource.sort = this.sort;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes["data"] && this.data) {
            this.dataSource.data = this.data;
        }
    }
}
