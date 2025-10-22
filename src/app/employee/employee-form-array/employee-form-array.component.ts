import { Component, inject, OnInit, signal } from "@angular/core";
import { SelectItem } from "../../shared/models/select-item.model";
import { catchError, finalize, forkJoin, Observable, of } from "rxjs";
import { PositionService } from "../../shared/services/position.service";
import { CountryService } from "../../shared/services/country.service";
import { AlertService } from "../../shared/services/alert.service";
import {
    FormArrayConfig,
    ValidationKey,
} from "../../shared/models/formArrayData.model";
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
    formArrayConfig: FormArrayConfig[] = [];

    employeeData: unknown[] = [
        { country: 1, gender: 1, position: 1, email: "juan.perez@empresa.com" },
        { country: 2, gender: 2, position: 2, email: "ana.lopez@empresa.com" },
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

    getFormArrayValue(value: any): void {
        console.log("datos del form Array padre: ", value);
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
                    this._setFormArrayData(this._positions, this._countries);
                    this.isLoadingSig.set(false);
                },
                error: (): void => {
                    this.isLoadingSig.set(false);
                    this._alertService.showDanger("Error al cargar datos.");
                },
            });
    }

    private _setFormArrayData(
        positions: SelectItem[],
        countries: SelectItem[],
    ): void {
        this.formArrayConfig = [
            {
                columnPosition: 1,
                fieldName: "country",
                fieldType: "select",
                selectItems: countries,
                label: "País",
                placeHolder: "Selecciona un país",
                validations: [{ type: ValidationKey.required }],
                isRepeated: false,
            },
            {
                columnPosition: 2,
                fieldName: "gender",
                fieldType: "select",
                selectItems: this._genders,
                label: "Género",
                placeHolder: "Selecciona el género",
                validations: [{ type: ValidationKey.required }],
                isRepeated: false,
            },
            {
                columnPosition: 4,
                fieldName: "position",
                fieldType: "select",
                selectItems: positions,
                label: "Puesto",
                placeHolder: "",
                validations: [{ type: ValidationKey.required }],
                isRepeated: false,
            },
            {
                columnPosition: 3,
                fieldName: "email",
                fieldType: "text",
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
