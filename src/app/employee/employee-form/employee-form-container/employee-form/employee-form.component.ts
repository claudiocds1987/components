import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
    FormsModule,
    ReactiveFormsModule,
    FormGroup,
    FormControl,
    Validators,
} from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { DateInputComponent } from "../../../../shared/components/date-input/date-input.component";

@Component({
    selector: "app-employee-form",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        DateInputComponent,
        MatSelectModule,
    ],
    templateUrl: "./employee-form.component.html",
    styleUrl: "./employee-form.component.scss",
})
export class EmployeeFormComponent {
    employeeForm: FormGroup;
    employeePositions: string[] = [];

    constructor() {
        this.employeeForm = this._createForm();
        this.employeePositions = [
            "Todos",
            "Desarrollador Senior",
            "Desarrollador Junior",
            "Diseñador UX/UI",
            "Soporte Técnico",
            "Analista de Datos",
            "Especialista QA",
        ];
    }
    onCancel(): void {
        // Cierra el diálogo sin pasar ningún dato
    }

    onSave(): void {
        // Cierra el diálogo y pasa los datos del formulario al componente padre
    }

    private _createForm(): FormGroup {
        return new FormGroup({
            id: new FormControl(""),
            name: new FormControl("", Validators.required),
            surname: new FormControl("", Validators.required),
            birthDate: new FormControl("", Validators.required),
            position: new FormControl("", Validators.required),
            active: new FormControl(true),
            // poner propiedad "active" y agregarla a interface Employee
        });
    }
}
