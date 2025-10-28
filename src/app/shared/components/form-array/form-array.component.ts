/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Component,
    Input,
    signal,
    OnInit,
    OnDestroy,
    inject,
    OnChanges,
    SimpleChanges,
    Output,
    EventEmitter,
    input,
} from "@angular/core";
import { SelectItem } from "../../models/select-item.model";
import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    ValidatorFn,
    Validators,
} from "@angular/forms";
import { debounceTime, Subscription } from "rxjs";
import {
    FormArrayConfig,
    ValidationKey,
} from "../../models/form-array-config.model";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { RequiredValidationDirective } from "../../directives/required-validation.directive";
import { SkeletonDirective } from "../../directives/skeleton.directive";
import { AlertComponent } from "../alert/alert.component";
import { BreadcrumbComponent } from "../breadcrumb/breadcrumb.component";
import { DateInputComponent } from "../date-input/date-input.component";
import { MatIcon } from "@angular/material/icon";
import { ReadOnlyDirective } from "../../directives/read-only.directive";
import { uniqueFieldValidator } from "../../utils/unique-field-validator";

import { dateRangeValidator } from "../../utils/custom-date-validators";
import { CustomValidationMessageDirective } from "../../directives/custom-validation-message.directive";

@Component({
    selector: "app-form-array",
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
        MatIcon,
        BreadcrumbComponent,
        AlertComponent,
        MatRadioModule,
        SkeletonDirective,
        RequiredValidationDirective,
        ReadOnlyDirective,
        CustomValidationMessageDirective,
    ],
    templateUrl: "./form-array.component.html",
    styleUrls: ["./form-array.component.scss", "./../../styles/skeleton.scss"],
})
export class FormArrayComponent implements OnChanges, OnInit, OnDestroy {
    @Input() formArrayConfig: FormArrayConfig[] = []; // Configuración de los campos que viene del componente padre
    @Input() data: unknown[] | null = null; // INPUT data: es la data que recibe por ejemplo del backend para llenar el FormArray (ej: Empleados)
    @Input() maxRows!: number | null;
    isLoadingSig = input<boolean>(true);

    @Output() emitFormArrayValue: EventEmitter<any[] | null> = new EventEmitter<
        any[] | null
    >();

    // Formulario principal que contendrá el FormArray
    mainForm!: FormGroup;

    // Signal que contiene las opciones disponibles después de aplicar la lógica de unicidad
    // (Solo contiene las opciones que NADIE ha seleccionado)
    availableOptionsMap = signal<Map<string, SelectItem[]>>(new Map());

    // Acceso fácil al FormArray 'rows'
    get rows(): FormArray {
        return this.mainForm.get("rows") as FormArray;
    }

    // NUEVA SIGNAL: Contiene TODOS los valores seleccionados (incluyendo duplicados) por campo único.
    // Clave: fieldName (string), Valor: lista de IDs seleccionados (string[] | number[])
    private _selectedValuesByField = signal<
        Record<string, (string | number)[]>
    >({});
    private _valueChangesSubscription: Subscription = new Subscription();
    private isInitialized = false; // Bandera para controlar la inicialización

    // Mapa para almacenar los items originales de los 'select' (necesario para el filtrado)
    private _originalSelectItemsMap = new Map<string, SelectItem[]>();

    // Inyección de FormBuilder usando inject()
    private _fb = inject(FormBuilder);

    constructor() {
        this._createFormArray();
    }

    // form-array.component.ts

