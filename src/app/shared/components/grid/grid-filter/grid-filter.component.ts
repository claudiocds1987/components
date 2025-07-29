import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import {
    MatDatepickerInputEvent,
    MatDatepickerModule,
} from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatButtonModule } from "@angular/material/button";
import { GridFilterConfig } from "../../../models/grid-filter-config.model";
import { DateTime } from "luxon";
import { DateInputComponent } from "../../date-input/date-input.component";

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
        DateInputComponent,
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
