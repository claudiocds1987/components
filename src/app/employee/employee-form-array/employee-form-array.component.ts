import {
    Component,
    ChangeDetectionStrategy,
    OnInit,
    OnDestroy,
    signal,
    inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";

import { forkJoin, Observable, of, catchError } from "rxjs";

import { FormArrayComponent } from "../../shared/components/form-array/form-array.component";
import { BreadcrumbComponent } from "../../shared/components/breadcrumb/breadcrumb.component";
import { SelectItem } from "../../shared/models/select-item.model";
import {
    FormArrayConfig,
    ValidationKey,
} from "../../shared/models/form-array-config.model";
import { Province } from "../../shared/models/province.model";
import { PositionService } from "../../shared/services/position.service";
import { CountryService } from "../../shared/services/country.service";
import { ProvincesService } from "../../shared/services/provinces.service";
import { AlertService } from "../../shared/services/alert.service";
import { BreadcrumbService } from "../../shared/services/breadcrumb.service";

@Component({
    selector: "app-employee-form-array",
    standalone: true,
    imports: [FormArrayComponent, BreadcrumbComponent, CommonModule],
    templateUrl: "./employee-form-array.component.html",
    styleUrls: ["./employee-form-array.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeFormArrayComponent implements OnInit, OnDestroy {
    isLoadingSig = signal(true);

    selectItemsOverridesSig = signal<Record<string, Map<number, SelectItem[]>>>(
        {},
    );
    lastOverrideSig = signal<{ fieldName: string; rowIndex: number } | null>(
        null,
    );
    formArrayConfig1: FormArrayConfig[] = [];
    formArrayConfig2: FormArrayConfig[] = [];
    formArrayConfig3: FormArrayConfig[] = [];
    formArrayConfig4: FormArrayConfig[] = [];
    formArrayConfig5: FormArrayConfig[] = [];
    formArrayWithChangeEvent: FormArrayConfig[] = [];
    formArrayWithChangeId = "formWithChange"; // ID asignado a la instancia que emite eventos de cambio y que debe recibir las actualizaciones de provincia.

    employeeData1: unknown[] = [
        { country: 1, gender: 1, position: 1, email: "juan.perez@empresa.com" },
        { country: 2, gender: 2, position: 2, email: "ana.lopez@empresa.com" },
    ];

    employeeData2: unknown[] = [
        {
            startDate: "2023-01-15",
            endDate: "2023-12-31",
            country: 1,
            email: "juan.perez@empresa.com",
        },
        {
            startDate: "2024-03-01",
            endDate: "2024-05-30",
            country: 1,
            email: "ana.lopez@empresa.com",
        },
    ];

    employeeData3: unknown[] = [];
    // NO BORRAR JSON CON OBJETOS ANIDADOS FUNCIONA BIEN
    /* objetosAnidados: unknown[] = [
        {
            contract: {
                info: {
                    description: "Contrato anual",
                    company: "Empresa S.A.",
                },
                startDate: "2023-01-15",
                endDate: "2023-12-31",
            },
            employe: {
                name: "Jose",
                lastname: "Martinez",
                country: 1,
                email: "jose@gmail.com",
            },
            position: 1,
        },
        {
            contract: {
                info: {
                    description: "Contrato anual",
                    company: "Empresa S.A.",
                },
                startDate: "2023-01-15",
                endDate: "2023-12-31",
            },
            employe: {
                name: "Maca",
                lastname: "Gonzales",
                country: 2,
                email: "maca@gmail.com",
            },
            position: 2,
        },
    ]; */

    private _positionServices = inject(PositionService);
    private _countryServices = inject(CountryService);
    private _alertService = inject(AlertService);
    private _breadcrumbService = inject(BreadcrumbService);
    private _provinceService = inject(ProvincesService);

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
        this._setBreadcrumb();
        this._loadData();
    }

    ngOnDestroy(): void {
        this._breadcrumbService.clearBreadcrumbs();
    }

    getFormArray1Value(_value: unknown): void {
        console.log("Valor FormArray 1:", _value);
    }
    getFormArray2Value(_value: unknown): void {
        console.log("Valor FormArray 2:", _value);
    }
    getFormArray3Value(_value: unknown): void {
        console.log("Valor FormArray 3:", _value);
    }

    getFormArray5Value(_value: unknown): void {
        console.log("Valor FormArray 5:", _value);
    }

    getFormArrayWithChangeEventValue(_value: unknown): void {
        console.log("Valor FormArray con evento de cambio:", _value);
    }

    /**
     * la función handleFieldChange() Maneja el evento de cambio emitido por el FormArrayComponent (hijo) cuando un
     * campo tiene la propiedad 'emitChangeToParent: true'.
     *
     * Esta función es responsable de implementar la lógica de dependencia de datos
     * (e.j., país cambia, lo que dispara la carga de opciones para provincia).
     * * @param event Contiene el nombre del campo que cambió, su nuevo valor y el índice de la fila.
     */
    handleFieldChange(event: {
        fieldName: string;
        value: unknown;
        indexRow: number;
    }): void {
        const { fieldName, value, indexRow } = event;

        // --- Lógica: País (country) cambia ---
        if (fieldName === "country") {
            const countryId = value as number;

            // 1. Obtener Provincias
            this._provinceService
                .getProvincesByCountry(countryId)
                .subscribe((provinces: Province[]): void => {
                    const newProvinceOptions: SelectItem[] = provinces.map(
                        (province: Province): SelectItem => ({
                            id: province.id,
                            description: province.description,
                        }),
                    );

                    // 2. Actualizar el mapa de Overrides para 'province'
                    // Mètodo del signal 'update' para asegurar la inmutabilidad y que Angular detecte el cambio en la Signal.
                    // selectItemsOverridesSig se envia por Input al componente hijo FormArrayComponent
                    this.selectItemsOverridesSig.update(
                        (
                            currentOverrides,
                        ): Record<string, Map<number, SelectItem[]>> => {
                            const provinceMap = currentOverrides["province"]
                                ? new Map(currentOverrides["province"])
                                : new Map<number, SelectItem[]>();

                            provinceMap.set(indexRow, newProvinceOptions);

                            return {
                                ...currentOverrides,
                                province: provinceMap,
                            };
                        },
                    );

                    // 3. Notifica al hijo qué campo debe resetear (province)
                    // Fundamental para que el hijo solo borre el valor de la provincia en esta fila.
                    // el signal lastOverrideSig se envia por Input al componente hijo FormArrayComponent
                    this.lastOverrideSig.set({
                        fieldName: "province",
                        rowIndex: indexRow,
                    });
                });
        }

        // Si por ejemplo hubiese más lógica de dependencia (ej. Provincia -> Ciudad), se agrega aca.
    }

    private _loadData(): void {
        this.isLoadingSig.set(true);

        forkJoin({
            positions: this._getPositions(),
            countries: this._getCountries(),
        }).subscribe({
            next: (results: {
                positions: SelectItem[];
                countries: SelectItem[];
            }): void => {
                this._positions = results.positions;
                this._countries = results.countries;
                this._setFormArray1();
                this._setFormArray2();
                this._setFormArray3();
                this._setFormArrayWithChangeEvent();
                this._setFormArrayRadioButton();
                //this._setFormObjetosAnidados();
                this.isLoadingSig.set(false);
            },
            error: (): void => {
                this.isLoadingSig.set(false);
                this._alertService.showDanger("Error al cargar datos.");
            },
        });
    }

    /* private _setFormObjetosAnidados(): void {
        this.formArrayConfig4 = [
            {
                fieldName: "description",
                fieldType: "text",
                label: "Tipo de contrato",
                placeHolder: "",
                isReadOnly: true,
                isRepeated: true,
            },
            {
                fieldName: "company",
                fieldType: "text",
                label: "Empresa",
                placeHolder: "",
                isReadOnly: true,
                isRepeated: true,
            },
            {
                fieldName: "startDate",
                fieldType: "date",
                label: "Inicio de contrato",
                placeHolder: "",
                validations: [{ type: ValidationKey.required }],
                isRepeated: true,
            },
            {
                fieldName: "endDate",
                fieldType: "date",
                label: "Fin de contrato",
                placeHolder: "",
                validations: [
                    { type: ValidationKey.required },
                    { type: ValidationKey.validateRange, value: "startDate" },
                ],
                isRepeated: true,
            },
            {
                fieldName: "name",
                fieldType: "text",
                label: "Nombre",
                placeHolder: "",
                validations: [{ type: ValidationKey.required }],
                isRepeated: true,
            },
            {
                fieldName: "lastname",
                fieldType: "text",
                label: "apellido",
                placeHolder: "",
                validations: [{ type: ValidationKey.required }],
                isRepeated: true,
            },
            {
                fieldName: "country",
                fieldType: "select",
                label: "Pais",
                placeHolder: "",
                selectItems: this._countries,
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
            {
                fieldName: "position",
                fieldType: "select",
                selectItems: this._positions,
                label: "Puesto",
                placeHolder: "",
                validations: [{ type: ValidationKey.required }],
                isRepeated: true,
            },
        ];
    } */

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
                //placeHolder: "", // opcional
                validations: [{ type: ValidationKey.required }],
                isRepeated: true,
            },
            {
                fieldName: "endDate",
                fieldType: "date",
                label: "Fecha Hasta",
                //placeHolder: "", // opcional
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
                validations: [{ type: ValidationKey.email }],
                isRepeated: false,
                isReadOnly: true,
            },
        ];
    }

    private _setFormArrayRadioButton(): void {
        this.formArrayConfig5 = [
            {
                fieldName: "name",
                fieldType: "text",
                label: "Nombre",
                isRepeated: false,
                validations: [{ type: ValidationKey.required }],
            },
            {
                fieldName: "surname",
                fieldType: "text",
                label: "Apellido",
                isRepeated: true,
                validations: [{ type: ValidationKey.required }],
            },
            // CONFIGURACIÓN DE RADIO BUTTON
            {
                fieldName: "gender",
                fieldType: "radio-button",
                label: "Elija un Género *",
                radioOptions: [
                    { value: "1", optionName: "Masculino" },
                    { value: "2", optionName: "Femenino" },
                    { value: "0", optionName: "Binario" },
                ],

                validations: [{ type: ValidationKey.required }],
                isRepeated: false,
            },
        ];
    }

    private _setFormArrayWithChangeEvent(): void {
        // Configuración de ejemplo en el componente padre
        this.formArrayWithChangeEvent = [
            {
                fieldName: "country",
                fieldType: "select",
                label: "País",
                placeHolder: "Pais",
                selectItems: [
                    { id: 1, description: "Argentina" },
                    { id: 2, description: "Bolivia" },
                ],
                isRepeated: true,
                emitChangeToParent: true, // ¡CLAVE! Habilitar la emisión de evento.
            },
            {
                fieldName: "province",
                fieldType: "select",
                label: "Provincia",
                placeHolder: "Provincia",
                selectItems: [],
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

    private _setBreadcrumb(): void {
        this._breadcrumbService.setBreadcrumbs([
            { label: "Inicio", path: "/home" },
            { label: "Form-array", path: "" },
        ]);
    }
}
