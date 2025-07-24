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
    ChangeDetectionStrategy,
    Output,
    EventEmitter,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatSort, MatSortModule, Sort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import {
    Column, // Asegúrate de que Column esté importado
    GridConfiguration,
    GridDataItem,
    PaginationConfig,
} from "../../models/gridConfiguration";
import {
    MatPaginator,
    MatPaginatorIntl,
    MatPaginatorModule,
    PageEvent,
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: MatPaginatorIntl,
            useFactory: (): MatPaginatorIntl => {
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
    @Input() data: Record<
        string,
        string | number | boolean | Date | null | undefined
    >[] = [];
    @Input() isLoading = false;
    @Output() pageChange = new EventEmitter<PageEvent>();
    @Output() sortChange = new EventEmitter<Sort>();

    dataSource = new MatTableDataSource<GridDataItem>();
    rows25: number[] = Array.from({ length: 25 });

    private _ngZone = inject(NgZone);

    get columns(): Column[] {
        return this.config?.columns ?? [];
    }

    get columnNames(): string[] {
        // !!! CORRECCIÓN: Tipo explícito para 'c'
        return this.config?.columns?.map((c: Column): string => c.name) || [];
    }

    get paginatorConfig(): PaginationConfig | null {
        const pagination = this.config?.hasPagination;
        return typeof pagination === "object" && pagination !== null
            ? pagination
            : null;
    }

    getCellValue(
        row: Record<string, string | number | Date>,
        colName: string,
    ): string {
        const value = row[colName];
        return value != null ? String(value) : "";
    }

    getTruncatedValue(
        row: Record<string, string | number | Date>,
        colName: string,
    ): string {
        const value = this.getCellValue(row, colName);
        return value.length > 25 ? value.slice(0, 25) + "..." : value;
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    onPaginatorPageChange(event: PageEvent): void {
        this.pageChange.emit(event);
    }

    onSortChange(sortState: Sort): void {
        this.sortChange.emit(sortState);
    }

    ngOnInit(): void {
        this._updateFilterPredicate();
    }

    ngAfterViewInit(): void {
        this._ngZone.onStable.pipe(take(1)).subscribe(() => {
            if (this.sort) {
                this.dataSource.sort = this.sort;

                // !!! CORRECCIÓN: Acceso seguro a hasSorting
                if (!this.config?.hasSorting?.isServerSide) {
                    this.sort.sortChange.subscribe((sortState) => {
                        this.dataSource.data = this.dataSource.sortData(
                            this.dataSource.data,
                            this.sort,
                        );
                    });
                }
            }

            if (this.paginator) {
                if (!this.paginatorConfig?.isServerSide) {
                    this.dataSource.paginator = this.paginator;
                } else {
                    this.paginator.length =
                        this.paginatorConfig.totalCount ?? 0;
                    this.paginator.pageIndex =
                        this.paginatorConfig.pageIndex ?? 0;
                    this.paginator.pageSize =
                        this.paginatorConfig.pageSize ?? 25;
                }
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["data"]) {
            this.dataSource.data = this.data;
            if (
                this.paginatorConfig &&
                !this.paginatorConfig.isServerSide &&
                this.paginator
            ) {
                this.paginator.length = this.data.length;
            }
        }

        if (changes["config"]) {
            this._updateFilterPredicate();
            if (
                this.paginatorConfig &&
                this.paginatorConfig.isServerSide &&
                this.paginator
            ) {
                const newTotalCount = this.paginatorConfig.totalCount ?? 0;
                const newPageIndex = this.paginatorConfig.pageIndex ?? 0;
                const newPageSize = this.paginatorConfig.pageSize ?? 25;

                if (
                    this.paginator.length !== newTotalCount ||
                    this.paginator.pageIndex !== newPageIndex ||
                    this.paginator.pageSize !== newPageSize
                ) {
                    this.paginator.length = newTotalCount;
                    this.paginator.pageIndex = newPageIndex;
                    this.paginator.pageSize = newPageSize;
                    this.paginator._changePageSize(this.paginator.pageSize);
                }
            }
        }

        if (changes["isLoading"]) {
            this.isLoading = changes["isLoading"].currentValue;
        }
    }

    truncate(text: string | number | undefined, maxLength = 25): string {
        if (text === undefined || text === null) return "";
        const str = String(text);
        return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
    }

    getTooltipValue(
        row: Record<string, string | number | Date>,
        colName: string,
    ): string {
        const val = this.getCellValue(row, colName);
        if (val === undefined || val === null) return "";
        const str = val.toString();
        const tooltip = str.length > 25 ? str : "";
        return tooltip;
    }

    trackColumnByName(index: number, column: Column): string {
        return column.name;
    }

    private _updateFilterPredicate(): void {
        this.dataSource.filterPredicate = (data, filter: string): boolean => {
            const search = filter.trim().toLowerCase();
            if (!search) {
                return true;
            }
            if (
                this.config?.filterByColumn &&
                this.config.filterByColumn !== ""
            ) {
                const value = data[this.config.filterByColumn];
                const stringValue = value?.toString() || "";
                return stringValue.toLowerCase().includes(search);
            }
            return (
                // !!! CORRECCIÓN: Tipo explícito para 'col'
                this.config?.columns?.some((col: Column): boolean => {
                    const value = data[col.name];
                    const stringValue = value?.toString() || "";
                    return stringValue.toLowerCase().includes(search);
                }) ?? false
            );
        };
    }
}
