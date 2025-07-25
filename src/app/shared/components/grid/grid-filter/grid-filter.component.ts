import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatButtonModule } from "@angular/material/button";
// !!! CAMBIO CLAVE: Ajuste la ruta para grid-filter-config.model
// Asumo que 'grid-filter-config.model.ts' está en 'src/app/shared/models/'
import { GridFilterConfig } from "../../../models/grid-filter-config.model";
// !!! IMPORTANTE: Si GridFilterComponent no usa directamente Column o TruncatePipe, ELIMINA estas importaciones.
// Si las usara, la ruta sería algo como:
// import { Column } from '../../../models/gridConfiguration';
// import { TruncatePipe } from '../../pipes/truncate.pipe';

@Component({
    selector: "app-grid-filter",
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
    ],
    templateUrl: "./grid-filter.component.html",
    styleUrls: ["./grid-filter.component.scss"],
})
export class GridFilterComponent {
    @Input() config: GridFilterConfig[] = [];
    @Input() filterForm!: FormGroup;
    @Output() emitFilterApplied = new EventEmitter<unknown>(); // Considerar un tipo más específico para los valores del filtro

    applyFilter(): void {
        this.emitFilterApplied.emit(this.filterForm.value);
    }

    clearFilter(): void {
        this.filterForm.reset();
        this.emitFilterApplied.emit(this.filterForm.value); // Emitir filtro vacío para recargar datos
    }
}
