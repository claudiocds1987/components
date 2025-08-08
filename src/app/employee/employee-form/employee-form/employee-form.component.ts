import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
    FormsModule,
    ReactiveFormsModule,
    FormGroup,
    FormControl,
    Validators,
} from "@angular/forms";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";

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
    ],
    templateUrl: "./employee-form.component.html",
    styleUrl: "./employee-form.component.scss",
})
export class EmployeeFormComponent {
    employeeForm: FormGroup;
    private _dialogRef = inject(MatDialogRef<EmployeeFormComponent>);

    constructor() {
        this.employeeForm = this._createForm();
    }
    onCancel(): void {
        // Cierra el diálogo sin pasar ningún dato
        this._dialogRef.close();
    }

    onSave(): void {
        // Cierra el diálogo y pasa los datos del formulario al componente padre
        this._dialogRef.close(this.employeeForm.value);
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
