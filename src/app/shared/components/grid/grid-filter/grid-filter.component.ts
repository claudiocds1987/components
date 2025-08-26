import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatButtonModule } from "@angular/material/button";
import { GridFilterConfig } from "../../../models/grid-filter-config.model";
import { DateInputComponent } from "../../date-input/date-input.component";
import { SkeletonDirective } from "../../../directives/skeleton.directive";

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
        SkeletonDirective,
    ],
    templateUrl: "./grid-filter.component.html",
    styleUrls: [
        "./grid-filter.component.scss",
        "../../../styles/skeleton.scss",
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridFilterComponent {
    @Input() config: GridFilterConfig[] = [];
    @Input() filterForm!: FormGroup;
    @Input() isLoading = false;
    @Output() emitFilterApplied = new EventEmitter<Record<string, unknown>>();

    applyFilter(): void {
        const filterFormValues = this.filterForm.value;
        this.emitFilterApplied.emit(filterFormValues);
    }

    clearFilter(): void {
        this.filterForm.reset();
        this.emitFilterApplied.emit(this.filterForm.value);
    }

    isButtonDisabled(): boolean {
        return !this.filterForm?.valid || !this.filterForm?.dirty;
    }
}
