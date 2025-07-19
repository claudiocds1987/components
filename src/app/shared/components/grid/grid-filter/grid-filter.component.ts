import { Component, EventEmitter, Input, Output } from "@angular/core";
import { GridFilterConfig } from "../../../models/grid-filter-config.model";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
// Angular Material Modules
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule, MatOptionModule } from "@angular/material/core"; // Necesario para mat-datepicker
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatSelectModule } from "@angular/material/select";
import { NgSelectModule } from "@ng-select/ng-select";

@Component({
    selector: "app-grid-filter",
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatFormFieldModule,
        MatExpansionModule,
        MatSelectModule,
        MatOptionModule,
        NgSelectModule,
    ],
    templateUrl: "./grid-filter.component.html",
    styleUrl: "./grid-filter.component.scss",
})
export class GridFilterComponent {
    @Input() config!: GridFilterConfig[]; // Recibe el array completo de configuraciones
    @Input() filterForm!: FormGroup; // Recibe el FormGroup completo desde el padre
    @Output() filterApplied = new EventEmitter<any>(); // Opcional: para emitir el evento al padre

    constructor() {
        console.log(
            "configuracion filtro en GridFilterComponent:",
            this.config,
        );
    }

    applyFilter(): void {
        if (this.filterForm.valid) {
            const filterValues = this.filterForm.value;
            console.log(
                "Filter values applied from GridFilterComponent:",
                filterValues,
            );
            this.filterApplied.emit(filterValues); // Emitir los valores al padre
        } else {
            console.warn("Filter form is invalid");
        }
    }
}
