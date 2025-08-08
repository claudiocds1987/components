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
    Column,
    GridConfiguration,
    GridData,
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

import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { Chip, ChipsComponent } from "../chips/chips/chips.component";
import { FeedbackComponent } from "../feedback/feedback/feedback.component";

// --- función para el setear paginador ---
export function getPaginatorIntl(): MatPaginatorIntl {
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
}

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
        MatMenuModule,
        MatIconModule,
        MatButtonModule,
        ChipsComponent,
        FeedbackComponent,
    ],
    templateUrl: "./grid.component.html",
    styleUrl: "./grid.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: MatPaginatorIntl,
            useFactory: getPaginatorIntl,
        },
    ],
})
export class GridComponent implements OnInit, AfterViewInit, OnChanges {
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    @Input() config!: GridConfiguration;
    @Input() data: GridData[] = [];
    @Input() isLoading = false;
    @Input() chips: Chip[] = [];
    @Output() pageChange = new EventEmitter<PageEvent>();
    @Output() sortChange = new EventEmitter<Sort>();
    @Output() exportExcel = new EventEmitter<void>();
    @Output() chipRemoved = new EventEmitter<Chip>();
    @Output() createButtonClicked = new EventEmitter<void>();

    dataSource = new MatTableDataSource<GridData>();
    private _ngZone = inject(NgZone);

    get columns(): Column[] {
        return this.config?.columns || [];
    }

    get columnNames(): string[] {
        return this.columns.map((c: Column): string => c.name);
    }

    get paginatorConfig(): PaginationConfig | null {
        const pagination = this.config?.hasPagination;
        return typeof pagination === "object" && pagination !== null
            ? pagination
            : null;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["data"]) {
            this.dataSource.data = this.data;
            this._updatePaginatorForClientSide();
        }

        if (changes["config"]) {
            this._updateFilterPredicate();
            this._updatePaginatorAndSortConfig(changes["config"].currentValue);
        }

        if (changes["isLoading"]) {
            this.isLoading = changes["isLoading"].currentValue;
        }
    }

    ngOnInit(): void {
        this._updateFilterPredicate();
    }

    ngAfterViewInit(): void {
        this._ngZone.onStable.pipe(take(1)).subscribe((): void => {
            this._setupSorting();
            this._setupPaginator();
        });
    }

    getCellValue(row: GridData, colName: string): string {
        const value = row[colName];
        // Si la columna es la de elipsis, no intentamos convertir el array de acciones a string
        if (colName === "elipsisActions" && Array.isArray(value)) {
            return ""; // La celda de elipsis se renderiza con el botón, no con el texto del array
        }
        return value != null ? String(value) : "";
    }

    getTruncatedValue(row: GridData, colName: string): string {
        const value = this.getCellValue(row, colName);
        return this.truncate(value, 25);
    }

    getTooltipValue(row: GridData, colName: string): string {
        const val = this.getCellValue(row, colName);
        const str = String(val ?? "");
        return str.length > 25 ? str : "";
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

    truncate(text: string | number | undefined | null, maxLength = 25): string {
        if (text === undefined || text === null) return "";
        const str = String(text);
        return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
    }

    trackColumnByName(index: number, column: Column): string {
        return column.name;
    }

    create(): void {
        this.createButtonClicked.emit();
    }

    exportToExcel(): void {
        this.exportExcel.emit();
    }

    onChipRemoved(chip: Chip): void {
        this.chipRemoved.emit(chip);
    }

    private _setupSorting(): void {
        if (!this.sort) {
            return;
        }

        if (!this.config?.hasSorting?.isServerSide) {
            this.dataSource.sort = this.sort;
            this.sort.sortChange.subscribe((): void => {
                this.dataSource.data = this.dataSource.sortData(
                    this.dataSource.data,
                    this.sort,
                );
            });
        }
    }

    private _setupPaginator(): void {
        if (!this.paginator) {
            console.warn("GridComponent: MatPaginator no encontrado.");
            return;
        }

        // Configuración inicial del paginador
        if (!this.paginatorConfig?.isServerSide) {
            this.dataSource.paginator = this.paginator;
        } else {
            this._updatePaginatorProperties(
                this.paginatorConfig.totalCount ?? 0,
                this.paginatorConfig.pageIndex ?? 0,
                this.paginatorConfig.pageSize ?? 25,
            );
        }
    }

    private _updatePaginatorForClientSide(): void {
        if (
            this.paginatorConfig &&
            !this.paginatorConfig.isServerSide &&
            this.paginator
        ) {
            this.paginator.length = this.data.length;
        }
    }

    private _updatePaginatorAndSortConfig(newConfig: GridConfiguration): void {
        if (this.paginatorConfig?.isServerSide && this.paginator) {
            const newTotalCount =
                newConfig.hasPagination &&
                typeof newConfig.hasPagination === "object"
                    ? (newConfig.hasPagination.totalCount ?? 0)
                    : 0;
            const newPageIndex =
                newConfig.hasPagination &&
                typeof newConfig.hasPagination === "object"
                    ? (newConfig.hasPagination.pageIndex ?? 0)
                    : 0;
            const newPageSize =
                newConfig.hasPagination &&
                typeof newConfig.hasPagination === "object"
                    ? (newConfig.hasPagination.pageSize ?? 25)
                    : 25;

            this._updatePaginatorProperties(
                newTotalCount,
                newPageIndex,
                newPageSize,
            );
        }

        // Actualizar estado visual del sort en cambios de config (solo para server-side)
        if (this.sort && newConfig.hasSorting?.isServerSide) {
            if (newConfig.OrderBy) {
                this.sort.active = newConfig.OrderBy.columnName;
                this.sort.direction = newConfig.OrderBy.direction;
            }
        }
    }

    private _updatePaginatorProperties(
        length: number,
        pageIndex: number,
        pageSize: number,
    ): void {
        // Evita actualizaciones si los valores no han cambiado para prevenir bucles o renderizados innecesarios.
        if (
            this.paginator.length !== length ||
            this.paginator.pageIndex !== pageIndex ||
            this.paginator.pageSize !== pageSize
        ) {
            this.paginator.length = length;
            this.paginator.pageIndex = pageIndex;
            this.paginator.pageSize = pageSize;
            this.paginator._changePageSize(this.paginator.pageSize); // Forzar actualización visual
        }
    }

    private _updateFilterPredicate(): void {
        this.dataSource.filterPredicate = (data, filter: string): boolean => {
            const search = filter.trim().toLowerCase();
            if (!search) {
                return true;
            }

            if (this.config?.filterByColumn) {
                // Si hay una columna específica para filtrar
                const value = data[this.config.filterByColumn];
                const stringValue = value?.toString() || "";
                return stringValue.toLowerCase().includes(search);
            }

            // Si no hay columna específica, buscar en todas las columnas sortables (o relevantes)
            return this.columns.some((col: Column): boolean => {
                const value = data[col.name];
                const stringValue = value?.toString() || "";
                return stringValue.toLowerCase().includes(search);
            });
        };
    }
}
