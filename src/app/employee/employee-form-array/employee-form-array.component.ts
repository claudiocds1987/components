import {
    Component,
    inject,
    OnDestroy,
    OnInit,
    signal,
    ViewChild,
} from "@angular/core";
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
import { BreadcrumbService } from "../../shared/services/breadcrumb.service";
import { BreadcrumbComponent } from "../../shared/components/breadcrumb/breadcrumb.component";
import { ProvincesService } from "../../shared/services/provinces.service";
import { Province } from "../../shared/models/province.model";
import { FormGroup } from "@angular/forms";

@Component({
    selector: "app-employee-form-array",
    standalone: true,
    imports: [FormArrayComponent, BreadcrumbComponent],
    templateUrl: "./employee-form-array.component.html",
    styleUrl: "./employee-form-array.component.scss",
})
export class EmployeeFormArrayComponent implements OnInit, OnDestroy {
    // Obtener una referencia a la instancia del componente hijo
    @ViewChild(FormArrayComponent)
    ViewChildFormArrayComponent!: FormArrayComponent;
    isLoadingSig = signal(true);
    formArrayConfig1: FormArrayConfig[] = [];
    formArrayConfig2: FormArrayConfig[] = [];
    formArrayConfig3: FormArrayConfig[] = [];
    formArrayConfig4: FormArrayConfig[] = [];
    formArrayWithChangeEvent: FormArrayConfig[] = [];

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

    private _positions: SelectItem[] = [];
    private _countries: SelectItem[] = [];
    private _genders: SelectItem[] = [
        { id: 0, description: "No binario" },
        { id: 1, description: "Masculino" },
        { id: 2, description: "Femenino" },
    ];

    private _provinceService = inject(ProvincesService);

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

    getFormArray1Value(value: any): void {
        console.log("datos del form 1 Array", value);
    }
    getFormArray2Value(value: any): void {
        console.log("datos del form 2 Array", value);
    }
    getFormArray3Value(value: any): void {
        console.log("datos del form 3 Array", value);
    }

    getFormArrayWithChangeEventValue(value: any): void {
        console.log("datos del form Array con evento de cambio a padre", value);
    }

    // La funcion handleFieldChange() se tiene que hacer manualmente cuando un campo en la configuracion tiene la propiedad
    // emitChangeToParent: true. Esta funcion obtiene el campo que ha cambiado, su nuevo valor y el índice de la fila.
    // siempre y cuando en la configuración se haya establecido la propiedad emitChangeToParent: true
    // esta funcion es ideal para cargar opciones dependientes en selects anidados. Ejemplo: país -> provincia
    // un selector de país que al cambiar su valor recarga las opciones del selector de provincia.
    handleFieldChange(event: {
        fieldName: string;
        value: any;
        indexRow: number;
    }): void {
        if (event.fieldName === "country") {
            const countryId = event.value;
            const rowIndex = event.indexRow;

            this._provinceService
                .getProvincesByCountry(countryId)
                .subscribe((provinces: Province[]): void => {
                    // 1. Mapear la respuesta del servicio (Province[]) a SelectItem[]
                    const newProvinceOptions: SelectItem[] = provinces.map(
                        (province: Province): SelectItem => ({
                            id: province.id,
                            description: province.description,
                        }),
                    );

                    // 2. Aplicar la actualización de la configuración con la función genérica
                    // Pasamos el índice, el nombre del campo objetivo ('province') y las nuevas opciones.
                    this.updateSelectOptionsAndReset(
                        rowIndex,
                        "province", // Campo a actualizar mismo nombre que s epuso en la configuracion
                        newProvinceOptions,
                    );
                });
        }
    }

    /**
     * Función genérica para actualizar las opciones de un SelectField
     * y resetear su valor en una fila específica.
     * @param rowIndex El índice de la fila del FormArray.
     * @param targetFieldName El nombre del campo cuyas opciones se van a actualizar (ej: 'province').
     * @param newOptions La nueva lista de opciones (SelectItem[]).
     */
    updateSelectOptionsAndReset(
        rowIndex: number,
        targetFieldName: string, // 👈 Nombre del campo a actualizar
        newOptions: SelectItem[],
    ): void {
        // 1. Localizar y mutar el campo de configuración
        const fieldConfigToUpdate = this.formArrayWithChangeEvent.find(
            (f): boolean => f.fieldName === targetFieldName,
        );

        if (fieldConfigToUpdate) {
            // Asignar las nuevas opciones
            fieldConfigToUpdate.selectItems = newOptions;

            // 2. Acceder y resetear el control en la fila del formulario que esta en form-array.component.ts
            if (this.ViewChildFormArrayComponent) {
                // Usamos nombre de ViewChild
                const rows = this.ViewChildFormArrayComponent.rows;

                if (rows.length > rowIndex) {
                    const rowGroup = rows.at(rowIndex) as FormGroup;
                    // Resetear el valor del campo objetivo a null/vacío
                    rowGroup.get(targetFieldName)?.setValue(null);
                }
            }
        }

        // 3. Forzar la detección de cambios: Crear una nueva referencia del Input.
        this.formArrayWithChangeEvent = [...this.formArrayWithChangeEvent];
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
                isRepeated: false,
                emitChangeToParent: true, // ¡CLAVE! Habilitar la emisión de evento.
            },
            {
                fieldName: "province",
                fieldType: "select",
                label: "Provincia",
                placeHolder: "Provincia",
                selectItems: [],
                isRepeated: false,
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
