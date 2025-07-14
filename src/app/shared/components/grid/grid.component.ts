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
import { TruncateTooltipDirective } from "../../directives/truncate-tooltip.directive";

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
        TruncateTooltipDirective,
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

    get columnNames(): string[] {
        return this.config?.columns?.map((c): string => c.name) || [];
    }

    /*  get columnsWidth(): string[] {
        return (
            this.config?.columns?.map(
                (c: Column): string => c.width ?? "auto", // o "auto"
            ) ?? []
        );
    } */

    get columnsWidth(): (string | undefined)[] {
        return (
            this.config?.columns?.map(
                (c: Column): string | undefined => c.width,
            ) ?? []
        );
    }

    get paginatorConfig(): PaginationConfig | null {
        const pagination = this.config?.withPagination;
        return typeof pagination === "object" && pagination !== null
            ? pagination
            : null;
    }

    /* getTooltipValue(
        row: Record<string, string | number>,
        colName: string,
    ): string {
        const value = row[colName];
        return value !== undefined && value !== null ? String(value) : "";
    } */

    /* getCellValue(
        // truncar aca
        row: Record<string, string | number>,
        colName: string,
    ): string | number | undefined {
        return row[colName];
    } */

    getCellValue(
        row: Record<string, string | number>,
        colName: string,
    ): string {
        const value = row[colName];
        return value != null ? String(value) : "";
        //return value !== undefined && value !== null ? String(value) : "";
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
        this.dataSource.filterPredicate = (data, filter: string): boolean => {
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            return Object.values(data).some((value) =>
                value.toString().toLowerCase().includes(filter),
            );
        };
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;

        if (this.config?.withPagination && this.paginator) {
            this.dataSource.paginator = this.paginator;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["data"] && this.data) {
            //const truncateDataTo25Characters = this._truncateData(this.data);
            //this.data = truncateDataTo25Characters;
            this.dataSource.data = this.data;
            console.log("data:", this.data);

            // para que funcione correctamente la renderizacion del sort y paginator
            this._renderPaginatorAndSort();
            // Si llegaron datos, ocultamos el skeleton
            this.isLoading = this.data.length === 0;
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
        //console.log("row:", row, "colName:", colName);
        const val = this.getCellValue(row, colName);
        console.log("val:", val);
        if (val === undefined || val === null) return "";
        const str = val.toString();
        const tooltip = str.length > 25 ? str : "";
        console.log(`Tooltip para columna ${colName}:`, tooltip);
        return tooltip;
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

    private _truncateData(
        inputData: Record<string, string | number>[],
    ): Record<string, string | number>[] {
        // si data tiene mas de 25 caracteres, truncamos a 22 y agregamos "..."
        // para que las columnas tengan un ancho fijo maximo de 25 caracteres  y no se desborden
        return inputData.map(
            (
                row: Record<string, string | number>,
            ): Record<string, string | number> => {
                const truncatedRow: Record<string, string | number> = {};

                for (const key in row) {
                    const value: string | number = row[key];

                    if (typeof value === "string" && value.length > 25) {
                        truncatedRow[key] = value.slice(0, 22) + "...";
                    } else {
                        truncatedRow[key] = value;
                    }
                }

                return truncatedRow;
            },
        );
    }
}
