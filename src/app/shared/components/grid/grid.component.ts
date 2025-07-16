import {
    Component,
    ViewChild,
    AfterViewInit,
    Input,
    OnChanges,
    SimpleChanges,
    OnInit,
    inject,
    NgZone,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import {
    Column,
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
import { take } from "rxjs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TruncatePipe } from "../../pipes/truncate.pipe";

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
        MatTooltipModule,
        TruncatePipe,
    ],
    templateUrl: "./grid.component.html",
    styleUrl: "./grid.component.scss",
    providers: [
        {
            provide: MatPaginatorIntl,
            useFactory: (): MatPaginatorIntl => {
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
                ): string => {
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
    rows25: number[] = Array.from({ length: 25 });

    private _ngZone = inject(NgZone);

    get columns(): Column[] {
        return this.config?.columns ?? [];
    }

    get columnNames(): string[] {
        return this.config?.columns?.map((c): string => c.name) || [];
    }

    get paginatorConfig(): PaginationConfig | null {
        const pagination = this.config?.hasPagination;
        return typeof pagination === "object" && pagination !== null
            ? pagination
            : null;
    }

    getCellValue(
        row: Record<string, string | number>,
        colName: string,
    ): string {
        const value = row[colName];
        return value != null ? String(value) : "";
    }

    getTruncatedValue(
        row: Record<string, string | number>,
        colName: string,
    ): string {
        const value = this.getCellValue(row, colName);
        return value.length > 25 ? value.slice(0, 25) + "..." : value;
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    ngOnInit(): void {
        /* this.dataSource.filterPredicate = (data, filter: string): boolean => {
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            return Object.values(data).some((value) =>
                value.toString().toLowerCase().includes(filter),
            );
        }; */
        this._updateFilterPredicate();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;

        if (this.config?.hasPagination && this.paginator) {
            this.dataSource.paginator = this.paginator;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["data"] && this.data) {
            this.dataSource.data = this.data;
            this._renderPaginatorAndSort();
            this.isLoading = this.data.length === 0;
        }

        if (changes["config"] && this.config) {
            this._updateFilterPredicate();

            // 👇 Volver a aplicar el filtro actual si existe
            /* const currentFilter = this.dataSource.filter;
            this.dataSource.filter = ""; // forzar re-evaluación
            this.dataSource.filter = currentFilter; */
        }
    }

    truncate(text: string | number | undefined, maxLength = 25): string {
        if (text === undefined || text === null) return "";
        const str = String(text);
        return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
    }

    getTooltipValue(
        row: Record<string, string | number>,
        colName: string,
    ): string {
        const val = this.getCellValue(row, colName);
        console.log("val:", val);
        if (val === undefined || val === null) return "";
        const str = val.toString();
        const tooltip = str.length > 25 ? str : "";
        console.log(`Tooltip para columna ${colName}:`, tooltip);
        return tooltip;
    }

    private _updateFilterPredicate(): void {
        this.dataSource.filterPredicate = (data, filter: string): boolean => {
            const search = filter.trim().toLowerCase();

            // Si el filtro está vacío, mostramos todo (sin filtrar)
            if (!search) {
                return true;
            }

            // Filtrar por columna específica si está definida
            if (
                this.config?.filterByColumn &&
                this.config.filterByColumn !== ""
            ) {
                const value = data[this.config.filterByColumn];
                return value?.toString().toLowerCase().includes(search);
            }

            // Filtrar en todas las columnas configuradas
            return (
                this.config?.columns?.some((col): boolean => {
                    const value = data[col.name];
                    return value?.toString().toLowerCase().includes(search);
                }) ?? false
            );
        };
    }

    private _renderPaginatorAndSort(): void {
        // Uso NgZone.onStable para esperar hasta que Angular termine todos los cambios
        // y asi poder asignar paginator y sort correctamente
        // Esto es necesario para evitar problemas de renderizado en algunos casos
        // otra alternativa como changeDetectorRef.detectChanges() no funciona
        this._ngZone.onStable.pipe(take(1)).subscribe((): void => {
            if (this.paginator) {
                this.dataSource.paginator = this.paginator;
            }
            if (this.sort) {
                this.dataSource.sort = this.sort;
            }
        });
    }
}
