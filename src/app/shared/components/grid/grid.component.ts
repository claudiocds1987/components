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
} from "../../models/grid-configuration.model";
import {
    MatPaginator,
    MatPaginatorIntl,
    MatPaginatorModule,
    PageEvent,
} from "@angular/material/paginator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

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

/************************************************************************************************* 
El GridComponent es un componente genérico de tabla que puede funcionar en dos modos:
    1. Modo Cliente: La grilla gestiona la paginación, el ordenamiento y el filtrado localmente.
    2. Modo Servidor: La grilla delega la paginación y el ordenamiento al backend, y solo se encarga 
    de emitir eventos de cambio para que el componente padre los gestione.
El comportamiento se define a través del objeto @Input() config.
 **************************************************************************************************/
export class GridComponent
    implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
    @ViewChild("scrollContainer") scrollContainer!: ElementRef;

    @Input() gridConfig!: GridConfiguration;
    @Input() data: GridData[] = [];
    @Input() isLoading = false;
    @Input() chips: Chip[] = [];
    @Output() pageChange = new EventEmitter<PageEvent>();
    @Output() sortChange = new EventEmitter<Sort>();
    @Output() exportExcel = new EventEmitter<Sort | void>();
    @Output() chipRemoved = new EventEmitter<Chip>();
    @Output() createButtonClicked = new EventEmitter<void>();
    @Output() infiniteScroll = new EventEmitter<void>();

    dataSource = new MatTableDataSource<GridData>();
    private _ngZone = inject(NgZone);
    private _scrollListener: (() => void) | undefined;
    @ViewChild(MatSort) private _matSort!: MatSort;
    @ViewChild(MatPaginator) private _matPaginator!: MatPaginator;

    get columns(): Column[] {
        return this.gridConfig?.columns || [];
    }

    get columnNames(): string[] {
        return this.columns.map((c: Column): string => c.name);
    }

    get paginatorConfig(): PaginationConfig | null {
        const paginator = this.gridConfig?.hasPaginator;
        return typeof paginator === "object" && paginator !== null
            ? paginator
            : null;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["data"] && this.data) {
            this.dataSource.data = this.data;
            this._applySortAndPaginator();
        }
    }

    ngOnInit(): void {
        this._updateFilterPredicate();
    }

    ngAfterViewInit(): void {
        if (this.gridConfig?.hasInfiniteScroll) {
            console.log("grid config: ", this.gridConfig);
            this._setupScrollListener();
        }
    }

    ngOnDestroy(): void {
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
        return this._truncate(value, 20);
    }

    getLargeTooltipValue(row: GridData, colName: string): string {
        const val = this.getCellValue(row, colName);
        const str = String(val ?? "");
        return str.length > 20 ? str : "";
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
        // 2. Verificar si el sort es del lado del cliente o del servidor
        const isServerSideSort = this.gridConfig?.hasSorting?.isServerSide;

        if (isServerSideSort) {
            // Si el sort es del lado del servidor, simplemente emite void.
            // El componente padre ya tiene el estado del sort en sus filtros.
            this.exportExcel.emit();
        } else {
            // Si el sort es del lado del cliente, emite el estado actual del MatSort.
            // Esto le permite al componente padre obtener el ordenamiento actual
            // para aplicarlo a la descarga de datos.
            if (this._matSort) {
                this.exportExcel.emit(this._matSort);
            } else {
                // Emite void si MatSort no está disponible
                this.exportExcel.emit();
            }
        }
    }

    onChipRemoved(chip: Chip): void {
        this.chipRemoved.emit(chip);
    }

    // Este método asegura que las referencias se establezcan solo cuando están disponibles
    private _applySortAndPaginator(): void {
        const isServerSideSort = this.gridConfig?.hasSorting?.isServerSide;
        const paginatorConfig = this.gridConfig?.hasPaginator;
        const isClientSidePaginator =
            paginatorConfig === false ||
            (typeof paginatorConfig === "object" &&
                !paginatorConfig.isServerSide);

        // Si la grilla no está visible, las referencias no existen,
        // por lo que no hacemos nada.
        if (!this._matSort || !this._matPaginator) {
            return;
        }
        // Si el ordenamiento es del lado del cliente, se vincula el MatSort.
        // En caso contrario, se deja a la directiva matSort manejar el estado visual.
        if (!isServerSideSort) {
            this.dataSource.sort = this._matSort;
        } else {
            // Se desvincula la fuente de datos del sort local,
            // pero MatSort en el HTML seguirá funcionando.
            this.dataSource.sort = null;
        }
        // Si la paginación es del lado del cliente, se vincula el MatPaginator.
        if (isClientSidePaginator) {
            this.dataSource.paginator = this._matPaginator;
        } else {
            this.dataSource.paginator = null;
        }
    }

    private _updateFilterPredicate(): void {
        this.dataSource.filterPredicate = (data, filter: string): boolean => {
            const search = filter.trim().toLowerCase();
            if (!search) {
                return true;
            }
            if (this.gridConfig?.filterByColumn) {
                const value = data[this.gridConfig.filterByColumn];
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

    private _truncate(
        text: string | number | undefined | null,
        maxLength = 25,
    ): string {
        if (text === undefined || text === null) return "";
        const str = String(text);
        return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
    }

    private _setupScrollListener(): void {
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

        if (this.gridConfig?.hasInfiniteScroll && this.scrollContainer) {
            const nativeElement = this.scrollContainer.nativeElement;
            this._scrollListener = this._ngZone.runOutsideAngular(
                (): (() => void) => {
                    return (): void => this._onScroll();
                },
            );
            nativeElement.addEventListener("scroll", this._scrollListener);
        }
    }

    private _onScroll(): void {
        if (!this.gridConfig?.hasInfiniteScroll || this.isLoading) {
            return;
        }

        const element = this.scrollContainer.nativeElement;
        const scrollHeight = element.scrollHeight;
        const scrollTop = element.scrollTop;
        const clientHeight = element.clientHeight;
        // "scrollThreshold" es el valor que define que tan cerca del final de la grilla debe estar el scroll para que se emita el evento infiniteScroll y se cargue la siguiente tanda de datos.
        const scrollThreshold = 50;

        if (scrollTop + clientHeight >= scrollHeight - scrollThreshold) {
            const totalCount = this.paginatorConfig?.totalCount ?? 0;
            if (this.data.length < totalCount) {
                this._ngZone.run((): void => {
                    this.infiniteScroll.emit();
                });
            }
        }
    }
}
