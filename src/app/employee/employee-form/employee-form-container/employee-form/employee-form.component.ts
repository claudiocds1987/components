import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
    FormsModule,
    ReactiveFormsModule,
    FormGroup,
    FormControl,
    Validators,
} from "@angular/forms";

import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { DateInputComponent } from "../../../../shared/components/date-input/date-input.component";
import { SpinnerService } from "../../../../shared/services/spinner.service";
import { BreadcrumbService } from "../../../../shared/services/breadcrumb.service";
import { AlertService } from "../../../../shared/services/alert.service";
import { BreadcrumbComponent } from "../../../../shared/components/breadcrumb/breadcrumb.component";
import { AlertComponent } from "../../../../shared/components/alert/alert.component";
import { SelectItem } from "../../../../shared/models/select-item.model";
import { EmployeeService } from "../../../../shared/services/employee.service";
import { PositionService } from "../../../../shared/services/position.service";
import { CountryService } from "../../../../shared/services/country.service";
import { catchError, finalize, forkJoin, Observable, of } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { MatRadioModule } from "@angular/material/radio";
import { ActivatedRoute } from "@angular/router";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";

@Component({
    selector: "app-employee-form",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        DateInputComponent,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        BreadcrumbComponent,
        AlertComponent,
        MatRadioModule,
    ],
    templateUrl: "./employee-form.component.html",
    styleUrl: "./employee-form.component.scss",
})
export class EmployeeFormComponent implements OnInit {
    employeeForm: FormGroup;
    isLoading = true;
    operation: string; // "create" o "edit"
    positions: SelectItem[] = [];
    countries: SelectItem[] = [];
    genders: SelectItem[] = [
        { id: "all", description: "Todos" },
        { id: 0, description: "No binario" },
        { id: 1, description: "Masculino" },
        { id: 2, description: "Femenino" },
    ];

    private _route = inject(ActivatedRoute);
    private _spinnerService = inject(SpinnerService);
    private _breadcrumbService = inject(BreadcrumbService);
    private _alertService = inject(AlertService);
    private _employeeServices = inject(EmployeeService);
    private _positionServices = inject(PositionService);
    private _countryServices = inject(CountryService);

    constructor() {
        this.operation = this._route.snapshot.data["operation"]; // "create" o "edit"
        console.log("Operación:", this.operation);
        this._setBreadcrumb();
        this.employeeForm = this._createForm();
    }

    ngOnInit(): void {
        this._loadData();
    }

    onCancel(): void {
        // Cierra el diálogo sin pasar ningún dato
    }

    onSave(): void {
        console.log(this.employeeForm.value);
    }

    isReadyToSave(): boolean {
        console.log(this.employeeForm.valid, this.employeeForm.dirty);
        return this.employeeForm.valid && this.employeeForm.dirty;
    }

    private _createForm(): FormGroup {
        return new FormGroup({
            id: new FormControl(""),
            name: new FormControl("", Validators.required),
            surname: new FormControl("", Validators.required),
            birthDate: new FormControl("", Validators.required),
            gender: new FormControl("", Validators.required),
            country: new FormControl("", Validators.required),
            position: new FormControl("", Validators.required),
            active: new FormControl(true),
        });
    }

    private _loadData(): void {
        forkJoin({
            positions: this._getPositions(),
            countries: this._getCountries(),
        })
            .pipe(
                finalize((): void => {
                    this.isLoading = false;
                }),
            )
            .subscribe({
                next: (result: {
                    positions: SelectItem[];
                    countries: SelectItem[];
                }): void => {
                    this.positions = result.positions;
                    this.countries = result.countries;
                    if (this.operation === "edit") {
                        // Aquí cargarías los datos del empleado a editar y los pondrías en el formulario
                        // Por ejemplo:
                        // this.employeeForm.patchValue(employeeData);
                    }
                },
            });
    }

    private _getPositions(): Observable<SelectItem[]> {
        return this._positionServices.getPositions().pipe(
            catchError((error: HttpErrorResponse): Observable<SelectItem[]> => {
                this._alertService.showDanger(
                    `Error al cargar la lista de puestos. ${error.statusText}`,
                );
                return of([]);
            }),
        );
    }

    private _getCountries(): Observable<SelectItem[]> {
        return this._countryServices.getCountries().pipe(
            catchError((error: HttpErrorResponse): Observable<SelectItem[]> => {
                this._alertService.showDanger(
                    `Error al cargar la lista de paises. ${error.statusText}`,
                );
                return of([]);
            }),
        );
    }

    private _setBreadcrumb(): void {
        this._breadcrumbService.setBreadcrumbs([
            { label: "Inicio", path: "/" },
            { label: "Grilla full", path: "/employee-grid-pagination" },
            { label: "Empleado", path: "" },
        ]);
    }
}
