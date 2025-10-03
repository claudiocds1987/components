import {
    Component,
    ViewChild,
    AfterViewInit,
    OnInit,
    inject,
    NgZone,
    ChangeDetectionStrategy,
    Output,
    EventEmitter,
    ElementRef,
    OnDestroy,
    input,
    computed,
    effect,
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
import { Chip, ChipsComponent } from "../chips/chips.component";
import { FeedbackComponent } from "../feedback/feedback.component";

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
export class GridComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("scrollContainer") scrollContainer!: ElementRef;
    // inputs signal
    gridConfigSig = input.required<GridConfiguration>();
    gridDataSig = input.required<GridData[]>();
    isLoadingSig = input.required<boolean>();
    chipsSig = input<Chip[]>([]);

    @Output() pageChange = new EventEmitter<PageEvent>();
    @Output() sortChange = new EventEmitter<Sort>();
    @Output() exportExcel = new EventEmitter<Sort | void>();
    @Output() exportExcelClientSide = new EventEmitter<GridData[]>();
    @Output() chipRemoved = new EventEmitter<Chip>();
    @Output() createButtonClicked = new EventEmitter<void>();
    @Output() infiniteScroll = new EventEmitter<void>();
    @Output() rowDblClick = new EventEmitter<GridData>();
    // "computed" signals para manipular la data de los input signal
    dataSource = new MatTableDataSource<GridData>();
    // Aca extrae y devuelve la lista de columnas de la configuración (reactivo).
    columns = computed<Column[]>((): Column[] => {
        return this.gridConfigSig().columns || [];
    });
    // Aca convierte la lista de columnas en un array de solo los nombres (necesario para MatTable).
    columnNames = computed<string[]>((): string[] => {
        return this.columns().map((c: Column): string => c.name);
    });
    // Aca extrae y valida la configuración de paginación (reactivo).
    paginatorConfig = computed<PaginationConfig | null>(
        (): PaginationConfig | null => {
            const paginator = this.gridConfigSig().paginator;
            return typeof paginator === "object" && paginator !== null
                ? paginator
                : null;
        },
    );

    private _ngZone = inject(NgZone);
    private _scrollListener: (() => void) | undefined;
    @ViewChild(MatSort) private _matSort!: MatSort;
    @ViewChild(MatPaginator) private _matPaginator!: MatPaginator;

    constructor() {
        // Inicialización del Effect para leer cambios en signal data:
        effect((): void => {
            // 1. Leer el valor de la signal 'data'
            const newData = this.gridDataSig();
            // Si hay datos o array vacío, actualiza la MatTable
            if (newData && newData.length >= 0) {
                this.dataSource.data = newData;
                this._applySortAndPaginator();
            }
        });
    }

    ngOnInit(): void {
        this._setupSearchFilter();
        this._setSortingAccessor();
    }

    ngAfterViewInit(): void {
        if (this.gridConfigSig().hasInfiniteScroll) {
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

    // funcion que devuelve ej: "Mostrando 50 de 200" solo para paginador de grilla infinita
    public getInfinitePaginatorData(
        page: number,
        pageSize: number,
        length: number,
    ): string {
        if (length === 0) {
            return "Mostrando 0 de 0";
        }
        const loadedCount = page * pageSize + pageSize;
        return `Mostrando ${Math.min(loadedCount, length)} de ${length}`;
    }

    showFeeback(): boolean {
        return (
            this.dataSource.data.length === 0 ||
            this.dataSource.filteredData.length === 0
        );
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

    onInputSearch(event: Event): void {
        // las reglas de como filtrar se establecieron en _setupSearchFilter()
        const filterValue = (event.target as HTMLInputElement).value;
        const filterText = filterValue.trim().toLowerCase();
        // Actualiza la grilla con el nuevo filtro
        this.dataSource.filter = filterText;
    }

    onRowDblClick(row: GridData): void {
        this.rowDblClick.emit(row);
    }

    onPaginatorPageChange(event: PageEvent): void {
        this.pageChange.emit(event);
    }

    onSortChange(sortState: Sort): void {
        if (this.gridConfigSig().hasSorting?.isServerSide) {
            // Uso de gridConfig()
            this.sortChange.emit(sortState);
            // Mueve el scroll al principio de la tabla al hacer el ordenamiento
            if (this.scrollContainer && this.scrollContainer.nativeElement) {
                this.scrollContainer.nativeElement.scrollTop = 0;
            }
        }
    }

    trackColumnByName(index: number, column: Column): string {
        return column.name;
    }

    create(): void {
        this.createButtonClicked.emit();
    }

    exportToExcel(): void {
        const isServerSideSort = this.gridConfigSig().hasSorting?.isServerSide;

        if (isServerSideSort) {
            this.exportExcel.emit();
            return;
        }

        let dataReadyForExport: GridData[] = this.dataSource.filteredData;

        if (this._matSort) {
            dataReadyForExport = this._getSortedData(
                dataReadyForExport,
                this._matSort,
            );
        }
        this.exportExcelClientSide.emit(dataReadyForExport);
    }

    onChipRemoved(chip: Chip): void {
        this.chipRemoved.emit(chip);
    }

    // Función que ordena la data para exportar excel si se aplica mat-sort (solo para lado cliente)
    private _getSortedData(data: GridData[], sort: MatSort): GridData[] {
        if (!data || !sort.active || sort.direction === "") {
            return data;
        }

        return [...data].sort((a: GridData, b: GridData): number => {
            const isAsc = sort.direction === "asc";
            const accessor = this.dataSource.sortingDataAccessor;
            const valueA = accessor(a, sort.active);
            const valueB = accessor(b, sort.active);

            let comparison = 0; // Inicializamos la comparación a 0 (iguales)

            if (typeof valueA === "string" && typeof valueB === "string") {
                // 1. Caso de cadenas: con localeCompare Obtenemos el resultado orden alfabetico (caracteres acentuados, ñ)
                comparison = valueA.localeCompare(valueB);
            } else {
                // 2. Caso numérico/otros: Solo actualizamos 'comparison' si son diferentes.
                if (valueA < valueB) {
                    comparison = -1;
                } else if (valueA > valueB) {
                    comparison = 1;
                }
                // Si son iguales, 'comparison' se mantiene en 0.
            }
            // 3. Aplicamos la dirección
            return comparison * (isAsc ? 1 : -1);
        });
    }

    // Funcion  callback que MatTableDataSource utiliza para obtener el valor de una celda antes de ordenarla.
    // Permite ordenar bien las fechas con el matSort cuando la data es lado cliente.
    // Tambien al manejarla lado cliente va a poder ordenar las columnas puesto y pais por descripcion.
    private _setSortingAccessor(): void {
        this.dataSource.sortingDataAccessor = (
            item: GridData,
            sortHeaderId: string,
        ): string | number => {
            // Se usa this.columns()
            const column = this.columns().find(
                (c): boolean => c.name === sortHeaderId,
            );
            // ... Resto de la lógica
            const value = item[sortHeaderId];
            if (column?.type === "date" && value) {
                const dateString = value as string;
                const parts = dateString.split("/");
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }

            if (typeof value === "boolean") {
                return value ? 1 : 0;
            }

            if (typeof value === "string" || typeof value === "number") {
                return value;
            }

            return "";
        };
    }

    // Este método asegura que las referencias se establezcan solo cuando están disponibles
    private _applySortAndPaginator(): void {
        // Se usa this.gridConfig() y this.paginatorConfig()
        const isServerSideSort = this.gridConfigSig().hasSorting?.isServerSide;
        const paginatorConfig = this.gridConfigSig().paginator;

        const isClientSidePaginator =
            paginatorConfig.isServerSide === false ||
            (typeof paginatorConfig === "object" &&
                !paginatorConfig.isServerSide);

        // ... Resto de la lógica
        if (!this._matSort || !this._matPaginator) {
            return;
        }

        if (!isServerSideSort) {
            this.dataSource.sort = this._matSort;
        } else {
            this.dataSource.sort = null;
        }

        if (isClientSidePaginator) {
            this.dataSource.paginator = this._matPaginator;
        } else {
            this.dataSource.paginator = null;
        }
    }

    // _setupSearchFilter() establece las reglas que la tabla va a usar para filtrar cada vez que el usuario escriba en el input search.
    private _setupSearchFilter(): void {
        this.dataSource.filterPredicate = (data, filter: string): boolean => {
            const search = filter.trim().toLowerCase();
            // Si el input está vacío, muestra todas las filas.
            if (!search) {
                return true;
            }
            // 1. OBTENER LA CONFIGURACIÓN COMO UNA CONSTANTE para mayor legibilidad
            const config = this.gridConfigSig();
            // 2. CHEQUEO ESTRICTO DEL TIPO DE filterByColumn
            // Se asegura de que filterByColumn existe y es una string (o el tipo esperado)
            const filterKey = config.filterByColumn;

            if (filterKey) {
                // Aca el nombre de la columna que viene en la configuración.
                // USAR EL VALOR YA CHEQUEADO para indexar 'data'
                const value = data[filterKey];
                const stringValue = value?.toString() || "";
                return stringValue.toLowerCase().includes(search);
            }
            // Si no se especifica una columna, busca en todas las columnas.
            // Se usa this.columns() para acceder a la computed signal.
            return this.columns().some((col: Column): boolean => {
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

        if (this.gridConfigSig().hasInfiniteScroll && this.scrollContainer) {
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
        if (!this.gridConfigSig().hasInfiniteScroll || this.isLoadingSig()) {
            return;
        }

        const element = this.scrollContainer.nativeElement;
        const scrollHeight = element.scrollHeight;
        const scrollTop = element.scrollTop;
        const clientHeight = element.clientHeight;
        const scrollThreshold = 50;

        if (scrollTop + clientHeight >= scrollHeight - scrollThreshold) {
            const totalCount = this.paginatorConfig()?.totalCount ?? 0;
            if (this.gridDataSig().length < totalCount) {
                this._ngZone.run((): void => {
                    this.infiniteScroll.emit();
                });
            }
        }
    }
}