    ngOnChanges(changes: SimpleChanges): void {
        const configReceived =
            changes["formArrayConfig"] && this.formArrayConfig.length > 0;
        const dataReceived = changes["data"]; // Comprobar si initialData ha llegado/cambiado

        // 1. Inicializar la estructura la primera vez que la configuración llega
        if (configReceived && !this.isInitialized) {
            this._initFormStructure();
            this.isInitialized = true;
        } else if (this.isInitialized) {
            // 2. Lógica de actualización si la configuración o los datos iniciales cambian

            if (configReceived) {
                this.initializeSelectMaps();

                // ✅ ACTUALIZAR: Volver a aplicar el validador de unicidad al FormArray si la configuración cambia.
                const uniquenessValidator = uniqueFieldValidator(
                    this.formArrayConfig,
                );
                this.rows.setValidators(uniquenessValidator);
            }

            // Si los datos iniciales cambian después de la inicialización, repoblamos el FormArray.
            if (dataReceived) {
                this._resetAndLoadRows(this.data || []);
            }

            // Recalcula las opciones del select en cualquier caso de actualización.
            this._calculateSelectAvailableOptions();

            // Re-validar las filas después de cualquier cambio (ejecuta tanto el validador de unicidad del FormArray
            // como el validador de rango del FormGroup de cada fila).
            this.rows.updateValueAndValidity();
        }
    }

    ngOnInit(): void {
        this.setupValueChangeSubscription();
    }

    ngOnDestroy(): void {
        this._valueChangesSubscription.unsubscribe();
    }

    trackByFn(index: number, item: AbstractControl): string {
        return item.value;
    }

    isReadyToAdd(): boolean {
        // Si el input maxRows (si se establecio un max de rows desde el padre) es >= a la cantidad de rows del formArray el boton "+" queda inactivo
        if (this.maxRows !== null && this.rows.length >= this.maxRows) {
            return false;
        }
        return this.mainForm.valid;
    }

    // Lógica para mostrar opciones disponibles y re-introducir el valor actual (si no es duplicado)
    getOptionsForField(
        fieldName: string,
        group: AbstractControl,
    ): SelectItem[] {
        const control = group.get(fieldName) as FormControl;
        const currentValue = control.value;
        const fieldConfig = this.formArrayConfig.find(
            (f: FormArrayConfig): boolean => f.fieldName === fieldName,
        );
        const available = this.availableOptionsMap().get(fieldName) || [];

        if (fieldConfig?.isRepeated || currentValue === null) {
            return available;
        }

        const globallySelected = this._selectedValuesByField()[fieldName] || [];
        const occurrenceCount = globallySelected.filter(
            (val): boolean => val === currentValue,
        ).length;
        const original = this._originalSelectItemsMap.get(fieldName) || [];
        const currentItem = original.find(
            (item: SelectItem): boolean => item.id === currentValue,
        );

        // Si el valor actual NO es un duplicado (solo aparece 1 vez), lo re-introducimos para que pueda seleccionarlo.
        if (occurrenceCount <= 1) {
            const isCurrentValueInAvailable = available.some(
                (item: SelectItem): boolean => item.id === currentValue,
            );

            if (!isCurrentValueInAvailable && currentItem) {
                return [...available, currentItem].sort((a, b): number => {
                    const aLabel = a.description.toString().toLowerCase();
                    const bLabel = b.description.toString().toLowerCase();
                    return aLabel.localeCompare(bLabel);
                });
            }
        } else {
            // Si occurrenceCount > 1: Es un DUPLICADO. Solo mostramos el item duplicado, forzando al cambio.
            return currentItem ? [currentItem] : [];
        }

        return available;
    }

    // Utilizado en el template para la clase `(Duplicado)`
    isDuplicate(fieldName: string, itemId: string | number): boolean {
        const globallySelected = this._selectedValuesByField()[fieldName] || [];
        return (
            globallySelected.filter((val): boolean => val === itemId).length > 1
        );
    }

    // Crea un nuevo FormGroup (una "fila") basándose en la configuración de datos.
    // Recibe opcionalmente un objeto con los valores iniciales para precargar los controles.
    // form-array.component.ts (dentro del método createRowGroup)

