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
    ChangeDetectorRef,
} from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
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
        NgOptimizedImage,
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
    @ViewChild("scrollContainer", { static: false })
    scrollContainer!: ElementRef;
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
    // "computed signal" para transformar o hacer algun calculo en los signal
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

    private _shouldScrollAfterAppend = false; // Bandera para saber si debe bajar el scroll tras append ("append" seria agregar algo al final)
    // Variable para guardar la cantidad de filas antes del append
    private _previousDataLength = 0;
    private readonly ROW_HEIGHT_PIXELS = 40; // Altura de cada fila configurable (ej. 40px) Basado en el cálculo: scrollTop = scrollHeight - clientHeight - (nuevasFilas * altoFila)
    private _changeDetectorRef = inject(ChangeDetectorRef);

    constructor() {
        // Inicialización del Effect para leer cambios en signal data y loading:
        effect((): void => {
            const newData = this.gridDataSig();
            const previousLength = this._previousDataLength;
            this.isLoadingSig(); // trigger effect on loading change
            // Si hay datos o array vacío, actualiza la MatTable
            if (newData && newData.length >= 0) {
                this.dataSource.data = newData;
                this._applySortAndPaginator();
                // Retrasar la sincronización. CRÍTICO para que MatTable termine su proceso.
                setTimeout(() => {
                    this._syncMatSortState();
                }, 0);
            }
            // Si la bandera está activa, baja el scroll tras el append
            setTimeout((): void => {
                if (
                    this.gridConfigSig().hasInfiniteScroll &&
                    this.scrollContainer
                ) {
                    const el = this.scrollContainer.nativeElement;
                    if (
                        el &&
                        this._shouldScrollAfterAppend &&
                        newData.length > previousLength
                    ) {
                        const newRowsCount = newData.length - previousLength; // Calcula el número de filas nuevas agregadas
                        // Calcula la altura total de las nuevas filas agregadas Se usa la altura de fila configurable
                        const newRowsHeight =
                            newRowsCount * this.ROW_HEIGHT_PIXELS;
                        // "newScroll" calcula el nuevo scrollTop. La fórmula busca posicionar el scroll
                        // en una posicion donde  el usuario pueda ver algunos de los anteriores y los nuevos registros cargados
                        // nuevoScroll = (el.scrollHeight - el.clientHeight) - newRowsHeight
                        // El término (el.scrollHeight - el.clientHeight) es el máximo scroll posible.
                        // Al restarle newRowsHeight, ajustamos el scroll hacia arriba lo suficiente
                        // para que la primera de las nuevas filas quede en la parte superior.
                        const newScroll = Math.max(
                            0,
                            el.scrollHeight - el.clientHeight - newRowsHeight,
                        );
                        // setTimeout para asegurar que el DOM esté actualizado
                        setTimeout((): void => {
                            el.scrollTop = newScroll;
                            this._shouldScrollAfterAppend = false;
                            // Actualiza la longitud de la data para el próximo cálculo
                            this._previousDataLength = newData.length;
                        }, 0);
                    } else if (!this._shouldScrollAfterAppend) {
                        // Si no hubo append, solo actualiza la longitud para futuros appends
                        this._previousDataLength = newData.length;
                    }
                    this._setupScrollListener();
                }
            });
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
            !this.isLoadingSig() &&
            (this.gridDataSig().length === 0 ||
                this.dataSource.filteredData.length === 0)
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
        const paginatorConfig = this.gridConfigSig().paginator;
        this.pageChange.emit(event);
        // cuando el paginador es lado cliente al cambiar de pagina se envia el scroll arriba de todo
        if (!paginatorConfig.isServerSide) {
            // Asegura que el contenedor de scroll exista.
            if (this.scrollContainer && this.scrollContainer.nativeElement) {
                // Restablece el scroll a la posición superior (0)
                this.scrollContainer.nativeElement.scrollTop = 0;
            }
        }
    }

    onSortChange(sortState: Sort): void {
        if (this.gridConfigSig().hasSorting?.isServerSide) {
            console.log(
                "Sort emitido:",
                sortState.active,
                "Dirección:",
                sortState.direction,
            );
            this.sortChange.emit(sortState);

            if (this.scrollContainer && this.scrollContainer.nativeElement) {
                this.scrollContainer.nativeElement.scrollTop = 0; // Mueve el scroll al principio de la tabla al hacer el ordenamiento
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

    // grid.component.ts

    private _syncMatSortState(): void {
        const isServerSideSort = this.gridConfigSig().hasSorting?.isServerSide;
        const orderByConfig = this.gridConfigSig().OrderBy;

        if (isServerSideSort && this._matSort && orderByConfig) {
            const columnName = orderByConfig.columnName;
            const direction = (orderByConfig.direction || "") as
                | "asc"
                | "desc"
                | "";

            // Si el estado ya es correcto, no hacemos nada (esto previene redibujos innecesarios).
            if (
                this._matSort.active === columnName &&
                this._matSort.direction === direction
            ) {
                return;
            }

            // =======================================================
            // PASO 1: Establecer las propiedades de MatSort
            this._matSort.active = columnName;
            this._matSort.direction = direction;

            // =======================================================
            // PASO 2: Forzar el redibujo interno sin emitir un evento externo (sortChange)
            // 🚨 Advertencia: 'as any' es necesario porque _stateChanges es una propiedad
            // marcada como privada. Esta es la forma más efectiva de forzar el redibujo
            // de MatSort sin generar un ciclo.
            const matSortInstance = this._matSort as any;

            if (matSortInstance._stateChanges) {
                // Esto le dice a la directiva MatSortHeader que recalcule y dibuje la flecha.
                matSortInstance._stateChanges.next();
            } else {
                // Fallback si _stateChanges no existe (versión muy antigua de Angular Material).
                this._changeDetectorRef.detectChanges();
            }
        }
    }

    /* private _syncMatSortState(): void {
        const isServerSideSort = this.gridConfigSig().hasSorting?.isServerSide;
        const orderByConfig = this.gridConfigSig().OrderBy;

        // Solo sincronizamos el estado visual si es ordenamiento del lado del servidor
        if (isServerSideSort && this._matSort && orderByConfig) {
            const direction = (orderByConfig.direction || "") as
                | "asc"
                | "desc"
                | "";

            this._matSort.active = orderByConfig.columnName;
            this._matSort.direction = direction;
            this._changeDetectorRef.detectChanges();
        }
    } */

    // Funcion  callback que MatTableDataSource utiliza para obtener el valor de una celda antes de ordenarla.
    // Permite ordenar bien las fechas con el matSort cuando la data es lado cliente.
    // Tambien al manejarla lado cliente va a poder ordenar las columnas puesto y pais por descripcion.
    private _setSortingAccessor(): void {
        this.dataSource.sortingDataAccessor = (
            item: GridData,
            sortHeaderId: string,
        ): string | number => {
            const column = this.columns().find(
                (c): boolean => c.name === sortHeaderId,
            );
            const value = item[sortHeaderId];
            // Manejo para columnas de fecha
            if (column?.type === "date" && value) {
                const dateString = value as string;
                const parts = dateString.split("/");
                // Retorna un formato ISO (YYYY-MM-DD) para una correcta comparación de fechas
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            // Manejo para columnas cuyo valor es booleano
            if (typeof value === "boolean") {
                return value ? 1 : 0;
            }
            // Manejo por defecto para cadenas y números
            if (typeof value === "string" || typeof value === "number") {
                return value;
            }

            return "";
        };
    }

    // Este método asegura que las referencias se establezcan solo cuando están disponibles
    private _applySortAndPaginator(): void {
        const isServerSideSort = this.gridConfigSig().hasSorting?.isServerSide;
        const paginatorConfig = this.gridConfigSig().paginator;

        const isClientSidePaginator =
            paginatorConfig.isServerSide === false ||
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

    // _setupSearchFilter() establece las reglas que la tabla va a usar para filtrar cada vez que el usuario escriba en el input search.
    private _setupSearchFilter(): void {
        this.dataSource.filterPredicate = (data, filter: string): boolean => {
            const search = filter.trim().toLowerCase();
            // Si el input está vacío, muestra todas las filas.
            if (!search) {
                return true;
            }

            const config = this.gridConfigSig();
            const columnName = config.filterByColumn;

            if (columnName) {
                const value = data[columnName];
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
        const scrollThreshold = 0; // Para que la carga se dispare cuando el usuario arrastra el scroll hasta el final del contenido desplazable.

        if (scrollTop + clientHeight >= scrollHeight - scrollThreshold) {
            const totalCount = this.paginatorConfig()?.totalCount ?? 0;
            if (this.gridDataSig().length < totalCount) {
                this._previousDataLength = this.gridDataSig().length; // ANTES de emitir el evento, se guarda la longitud actual para el cálculo de scroll
                this._shouldScrollAfterAppend = true;
                this._ngZone.run((): void => {
                    this.infiniteScroll.emit();
                });
            }
        }
    }
}
