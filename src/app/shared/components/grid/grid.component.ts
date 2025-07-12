import {
    Component,
    ViewChild,
    AfterViewInit,
    Input,
    OnChanges,
    SimpleChanges,
    OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import {
    GridConfiguration,
    PaginationConfig,
} from "../../models/gridConfiguration";
import {
    MatPaginator,
    MatPaginatorIntl,
    MatPaginatorModule,
} from "@angular/material/paginator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

@Component({
    selector: "app-grid",
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
    ],
    templateUrl: "./grid.component.html",
    styleUrl: "./grid.component.scss",
    providers: [
        {
            provide: MatPaginatorIntl,
            useFactory: () => {
                // Configuración personalizada para MatPaginator
                const paginatorIntl = new MatPaginatorIntl();
                paginatorIntl.itemsPerPageLabel = "Registros por página:";
                paginatorIntl.nextPageLabel = "Siguiente";
                paginatorIntl.previousPageLabel = "Anterior";
                paginatorIntl.firstPageLabel = "Primera página";
                paginatorIntl.lastPageLabel = "Última página";

                paginatorIntl.getRangeLabel = (
                    page: number,
                    pageSize: number,
                    length: number,
                ) => {
                    if (length === 0 || pageSize === 0) {
                        return `Mostrando 0 de ${length}`;
                    }
                    const startIndex = page * pageSize;
                    const endIndex = Math.min(startIndex + pageSize, length);
                    return `Mostrando ${startIndex + 1}–${endIndex} de ${length}`;
                };

                return paginatorIntl;
            },
        },
    ],
})
export class GridComponent implements OnInit, AfterViewInit, OnChanges {
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @Input() config!: GridConfiguration;
    @Input() data: Record<string, string | number>[] = [];
    dataSource = new MatTableDataSource<Record<string, string | number>>();
    isLoading = true;
    rows25: number[] = Array.from({ length: 25 }, (_, i) => i);

    get columnNames(): string[] {
        return this.config?.columns?.map((c) => c.name) || [];
    }

    get paginatorConfig(): PaginationConfig | null {
        const pagination = this.config?.withPagination;
        return typeof pagination === "object" && pagination !== null
            ? pagination
            : null;
    }

    getCellValue(
        row: Record<string, string | number>,
        colName: string,
    ): string | number | undefined {
        return row[colName];
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    ngOnInit() {
        this.dataSource.filterPredicate = (data, filter: string) => {
            return Object.values(data).some((value) =>
                value.toString().toLowerCase().includes(filter),
            );
        };
    }

    ngAfterViewInit() {
        this.dataSource.sort = this.sort;

        if (this.config?.withPagination && this.paginator) {
            this.dataSource.paginator = this.paginator;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes["data"] && this.data) {
            this.dataSource.data = this.data;

            // 🔧 REASIGNAMOS el paginator y sort cuando llegan datos
            /*  if (this.paginator) {
                this.dataSource.paginator = this.paginator;
            }
            if (this.sort) {
                this.dataSource.sort = this.sort;
            } */

            // Si llegaron datos, ocultamos el skeleton
            this.isLoading = this.data.length === 0;
        }
    }
}