    createRowGroup(initialValues: Record<string, any> = {}): FormGroup {
        const groupControls: Record<string, FormControl> = {};
        const rowValidators: ValidatorFn[] = [];

        // 1. Crear controles y buscar la configuración de rango
        let rangeTargetName: string | null = null;
        let rangeSourceName: string | null = null; // Necesitamos el nombre del campo actual

        for (const field of this.formArrayConfig) {
            const validators = this._getValidators(field);
            const initialValue = initialValues[field.fieldName] ?? null;

            groupControls[field.fieldName] = this._fb.control(
                initialValue,
                validators,
            );

            // 💡 Verificar si este campo tiene la validación de rango
            const rangeValidation = field.validations?.find(
                (v): any =>
                    v.type === ValidationKey.validateRange &&
                    typeof v.value === "string",
            );

            if (rangeValidation) {
                rangeSourceName = field.fieldName;
                rangeTargetName = rangeValidation.value as string;
            }
        }

        // 2. ✅ Aplicar el Validador de Rango si se encontró la configuración
        if (rangeSourceName && rangeTargetName) {
            // Asumiendo que dateFrom/dateTo es date1/date2, respectivamente:
            rowValidators.push(
                dateRangeValidator(rangeSourceName, rangeTargetName),
            );
        }

        // 3. Crear el FormGroup y aplicar los validadores de la fila
        const group = this._fb.group(groupControls, {
            validators: rowValidators,
        });

        return group;
    }

    // Añade una nueva fila (FormGroup) al FormArray.
    addRow(): void {
        // Si el input maxRows (si se establecio un max de rows desde el padre) es >= a la cantidad de rows del formArray no se pueden seguir agregando
        if (this.maxRows !== null && this.rows.length >= this.maxRows) {
            return;
        }
        // Como se agrega una fila nueva si algun campo en la configuracion del array tiene isReadOnly "true" se pasa a false para que pueda escribir en el campo
        this.formArrayConfig.map(
            (formArrayconfig: FormArrayConfig): FormArrayConfig => {
                // Si la configuración tiene 'readOnly' en true
                if (formArrayconfig.isReadOnly) {
                    // Establecer 'isReadOnly' a false, para que en la nueva fila en el campo se pueda escribir
                    formArrayconfig.isReadOnly = false;
                }
                return formArrayconfig;
            },
        );
        this.rows.push(this.createRowGroup());
        this.rows.markAsDirty();
    }

    // Elimina una fila (FormGroup) del FormArray por su índice.
    removeRow(index: number): void {
        if (this.rows.length > 1) {
            this.rows.removeAt(index);
            this.rows.markAsDirty();
        }
    }

    // Verifica si un campo tiene la validación 'required'.
    isRequired(field: FormArrayConfig): boolean {
        return (
            field.validations?.some(
                (v): boolean => v.type === ValidationKey.required,
            ) ?? false
        );
    }

    private _initFormStructure(): void {
        // 1. Inicializa los mapas de opciones
        this.initializeSelectMaps();

        // 2. AÑADIDO: Aplicar el validador de fechas al FormArray
        const dateValidator = uniqueFieldValidator(this.formArrayConfig);
        this.rows.setValidators(dateValidator);
        this.rows.updateValueAndValidity(); // Ejecutar el validador inmediatamente

        // 3. Si hay datos iniciales, usarlos para poblar el FormArray
        if (this.data && this.data.length > 0) {
            this._resetAndLoadRows(this.data);
        } else if (this.rows.length === 0) {
            // 4. Si no hay datos iniciales y no hay filas, añade la primera fila vacía
            this.addRow();
        }

        // 5. Calcular las opciones iniciales
        this._calculateSelectAvailableOptions();
    }

    private _createFormArray(): void {
        this.mainForm = this._fb.group({
            // Aplicamos el validador al FormArray 'rows'
            rows: this._fb.array([], {
                validators: [uniqueFieldValidator(this.formArrayConfig)],
            }),
        });
    }

    // Llena el FormArray con los datos iniciales recibidos.
    private _resetAndLoadRows(rowsData: any[]): void {
        // 1. Limpiamos el FormArray usando el método nativo (más eficiente y limpio que un while)
        this.rows.clear();

        // 2. Creamos un FormGroup por cada objeto de datos y lo añadimos
        rowsData.forEach((rowData): void => {
            // Pasamos los datos a createRowGroup para inicializar los valores
            this.rows.push(this.createRowGroup(rowData));
        });

        // 3. Lo marcamos como no modificado (limpio), ya que la data viene de una fuente inicial.
        this.mainForm.markAsPristine();
    }

