import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    OnInit,
} from "@angular/core";
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
import { catchError, delay, finalize, forkJoin, Observable, of } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { MatRadioModule } from "@angular/material/radio";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { Employee } from "../../../../shared/models/employee.model";
import { FeedbackDialogService } from "../../../../shared/services/feedback-dialog.service";
import { SkeletonDirective } from "../../../../shared/directives/skeleton.directive";

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
        SkeletonDirective,
    ],
    templateUrl: "./employee-form.component.html",
    styleUrls: [
        "./employee-form.component.scss",
        "../../../../shared/styles/skeleton.scss",
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeFormComponent implements OnInit {
    employeeForm: FormGroup;
    isLoading = true;
    operation: string;
    title: string;
    positions: SelectItem[] = [];
    countries: SelectItem[] = [];
    genders: SelectItem[] = [
        { id: "all", description: "Todos" },
        { id: 0, description: "No binario" },
        { id: 1, description: "Masculino" },
        { id: 2, description: "Femenino" },
    ];

    private _activeRoute = inject(ActivatedRoute);
    private _router = inject(Router);
    private _spinnerService = inject(SpinnerService);
    private _breadcrumbService = inject(BreadcrumbService);
    private _alertService = inject(AlertService);
    private _employeeService = inject(EmployeeService);
    private _positionService = inject(PositionService);
    private _countryService = inject(CountryService);
    private _feedbackDialogService = inject(FeedbackDialogService);
    private _changeDetectorRef: ChangeDetectorRef = inject(ChangeDetectorRef);

    constructor() {
        this.operation = this._activeRoute.snapshot.data["operation"]; // "create" o "edit"
        this.title =
            this.operation === "create"
                ? "Crear nuevo empleado"
                : "Editar empleado";
        this._setBreadcrumb();
        this.employeeForm = this._createForm();
    }

    ngOnInit(): void {
        this._loadData();
    }

    onCancel(): void {
        if (this.employeeForm.dirty) {
            this._openFeedbackDialogWarningr();
            return;
        }
        this._router.navigate(["/employee-grid-pagination"]);
    }

    onSave(): void {
        const employee: Employee = {
            id: this.employeeForm.value.id, // en el servicio employeeService en el post con Omit le ignoro el id
            imgUrl: this.employeeForm.value.imgUrl || "",
            name: this.employeeForm.value.name,
            surname: this.employeeForm.value.surname,
            birthDate: this.employeeForm.value.birthDate,
            genderId: this.employeeForm.value.genderId,
            countryId: this.employeeForm.value.countryId,
            positionId: this.employeeForm.value.positionId,
            active: this.employeeForm.value.active,
        };

        if (this.operation === "create") {
            this._createEmployee(employee);
        } else {
            this._editEmployee(employee);
        }
    }

    isReadyToSave(): boolean {
        return this.employeeForm.valid && this.employeeForm.dirty;
    }

    private _createForm(): FormGroup {
        return new FormGroup({
            id: new FormControl(""),
            imgUrl: new FormControl(""),
            name: new FormControl("", Validators.required),
            surname: new FormControl("", Validators.required),
            birthDate: new FormControl("", Validators.required),
            genderId: new FormControl("", Validators.required),
            countryId: new FormControl("", Validators.required),
            positionId: new FormControl("", Validators.required),
            active: new FormControl(true),
        });
    }

    private _loadData(): void {
        forkJoin({
            positions: this._getPositions(),
            countries: this._getCountries(),
        }).subscribe({
            next: (result: {
                positions: SelectItem[];
                countries: SelectItem[];
            }): void => {
                this.positions = result.positions;
                this.countries = result.countries;

                if (this.operation === "edit") {
                    this.isLoading = true;
                    const employeeId =
                        this._activeRoute.snapshot.paramMap.get("id");
                    this._getEmployeeById(Number(employeeId))
                        .pipe(
                            // delay para simular tiempo de carga con json-server
                            delay(500),
                        )
                        .subscribe({
                            next: (employee: Employee): void => {
                                this.employeeForm.patchValue(employee);
                                this.isLoading = false;
                            },
                        });
                } else {
                    // setTimeOut para simular tiempo de recarga con json-server en los selects modo Crear
                    setTimeout((): void => {
                        this.isLoading = false;
                        this._changeDetectorRef.markForCheck();
                    }, 500);
                }
            },
        });
    }

    private _getEmployeeById(id: number): Observable<Employee> {
        return this._employeeService.getEmployee(id).pipe(
            catchError((error: HttpErrorResponse): Observable<Employee> => {
                this._alertService.showDanger(
                    `Error al cargar los datos del empleado. ${error.statusText}`,
                );
                return of();
            }),
        );
    }

    private _getPositions(): Observable<SelectItem[]> {
        return this._positionService.getPositions().pipe(
            catchError((error: HttpErrorResponse): Observable<SelectItem[]> => {
                this._alertService.showDanger(
                    `Error al cargar la lista de puestos. ${error.statusText}`,
                );
                return of([]);
            }),
        );
    }

    private _getCountries(): Observable<SelectItem[]> {
        return this._countryService.getCountries().pipe(
            catchError((error: HttpErrorResponse): Observable<SelectItem[]> => {
                this._alertService.showDanger(
                    `Error al cargar la lista de paises. ${error.statusText}`,
                );
                return of([]);
            }),
        );
    }

    private _createEmployee(employee: Employee): void {
        this._spinnerService.show();
        this._employeeService.createEmployee(employee).subscribe({
            next: (): void => {
                // agregado de setTimeout para simular un delay con json-server
                setTimeout((): void => {
                    this._spinnerService.hide();
                    this._openFeedbackDialogSuccess();
                }, 1500);
            },
            error: (): void => {
                this._spinnerService.hide();
                this._openFeedbackDialogDanger();
            },
        });
    }

    private _editEmployee(employee: Employee): void {
        this._spinnerService.show();
        this._employeeService.updateEmployee(employee).subscribe({
            next: (): void => {
                // agregado de setTimeout para simular un delay con json-server
                setTimeout((): void => {
                    this._spinnerService.hide();
                    this._openFeedbackDialogSuccess();
                }, 1500);
            },
            error: (): void => {
                this._spinnerService.hide();
                this._openFeedbackDialogDanger();
            },
        });
    }

    private _openFeedbackDialogSuccess(): void {
        const action = this.operation === "create" ? "creado" : "editado";
        const dialogRef = this._feedbackDialogService.openFeedbackDialog({
            type: "success",
            title: `Empleado ${action} con éxito.`,
            showButtons: true, // Esto es importante, para mostrar los botones
            cancelButtonText: action === "creado" ? "Cancelar" : "Aceptar", // El botón de "Cancelar" será para ver empleados
            acceptButtonText: action === "creado" ? "Crear otro" : "",
        });

        dialogRef.afterClosed().subscribe((result): void => {
            if (result === true) {
                this.employeeForm.reset();
            } else if (result === false) {
                this._router.navigate(["/employee-grid-pagination"]);
            }
        });
    }
    private _openFeedbackDialogDanger(): void {
        const action = this.operation === "create" ? "crear" : "editar";
        const dialogRef = this._feedbackDialogService.openFeedbackDialog({
            type: "danger",
            message: `No se pudo ${action} el empleado.`,
            showButtons: true,
            cancelButtonText: "Cancelar",
            acceptButtonText: "Volver a intentar",
        });
        dialogRef.afterClosed().subscribe((result): void => {
            if (result === false) {
                this._router.navigate(["/employee-grid-pagination"]);
            }
        });
    }

    private _openFeedbackDialogWarningr(): void {
        const dialogRef = this._feedbackDialogService.openFeedbackDialog({
            type: "warning",
            title: "los cambios se perderán.",
            message: " ¿Esta seguro/a que desea salir?",
            showButtons: true,
            cancelButtonText: "Cancelar",
            acceptButtonText: "Aceptar",
        });
        dialogRef.afterClosed().subscribe((result): void => {
            if (result === true) {
                this._router.navigate(["/employee-grid-pagination"]);
            }
        });
    }

    private _setBreadcrumb(): void {
        this._breadcrumbService.setBreadcrumbs([
            { label: "Inicio", path: "/" },
            { label: "Grilla full", path: "/employee-grid-pagination" },
            { label: "Empleado", path: "" },
        ]);
    }
}
