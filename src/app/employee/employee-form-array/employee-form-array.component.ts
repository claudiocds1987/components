import { Component, inject, OnInit, signal } from "@angular/core";
import { SelectItem } from "../../shared/models/select-item.model";
import { catchError, finalize, forkJoin, Observable, of } from "rxjs";
import { PositionService } from "../../shared/services/position.service";
import { CountryService } from "../../shared/services/country.service";
import { AlertService } from "../../shared/services/alert.service";
import {
    FormArrayConfig,
    ValidationKey,
} from "../../shared/models/form-array-config.model";
import { FormArrayComponent } from "../../shared/components/form-array/form-array.component";

@Component({
    selector: "app-employee-form-array",
    standalone: true,
    imports: [FormArrayComponent],
    templateUrl: "./employee-form-array.component.html",
    styleUrl: "./employee-form-array.component.scss",
})
export class EmployeeFormArrayComponent implements OnInit {
    isLoadingSig = signal(true);
    formArrayConfig1: FormArrayConfig[] = [];
    formArrayConfig2: FormArrayConfig[] = [];
    formArrayConfig3: FormArrayConfig[] = [];

    employeeData1: unknown[] = [
        { country: 1, gender: 1, position: 1, email: "juan.perez@empresa.com" },
        { country: 2, gender: 2, position: 2, email: "ana.lopez@empresa.com" },
    ];

    employeeData2: unknown[] = [
        {
            startDate: "2023-01-15T00:00:00.000Z",
            endDate: "2023-12-31T00:00:00.000Z",
            country: 1,
            email: "juan.perez@empresa.com",
        },
        {
            startDate: "2024-03-01T00:00:00.000Z",
            endDate: "2024-05-30T00:00:00.000Z",
            country: 1,
            email: "ana.lopez@empresa.com",
        },
    ];

    private _positionServices = inject(PositionService);
    private _countryServices = inject(CountryService);
    private _alertService = inject(AlertService);

    private _positions: SelectItem[] = [];
    private _countries: SelectItem[] = [];
    private _genders: SelectItem[] = [
        { id: 0, description: "No binario" },
        { id: 1, description: "Masculino" },
        { id: 2, description: "Femenino" },
    ];

    constructor() {
        this._alertService.clearAlerts();
    }

    ngOnInit(): void {
        this._loadData();
    }

    getFormArray1Value(value: any): void {
        console.log("datos del form 1 Array", value);
    }
    getFormArray2Value(value: any): void {
        console.log("datos del form 2 Array", value);
    }
    getFormArray3Value(value: any): void {
        console.log("datos del form 3 Array", value);
    }

    private _loadData(): void {
        this.isLoadingSig.set(true);

        forkJoin({
            positions: this._getPositions(),
            countries: this._getCountries(),
        })
            .pipe(
                finalize((): void => {
                    this.isLoadingSig.set(false);
                }),
            )
            .subscribe({
                next: (results: {
                    positions: SelectItem[];
                    countries: SelectItem[];
                }): void => {
                    this._positions = results.positions;
                    this._countries = results.countries;
                    this._setFormArray1();
                    this._setFormArray2();
                    this._setFormArray3();
                    this.isLoadingSig.set(false);
                },
                error: (): void => {
                    this.isLoadingSig.set(false);
                    this._alertService.showDanger("Error al cargar datos.");
                },
            });
    }

    private _setFormArray1(): void {
        this.formArrayConfig1 = [
            {
                fieldName: "country",
                fieldType: "select",
                selectItems: this._countries,
                label: "País",
                placeHolder: "Selecciona un país",
                validations: [{ type: ValidationKey.required }],
                isRepeated: true,
            },
            {
                fieldName: "gender",
                fieldType: "select",
                selectItems: this._genders,
                label: "Género",
                placeHolder: "Selecciona el género",
                validations: [{ type: ValidationKey.required }],
                isRepeated: true,
            },
            {
                fieldName: "position",
                fieldType: "select",
                selectItems: this._positions,
                label: "Puesto",
                placeHolder: "",
                validations: [{ type: ValidationKey.required }],
                isRepeated: true,
            },
            {
                fieldName: "email",
                fieldType: "email",
                label: "Email",
                placeHolder: "Ej: usuario@dominio.com",
                validations: [
                    { type: ValidationKey.required },
                    { type: ValidationKey.email },
                ],
                isRepeated: true,
            },
        ];
    }

    private _setFormArray2(): void {
        this.formArrayConfig2 = [
            {
                fieldName: "country",
                fieldType: "select",
                selectItems: this._countries,
                label: "País",
                placeHolder: "Selecciona un país",
                validations: [{ type: ValidationKey.required }],
                isRepeated: false,
            },
            {
                fieldName: "position",
                fieldType: "select",
                selectItems: this._positions,
                label: "Puesto",
                placeHolder: "",
                validations: [{ type: ValidationKey.required }],
                isRepeated: false,
            },
            {
                fieldName: "date",
                fieldType: "date",
                label: "Fecha",
                placeHolder: "",
                validations: [{ type: ValidationKey.required }],
                isRepeated: false,
            },
            {
                fieldName: "email",
                fieldType: "email",
                label: "Email",
                placeHolder: "Ej: usuario@dominio.com",
                validations: [
                    { type: ValidationKey.required },
                    { type: ValidationKey.email },
                ],
                isRepeated: false,
            },
        ];
    }

    private _setFormArray3(): void {
        this.formArrayConfig3 = [
            {
                fieldName: "startDate",
                fieldType: "date",
                label: "Fecha Desde",
                placeHolder: "",
                validations: [{ type: ValidationKey.required }],
                isRepeated: true,
            },
            {
                fieldName: "endDate",
                fieldType: "date",
                label: "Fecha Hasta",
                placeHolder: "",
                validations: [
                    { type: ValidationKey.required },

                    { type: ValidationKey.validateRange, value: "startDate" },
                ],
                isRepeated: true,
            },
            {
                fieldName: "email",
                fieldType: "email",
                label: "Email",
                placeHolder: "Ej: usuario@dominio.com",
                isRepeated: false,
                isReadOnly: true,
            },
        ];
    }

    private _getPositions(): Observable<SelectItem[]> {
        return this._positionServices.getPositions().pipe(
            catchError((): Observable<SelectItem[]> => {
                this._alertService.showDanger(
                    "Error al cargar la lista de puestos.",
                );
                return of([]);
            }),
        );
    }

    private _getCountries(): Observable<SelectItem[]> {
        return this._countryServices.getCountries().pipe(
            catchError((): Observable<SelectItem[]> => {
                this._alertService.showDanger(
                    "Error al cargar la lista de paises.",
                );
                return of([]);
            }),
        );
    }
}
