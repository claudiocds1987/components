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
import { delay, forkJoin, Observable } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { MatRadioModule } from "@angular/material/radio";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { Employee } from "../../../../shared/models/employee.model";
import { FeedbackDialogService } from "../../../../shared/services/feedback-dialog.service";
import { SkeletonDirective } from "../../../../shared/directives/skeleton.directive";
import { SnackbarService } from "../../../../shared/services/snackbar.service";

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
    operation: string | undefined;
    action: string | undefined;
    title: string | undefined;
    positions: SelectItem[] = [];
    countries: SelectItem[] = [];
    genders: SelectItem[] = [
        { id: 0, description: "No binario" },
        { id: 1, description: "Masculino" },
        { id: 2, description: "Femenino" },
    ];

    private _fromComponentPathCalled: string | null = null;
    private _fromComponentNameCalled: string | null = null;
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
    private _snackbarService = inject(SnackbarService);

    constructor() {
        this.employeeForm = this._createForm();
    }

    ngOnInit(): void {
        this._loadRouteData();
        this._setBreadcrumb();
        this._loadData();
    }

    onCancel(): void {
        if (this.employeeForm.dirty) {
            this._openFeedbackDialogWarningr();
            return;
        }
        this._router.navigate([`/${this._fromComponentPathCalled}`]);
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
            active:
                this.operation === "create"
                    ? true
                    : this.employeeForm.value.active,
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

    private _loadRouteData(): void {
        // employee-form es llamado de 3 grillas diferentes se necesita saber de que componente
        // fue llamado para que al terminar "guardar" o "editar" o al "Cancelar haga la redireccion al componente de donde
        // employee-form fue llamado.
        this._activeRoute.queryParams.subscribe((params): void => {
            this._fromComponentPathCalled = params["componentPath"]; // ruta del componente origen
            this._fromComponentNameCalled = params["componentName"]; // nombre del componente para el breadcrumb
        });

        this.operation = this._activeRoute.snapshot.data["operation"]; // "create" o "edit"

        this.title =
            this.operation === "create"
                ? "Crear nuevo empleado"
                : "Editar empleado";
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
            active: new FormControl(""),
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
                            error: (error: HttpErrorResponse): void => {
                                this._alertService.showDanger(
                                    `Error al cargar los datos del empleado. ${error.statusText}`,
                                );
                                this.isLoading = false;
                                this.employeeForm.disable();
                                this._changeDetectorRef.markForCheck();
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
        return this._employeeService.getEmployee(id);
    }

    private _getPositions(): Observable<SelectItem[]> {
        return this._positionService.getPositions();
    }

    private _getCountries(): Observable<SelectItem[]> {
        return this._countryService.getCountries();
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
                    //this._openFeedbackDialogSuccess();
                    this._showSnackbar();
                    this._router.navigate([
                        `/${this._fromComponentPathCalled}`,
                    ]);
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
                this._router.navigate([`/${this._fromComponentPathCalled}`]);
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
                this._router.navigate([`/${this._fromComponentPathCalled}`]);
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
                this._router.navigate([`/${this._fromComponentPathCalled}`]);
            }
        });
    }

    private _showSnackbar(): void {
        // Solo pasas el mensaje, y usa las posiciones por defecto.
        this._snackbarService.show("¡Editado con con éxito!");
    }

    private _setBreadcrumb(): void {
        this._breadcrumbService.setBreadcrumbs([
            { label: "Inicio", path: "/" },
            {
                label: `${this._fromComponentNameCalled}`,
                path: `/${this._fromComponentPathCalled}`,
            },
            { label: `${this.title}`, path: "" },
        ]);
    }
}