    private initializeSelectMaps(): void {
        this.formArrayConfig.forEach((field: FormArrayConfig): void => {
            if (field.fieldType === "select" && field.selectItems) {
                this._originalSelectItemsMap.set(field.fieldName, [
                    ...field.selectItems,
                ]);
            }
        });
    }

    private setupValueChangeSubscription(): void {
        this._valueChangesSubscription.unsubscribe();
        this._valueChangesSubscription = new Subscription();
        // 1. Suscripción para gestionar opciones disponibles (response inmediata a cambios de valor)
        this._valueChangesSubscription.add(
            this.rows.valueChanges.subscribe((): void => {
                this._calculateSelectAvailableOptions();
            }),
        );
        // 2. Suscripción para emitir el valor del FormArray al componente padre SOLO cuando es VÁLIDO
        this._valueChangesSubscription.add(
            this.rows.statusChanges
                .pipe(
                    // Espera 300ms para estabilizar el estado (útil para validaciones asíncronas)
                    debounceTime(300),
                )
                .subscribe((status: string): void => {
                    if (status === "VALID") {
                        // Emite el valor completo del FormArray si es válido
                        this.emitFormArrayValue.emit(this.rows.value);
                    } else {
                        // Emite null si es inválido (o si cambia de válido a inválido)
                        this.emitFormArrayValue.emit(null);
                    }
                }),
        );
    }

    private _calculateSelectAvailableOptions(): void {
        const newAvailableOptionsMap = new Map<string, SelectItem[]>();
        const newSelectedValues: Record<string, (string | number)[]> = {};

        this.formArrayConfig.forEach((field: FormArrayConfig): void => {
            if (field.fieldType === "select" && !field.isRepeated) {
                const selected: (string | number)[] = [];
                this.rows.controls.forEach((group: AbstractControl): void => {
                    const control = group.get(field.fieldName);
                    if (control?.value != null) {
                        selected.push(control.value);
                    }
                });
                newSelectedValues[field.fieldName] = selected;
            }
        });

        this._selectedValuesByField.set(newSelectedValues);

        this.formArrayConfig.forEach((field: FormArrayConfig): void => {
            const originalItems = this._originalSelectItemsMap.get(
                field.fieldName,
            );
            if (field.fieldType === "select" && originalItems) {
                if (!field.isRepeated) {
                    const selected = newSelectedValues[field.fieldName] || [];
                    const usedUniqueIds = new Set(selected);

                    const filteredItems = originalItems.filter(
                        (item: SelectItem): boolean =>
                            !usedUniqueIds.has(item.id),
                    );
                    newAvailableOptionsMap.set(field.fieldName, filteredItems);
                } else {
                    newAvailableOptionsMap.set(field.fieldName, originalItems);
                }
            }
        });

        this.availableOptionsMap.set(newAvailableOptionsMap);
    }

    private _getValidators(field: FormArrayConfig): any[] {
        const fieldValidators: any[] = [];
        if (field.validations) {
            for (const validation of field.validations) {
                // 💡 1. IGNORAR: El validador de rango cruzado se aplica a nivel de FormGroup (en createRowGroup), no de FormControl.
                if (validation.type === ValidationKey.validateRange) {
                    continue;
                }

                // Declaramos 'value' para un acceso más limpio
                const value = validation.value;

                switch (validation.type) {
                    case ValidationKey.required:
                        fieldValidators.push(Validators.required);
                        break;

                    case ValidationKey.minLength:
                        // Verificamos que 'value' sea un número
                        if (value && typeof value === "number") {
                            fieldValidators.push(Validators.minLength(value));
                        }
                        break;

                    case ValidationKey.maxLength:
                        // Verificamos que 'value' sea un número
                        if (value && typeof value === "number") {
                            fieldValidators.push(Validators.maxLength(value));
                        }
                        break;

                    case ValidationKey.email:
                        fieldValidators.push(Validators.email);
                        break;

                    default:
                        console.warn(
                            `Validation type ${validation.type} not recognized.`,
                        );
                }
            }
        }
        return fieldValidators;
    }
}
