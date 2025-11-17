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
    ChangeDetectionStrategy,
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
import { SkeletonDirective } from "../../directives/skeleton.directive";
import { DateInputComponent } from "../date-input/date-input.component";
import { MatIcon } from "@angular/material/icon";
import { ReadOnlyDirective } from "../../directives/read-only.directive";
import { checkDuplicatedInEntireFormArray } from "../../utils/form-array-validators";

import { dateRangeValidator } from "../../utils/custom-date-validators";
import { CustomValidationMessageDirective } from "../../directives/custom-validation-message.directive";
import { FeedbackComponent } from "../feedback/feedback.component";

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
        MatRadioModule,
        SkeletonDirective,
        ReadOnlyDirective,
        CustomValidationMessageDirective,
        FeedbackComponent,
    ],
    templateUrl: "./form-array.component.html",
    styleUrls: ["./form-array.component.scss", "./../../styles/skeleton.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormArrayComponent implements OnChanges, OnInit, OnDestroy {
    @Input() id?: string | number;
    @Input() formArrayConfig: FormArrayConfig[] = []; // Configuración de los campos que viene del componente padre
    @Input() data: unknown[] | null = null; // INPUT data: es la data que recibe por ejemplo del backend para llenar el FormArray (ej: Empleados)
    @Input() maxRows!: number | null;

    // INPUT SIGNAL selectItemsOverridesSig: (ESTE INPUT SOLO SE USA CUANDO EN EL PADRE LA PROP. emitChangeToParent: true) Usado por el Padre para enviar opciones cargadas en cascada (ej. Provincias) para un campo específico en una fila del FormArray.
    selectItemsOverridesSig = input<Record<string, Map<number, SelectItem[]>>>(
        {},
    );
    // INPUT SIGNAL lastOverrideSig: (ESTE INPUT SOLO SE USA CUANDO EN EL PADRE LA PROP. emitChangeToParent: true) Para saber qué fila y campo se actualizaron por última vez.
    lastOverrideSig = input<{ fieldName: string; rowIndex: number } | null>(
        null,
    );
    // INPUT SIGNAL isLoadingSig: indica si el FormArray está en estado de carga (por ejemplo, esperando datos del backend).
    isLoadingSig = input<boolean>(true);

    // OUTPUT emitFormArrayValue: emite el valor completo del FormArray al componente padre cuando es VÁLIDO.
    @Output() emitFormArrayValue: EventEmitter<any[] | null> = new EventEmitter<
        any[] | null
    >();

    // OUTPUT fieldChange: si en la configuracion algùn campo tiene la prop. emitChangeToParent = true, el evento emitirá: el nombre del campo, su nuevo valor y el índice de la fila.
    // para que el componente padre pueda reaccionar a este cambio (ej. cargar las provincias correspondientes al pais).
    @Output() fieldChange = new EventEmitter<{
        fieldName: string;
        value: any;
        indexRow: number;
    }>();

    // Formulario principal que contendrá el FormArray
    mainForm!: FormGroup;

    // Signal availableOptionsMapSig: Contiene las opciones disponibles después de aplicar la lógica de unicidad
    // (Solo contiene las opciones que NADIE ha seleccionado)
    availableOptionsMapSig = signal<Map<string, SelectItem[]>>(new Map());

    // getter para Acceso fácil al FormArray 'rows' en el html
    get rows(): FormArray {
        return this.mainForm.get("rows") as FormArray;
    }

    // SIGNAL _selectedValuesByFieldSig: Contiene TODOS los valores seleccionados (incluyendo duplicados) por campo único.
    // Clave: fieldName (string), Valor: lista de IDs seleccionados (string[] | number[])
    private _selectedValuesByFieldSig = signal<
        Record<string, (string | number)[]>
    >({});

    private _valueChangesSubscription: Subscription = new Subscription();
    private isInitialized = false; // Bandera para controlar la inicialización
    private _originalSelectItemsMap = new Map<string, SelectItem[]>(); // Mapa para almacenar los items originales de los 'select' (necesario para el filtrado)
    private _fb = inject(FormBuilder);

    constructor() {
        this._createFormArray();
    }

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
                // Volver a aplicar el validador de unicidad al FormArray si la configuración cambia.
                const uniquenessValidator = checkDuplicatedInEntireFormArray(
                    this.formArrayConfig,
                );
                this.rows.setValidators(uniquenessValidator);
            }

            // Si los datos iniciales cambian después de la inicialización, repoblamos el FormArray.
            if (dataReceived) {
                this._resetAndLoadRows(this.data || []);
            }

            // Verificamos si los valores de las signals han cambiado
            // Llama a la función de reseteo. El reseteo (setValue(null)) SÓLO ocurre
            // si 'lastOverride()' tiene información de la fila que cambió.
            this._applyOverridesAndResetControls();

            // Recalcula las opciones del select en cualquier caso de actualización.
            this._calculateSelectAvailableOptions();

            // Re-validar las filas después de cualquier cambio (ejecuta validador de unicidad/rango).
            this.rows.updateValueAndValidity();
        }
    }

    // Usamos 'lastOverride()' y 'selectItemsOverrides()' directamente en el ngOnInit/constructor
    // o en funciones llamadas desde el template o subscriptions.
    // Para simplificar, la lógica dependiente de estas signals se integró en ngOnChanges
    // al no depender de observables, pero la lógica que estaba en ngOnChanges ahora se puede
    // simplificar, ya que no dependemos del objeto `changes`.

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

    /**
     * getOptionsForField(fieldName: string, group: AbstractControl,): SelectItem[]
     *
     * Determina el conjunto final de opciones disponibles (SelectItem[]) para un selector.
     *
     * Esta función es el punto de control que aplica:
     * 1. La lógica de cascada: Si hay opciones específicas por fila (Overrides, ej. Provincias).
     * 2. La lógica de unicidad: Restringe las opciones si el campo no es repetible.
     *
     * @param fieldName El nombre del campo (ej. 'province').
     * @param group El FormGroup de la fila actual (para obtener el índice).
     * @returns Un array de SelectItem[] que debe mostrar el selector.
     */
    getOptionsForField(
        fieldName: string,
        group: AbstractControl,
    ): SelectItem[] {
        const control = group.get(fieldName) as FormControl;
        const currentValue = control.value;
        const fieldConfig = this.formArrayConfig.find(
            (f: FormArrayConfig): boolean => f.fieldName === fieldName,
        );
        const available = this.availableOptionsMapSig().get(fieldName) || [];

        // Índice de la fila actual
        const index = this.rows.controls.indexOf(group);

        // Aca se Obtienen los items de anulación (override) usando el input signal
        const perRowItems =
            this.selectItemsOverridesSig()[fieldName]?.get(index) ?? undefined;

        // Si existen items override por fila (ej: provincias o ciudades cargadas dinámicamente)
        if (perRowItems && perRowItems.length > 0) {
            return perRowItems;
        }

        // Si es repetible o el valor actual es null, devolver el conjunto calculado por unicidad (available)
        if (fieldConfig?.isRepeated || currentValue === null) {
            return available;
        }

        // Para campos únicos: calcular disponibilidad respecto a selecciones globales
        const globallySelected =
            this._selectedValuesByFieldSig()[fieldName] || [];
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

    // createRowGroup() Crea un nuevo FormGroup (una "fila") basándose en la configuración de datos.
    // Recibe opcionalmente un objeto con los valores iniciales para precargar los controles.
    createRowGroup(
        initialValues: Record<string, any> = {},
        indexRow?: number,
    ): FormGroup {
        const groupControls: Record<string, FormControl> = {};
        const rowValidators: ValidatorFn[] = [];
        let rangeDateFromName: string | null = null;
        let rangeDateToName: string | null = null;

        // 1. Recorre la configuracion de formArrayConfig para crear los controles del FormGroup y asignarle los validadores
        for (const field of this.formArrayConfig) {
            const validators = this._getValidators(field);
            const initialValue = initialValues[field.fieldName] ?? null;

            groupControls[field.fieldName] = this._fb.control(
                initialValue,
                validators,
            );

            const rangeValidation = field.validations?.find(
                (v): any =>
                    v.type === ValidationKey.validateRange &&
                    typeof v.value === "string",
            );

            if (rangeValidation) {
                rangeDateToName = field.fieldName;
                rangeDateFromName = rangeValidation.value as string;
            }
        }

        // 2. Aplicar el Validador de Rango (Lógica existente)
        if (rangeDateFromName && rangeDateToName) {
            rowValidators.push(
                dateRangeValidator(rangeDateFromName, rangeDateToName),
            );
        }

        // 3. Crear el FormGroup y aplicar los validadores de la fila (Lógica existente)
        const group = this._fb.group(groupControls, {
            validators: rowValidators,
        });

        //4. LÓGICA DE EMISIÓN DE EVENTOS para cada campo que tenga 'emitChangeToParent' en true
        if (indexRow !== undefined) {
            this.formArrayConfig.forEach((field): void => {
                if (field.emitChangeToParent) {
                    const control = group.get(field.fieldName);
                    if (control) {
                        this._valueChangesSubscription.add(
                            control.valueChanges
                                .pipe(
                                    debounceTime(100), // Nota: si hay latencia aumentarlo a 300ms.
                                )
                                .subscribe((value: any): void => {
                                    this.fieldChange.emit({
                                        fieldName: field.fieldName,
                                        value: value,
                                        indexRow: indexRow,
                                    });
                                }),
                        );
                    }
                }
            });
        }

        return group;
    }

    // addRow(): Añade una nueva fila (FormGroup) al FormArray.
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

        const newRowIndex = this.rows.length; // Obtener el índice antes de pushear

        // Pasar el índice de la nueva fila
        this.rows.push(this.createRowGroup({}, newRowIndex));
        this.rows.markAsDirty();
    }

    // Elimina una fila (FormGroup) del FormArray por su índice.
    removeRow(index: number): void {
        this.rows.removeAt(index);
        this.rows.markAsDirty();
    }

    /**
     * _initFormStructure(): Inicializa la estructura del FormArray y sus propiedades de soporte.
     *
     * Esta función se ejecuta una sola vez al inicio (en ngOnChanges) y realiza
     * las siguientes tareas:
     * 1. Prepara los mapas de opciones iniciales para los selects.
     * 2. Establece el validador de unicidad global (para evitar duplicados en todo el FormArray).
     * 3. Carga los datos iniciales ('this.data') o agrega una fila vacía si no hay datos.
     * 4. Calcula el conjunto inicial de opciones disponibles para todos los selects.
     */
    private _initFormStructure(): void {
        // 1. Inicializa los mapas de opciones
        this.initializeSelectMaps();

        // 2. La diferencia de "checkDuplicatedInEntireFormArray()" es que valida en todas las filas del formArray
        // de esta forma se asegura que no haya duplicados en ningun campo marcado en lña configuración del Padre como isRepeated: false
        // en todo el FormArray completo.
        const dateValidator = checkDuplicatedInEntireFormArray(
            this.formArrayConfig,
        );
        this.rows.setValidators(dateValidator);
        this.rows.updateValueAndValidity(); // Ejecutar el validador inmediatamente

        // 3. Si hay datos iniciales, usarlos para cargar el FormArray
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
        const validators = [];
        // Preguntamos si el campo tiene isRepeated en false para aplicar el validador de unicidad
        const isRepeated = this.formArrayConfig.find(
            (config: FormArrayConfig): boolean => config.isRepeated === false,
        );
        // 1. Si el campo tiene isRepeated en false aplicamos el validador de unicidad
        if (isRepeated) {
            validators.push(checkDuplicatedInEntireFormArray([isRepeated]));
        }

        this.mainForm = this._fb.group({
            rows: this._fb.array([], {
                validators: validators,
            }),
        });
    }

    // Llena el FormArray con los datos iniciales recibidos.
    private _resetAndLoadRows(rowsData: any[]): void {
        // 1. Limpiamos el FormArray
        this.rows.clear();
        // Limpiamos las suscripciones de los controles individuales antes de recrearlos.
        // Mantenemos la suscripción del FormArray/statusChanges, que se gestiona en setupValueChangeSubscription.
        this._valueChangesSubscription.unsubscribe();
        this._valueChangesSubscription = new Subscription();
        this.setupValueChangeSubscription(); // Re-suscribir el FormArray y statusChanges
        // 2. Mapeamos y Creamos un FormGroup por cada objeto de datos
        rowsData.forEach((rowData, index): void => {
            const normalizedData = this._flattenObject(rowData);
            // Pasamos los datos NORMALIZADOS y el 'index' para inicializar y suscribir
            this.rows.push(this.createRowGroup(normalizedData, index));
        });

        // 3. Lo marcamos como no modificado (limpio), ya que la data viene de una fuente inicial.
        this.mainForm.markAsPristine();
    }

    /**
     * _flattenObject(): Record<string, any>
     *
     * Transforma un objeto de datos anidado (generalmente el valor de una fila proveniente del backend,
     * via @Input() data) en un objeto de un solo nivel (plano).
     *
     * Utilidad: Esta función es necesaria para "deshacer" cualquier anidamiento que la data del backend
     * pueda tener (ej. { empleado: { nombre: 'A' } }) y convertirlo a un formato simple
     * ({ nombre: 'A' }) que el FormGroup pueda asignar correctamente. Esto asegura que todos los
     * FormControls, independientemente de su estructura original, se mapeen correctamente al cargar el FormArray.
     *
     * NOTA:
     * - Los arrays (incluyendo los FormArrays) y los valores primitivos se mantienen intactos.
     * - Esta función maneja solo un nivel de anidamiento. Si hay múltiples niveles,.
     * - El componente padre va a recibir este objeto plano y es quien tiene que armar/mapear el objeto que necesita el backend para guardar.
     *
     * @param obj El objeto anidado (ej. una fila de 'data') a aplanar.
     * @returns Un nuevo objeto plano listo para ser asignado a un FormGroup de la fila.
     *
     */

    private _flattenObject(obj: Record<string, any>): Record<string, any> {
        const flattened: Record<string, any> = {};

        function flatten(current: Record<string, any>): void {
            for (const key in current) {
                if (Object.prototype.hasOwnProperty.call(current, key)) {
                    const value = current[key];

                    // Si el valor es un objeto, NO es null, y NO es un array,
                    // llamamos a la función recursivamente para aplanar el sub-objeto.
                    if (
                        typeof value === "object" &&
                        value !== null &&
                        !Array.isArray(value)
                    ) {
                        // Llamada recursiva
                        flatten(value);
                    } else {
                        // Si es un valor primitivo (o un array), lo asignamos directamente.
                        flattened[key] = value;
                    }
                }
            }
        }

        flatten(obj); // Inicia el proceso de aplanamiento
        return flattened;
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

        this._selectedValuesByFieldSig.set(newSelectedValues);

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

        this.availableOptionsMapSig.set(newAvailableOptionsMap);
    }

    private _getValidators(field: FormArrayConfig): any[] {
        const fieldValidators: any[] = [];
        if (field.validations) {
            for (const validation of field.validations) {
                // 1. IGNORAR: El validador de rango cruzado se aplica a nivel de FormGroup (en createRowGroup), no de FormControl.
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

    private _applyOverridesAndResetControls(): void {
        const rowsArray = this.rows;
        // 🟢 USANDO lastOverride()
        const lastOverride = this.lastOverrideSig(); // Leer el valor de la signal

        if (!lastOverride) {
            return; // No hay información de cambio, no hay nada que resetear.
        }

        const { fieldName, rowIndex } = lastOverride;

        // Solo reseteamos el campo afectado en la fila afectada
        if (rowsArray && rowsArray.length > rowIndex) {
            const rowGroup = rowsArray.at(rowIndex) as FormGroup;
            const control = rowGroup.get(fieldName) as FormControl | null;

            // Resetear el control para limpiar el valor obsoleto (ej. Provincia).
            if (control) {
                control.setValue(null);
            }
        }
    }
}
