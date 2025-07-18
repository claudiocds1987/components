import { Component, Input } from "@angular/core";
import { GridFilterConfig } from "../../../models/grid-filter-config.model";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
// Angular Material Modules
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core"; // Necesario para mat-datepicker
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatFormFieldModule } from "@angular/material/form-field";

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
    ],
    templateUrl: "./grid-filter.component.html",
    styleUrl: "./grid-filter.component.scss",
})
export class GridFilterComponent {
    @Input() config!: GridFilterConfig;
    @Input() filterForm!: FormGroup; // El FormGroup lo pasaremos desde el componente padre
    // hay que hacer output para emitir el valor del filtro al componente padre
}
