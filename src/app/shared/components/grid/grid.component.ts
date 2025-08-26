// GRID.COMPONENT ACA EL SCROLL INFINITO FUNCIONA BIEN SOLO CON EL DETALLE DE QUE CUANDO CARGA NUEVOS REGISTROS EL SCROLL S EVA HACIA ARRIBA DE TODO
// CUANDO DEBERIA QUEDAR SITUADO SOBRE LOS NUEVOS REGISTROS CARGADOS

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
    ElementRef,
    OnDestroy,
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
export class GridComponent
    implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild("scrollContainer") scrollContainer!: ElementRef; // Referencia al div de scroll

    @Input() config!: GridConfiguration;
    @Input() data: GridData[] = [];
    @Input() isLoading = false;
    @Input() chips: Chip[] = [];
    @Output() pageChange = new EventEmitter<PageEvent>();
    @Output() sortChange = new EventEmitter<Sort>();
    @Output() exportExcel = new EventEmitter<void>();
    @Output() chipRemoved = new EventEmitter<Chip>();
    @Output() createButtonClicked = new EventEmitter<void>();
    @Output() scrolledToEnd = new EventEmitter<void>(); // Nuevo evento para scroll infinito

    dataSource = new MatTableDataSource<GridData>();
    private _ngZone = inject(NgZone);
    private _scrollListener: (() => void) | undefined; // Para almacenar y limpiar el listener

    get columns(): Column[] {
        return this.config?.columns || [];
    }

    get columnNames(): string[] {
        return this.columns.map((c: Column): string => c.name);
    }

    get paginatorConfig(): PaginationConfig | null {
        const pagination = this.config?.hasPagination;
        // Ahora, si pagination es 'false' (boolean), esto no entrará en el 'typeof object'
        // Pero si config.hasInfiniteScroll es true, createDefaultGridConfiguration asegurará que hasPagination sea un objeto.
        return typeof pagination === "object" && pagination !== null
            ? pagination
            : null;
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log("GridComponent ngOnChanges", changes);
        if (changes["data"]) {
            this.dataSource.data = this.data;
            if (!this.config.hasInfiniteScroll) {
                // Para asegurar que cuando no es scroll infinito el scroll quede siempre arriba de todo
                // al cambiar de pagina.
                this.scrollContainer.nativeElement.scrollTop = 0;
                this._updatePaginatorForClientSide();
            }
        }

        if (changes["config"]) {
            this._updateFilterPredicate();
            this._updatePaginatorAndSortConfig(changes["config"].currentValue);
            if (this.config.hasInfiniteScroll) {
                this._setupScrollListener(); // Re-evaluar el listener de scroll
            }
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
            if (!this.config.hasInfiniteScroll) {
                this._setupPaginator();
            }
            this._setupScrollListener(); // Configura el listener de scroll aquí
        });
    }

    ngOnDestroy(): void {
        console.log("GridComponent ngOnDestroy - Removing scroll listener");
        if (
            this.scrollContainer &&
            this.scrollContainer.nativeElement &&
            this._scrollListener
        ) {
            this.scrollContainer.nativeElement.removeEventListener(
                "scroll",
                this._scrollListener,
            );
        }
    }

    getCellValue(row: GridData, colName: string): string {
        const value = row[colName];
        if (colName === "elipsisActions" && Array.isArray(value)) {
            return "";
        }
        return value != null ? String(value) : "";
    }

    getTruncatedValue(row: GridData, colName: string): string {
        const value = this.getCellValue(row, colName);
        return this._truncate(value, 25);
    }

    getLargeTooltipValue(row: GridData, colName: string): string {
        const val = this.getCellValue(row, colName);
        const str = String(val ?? "");
        return str.length > 25 ? str : "";
    }

    getTooltipValue(row: GridData, colName: string): string {
        const val = this.getCellValue(row, colName);
        const str = String(val ?? "");
        return str;
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

    private _truncate(
        text: string | number | undefined | null,
        maxLength = 25,
    ): string {
        if (text === undefined || text === null) return "";
        const str = String(text);
        return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
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
            return;
        }
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
        if (
            this.paginator &&
            !newConfig.hasInfiniteScroll &&
            this.paginatorConfig?.isServerSide
        ) {
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
        if (this.paginator) {
            if (
                this.paginator.length !== length ||
                this.paginator.pageIndex !== pageIndex ||
                this.paginator.pageSize !== pageSize
            ) {
                this.paginator.length = length;
                this.paginator.pageIndex = pageIndex;
                this.paginator.pageSize = pageSize;
                if (this.paginator._changePageSize) {
                    this.paginator._changePageSize(this.paginator.pageSize);
                }
            }
        }
    }

    private _updateFilterPredicate(): void {
        this.dataSource.filterPredicate = (data, filter: string): boolean => {
            const search = filter.trim().toLowerCase();
            if (!search) {
                return true;
            }

            if (this.config?.filterByColumn) {
                const value = data[this.config.filterByColumn];
                const stringValue = value?.toString() || "";
                return stringValue.toLowerCase().includes(search);
            }

            return this.columns.some((col: Column): boolean => {
                const value = data[col.name];
                const stringValue = value?.toString() || "";
                return stringValue.toLowerCase().includes(search);
            });
        };
    }

    private _setupScrollListener(): void {
        // Limpiar cualquier listener previo para evitar duplicados
        if (
            this._scrollListener &&
            this.scrollContainer &&
            this.scrollContainer.nativeElement
        ) {
            this.scrollContainer.nativeElement.removeEventListener(
                "scroll",
                this._scrollListener,
            );
            this._scrollListener = undefined;
        }

        // Verifica si config.hasInfiniteScroll es true y si scrollContainer está disponible
        if (this.config?.hasInfiniteScroll && this.scrollContainer) {
            const nativeElement = this.scrollContainer.nativeElement;
            this._scrollListener = this._ngZone.runOutsideAngular(() => {
                return () => this._onScroll();
            });
            nativeElement.addEventListener("scroll", this._scrollListener);
        }
    }

    private _onScroll(): void {
        if (!this.config?.hasInfiniteScroll || this.isLoading) {
            return;
        }

        const element = this.scrollContainer.nativeElement;
        const scrollHeight = element.scrollHeight;
        const scrollTop = element.scrollTop;
        const clientHeight = element.clientHeight;
        // const scrollThreshold es el valor que define cuán cerca del final de la grilla debe estar el scroll para que se emita el evento scrolledToEnd y se cargue la siguiente tanda de datos.
        const scrollThreshold = 50;

        if (scrollTop + clientHeight >= scrollHeight - scrollThreshold) {
            const totalCount = this.paginatorConfig?.totalCount ?? 0;

            if (this.data.length < totalCount) {
                this._ngZone.run(() => {
                    this.scrolledToEnd.emit();
                });
            }
        }
    }
}
