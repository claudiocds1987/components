/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Component,
    Input,
    signal,
    OnInit,
    OnDestroy,
    computed,
    inject,
    effect,
    OnChanges,
    SimpleChanges,
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
    Validators,
} from "@angular/forms";
import { Subscription } from "rxjs";
import { FormArrayData, ValidationKey } from "../../models/formArrayData.model";
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
    ],
    templateUrl: "./form-array.component.html",
    styleUrl: "./form-array.component.scss",
})
export class FormArrayComponent implements OnChanges, OnInit, OnDestroy {
    // Configuración de los campos que viene del componente padre
    @Input() data: FormArrayData[] = [];

    // Formulario principal que contendrá el FormArray
    mainForm: FormGroup;

    // Signal que contiene las opciones disponibles después de aplicar la lógica de unicidad
    // (Solo contiene las opciones que NADIE ha seleccionado)
    availableOptionsMap = signal<Map<string, SelectItem[]>>(new Map());

    // Acceso fácil al FormArray 'rows'
    get rows(): FormArray {
        return this.mainForm.get("rows") as FormArray;
    }

    // Signal computada para tener los campos ordenados para el template
    sortedFields = computed((): FormArrayData[] => {
        return this.data
            .slice()
            .sort((a, b): number => a.columnPosition - b.columnPosition);
    });

    // NUEVA SIGNAL: Contiene TODOS los valores seleccionados (incluyendo duplicados) por campo único.
    // Clave: fieldName (string), Valor: lista de IDs seleccionados (string[] | number[])
    private selectedValuesByField = signal<Record<string, (string | number)[]>>(
        {},
    );
    private valueChangesSubscription: Subscription = new Subscription();
    private isInitialized = false; // Bandera para controlar la inicialización

    // Mapa para almacenar los items originales de los 'select' (necesario para el filtrado)
    private originalSelectItemsMap = new Map<string, SelectItem[]>();

    // Inyección de FormBuilder usando inject()
    private _fb = inject(FormBuilder);

    constructor() {
        // Inicializa el FormGroup principal que contendrá el FormArray
        this.mainForm = this._fb.group({
            rows: this._fb.array([]),
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // La corrección clave: Inicializar la estructura del formulario solo cuando
        // 'data' ha llegado y ya no es un array vacío.
        if (changes["data"] && this.data.length > 0) {
            console.log("ngOnChanges: Data recibida y no vacía.");
            if (!this.isInitialized) {
                this._initFormStructure();
                this.isInitialized = true;
            } else {
                // Si la data cambia después de la inicialización, solo actualizamos los mapas
                // y recalculamos opciones, pero no volvemos a añadir filas.
                this.initializeSelectMaps();
                this.calculateAvailableOptions();
            }
        }
    }

    ngOnInit(): void {
        // Solo configuramos la suscripción aquí. El FormArray estará vacío al principio,
        // pero la suscripción a valueChanges se activará correctamente cuando se añada la primera fila.
        this.setupValueChangeSubscription();
    }

    ngOnDestroy(): void {
        this.valueChangesSubscription.unsubscribe();
    }

    trackByFn(index: number, item: AbstractControl): string {
        return item.value;
    }

    isReadyToAdd(): boolean {
        return this.mainForm.valid;
    }

    /**
     * Lógica para mostrar opciones disponibles y re-introducir el valor actual (si no es duplicado)
     */
    getOptionsForField(
        fieldName: string,
        group: AbstractControl,
    ): SelectItem[] {
        const control = group.get(fieldName) as FormControl;
        const currentValue = control.value;
        const fieldConfig = this.data.find(
            (f: FormArrayData): boolean => f.fieldName === fieldName,
        );
        const available = this.availableOptionsMap().get(fieldName) || [];

        if (fieldConfig?.isRepeated || currentValue === null) {
            return available;
        }

        const globallySelected = this.selectedValuesByField()[fieldName] || [];
        const occurrenceCount = globallySelected.filter(
            (val): boolean => val === currentValue,
        ).length;
        const original = this.originalSelectItemsMap.get(fieldName) || [];
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

    /**
     * Utilizado en el template para la clase `(Duplicado)`
     */
    isDuplicate(fieldName: string, itemId: string | number): boolean {
        const globallySelected = this.selectedValuesByField()[fieldName] || [];
        return (
            globallySelected.filter((val): boolean => val === itemId).length > 1
        );
    }
    /**
     * Crea un nuevo FormGroup (una "fila") basándose en la configuración de datos.
     */
    createRowGroup(): FormGroup {
        const groupControls: Record<string, FormControl> = {};

        // Importante: Si 'this.data' está vacío, se creará un FormGroup vacío, pero
        // gracias a la corrección en ngOnChanges, esto ahora se llama con data.length > 0.
        for (const field of this.data) {
            const validators = this.getValidators(field);
            // Creamos el FormControl para el campo actual con null o "" como valor inicial
            groupControls[field.fieldName] = this._fb.control(null, validators);
        }
        return this._fb.group(groupControls);
    }

    /**
     * Añade una nueva fila (FormGroup) al FormArray.
     */
    addRow(): void {
        this.rows.push(this.createRowGroup());
        this.rows.markAsDirty(); // Para forzar la re-validación/re-cálculo si es necesario.
    }

    /**
     * Elimina una fila (FormGroup) del FormArray por su índice.
     */
    removeRow(index: number): void {
        if (this.rows.length > 1) {
            this.rows.removeAt(index); // Esta línea es la que elimina el elemento correcto
            // Gracias a trackByFn, el DOM se actualizará correctamente.
            this.rows.markAsDirty();
        } else {
            console.warn(
                "Debe haber al menos un elemento en el formulario (FormArray).",
            );
        }
    }

    /**
     * Verifica si un campo tiene la validación 'required'.
     */
    isRequired(field: FormArrayData): boolean {
        return (
            field.validations?.some(
                (v): boolean => v.type === ValidationKey.required,
            ) ?? false
        );
    }

    /**
     * Inicializa los mapas de opciones, añade la primera fila y calcula las opciones.
     * Se llama desde ngOnChanges cuando la data de los campos está disponible.
     */
    private _initFormStructure(): void {
        // 1. Inicializa los mapas de opciones (depende de this.data)
        this.initializeSelectMaps();

        // 2. Si no hay filas, añade la primera
        if (this.rows.length === 0) {
            this.addRow();
        }

        // 3. Calcular las opciones iniciales
        this.calculateAvailableOptions();
    }

    /**
     * Inicializa el mapa con todas las opciones originales de los campos de tipo 'select'.
     */
    private initializeSelectMaps(): void {
        this.data.forEach((field: FormArrayData): void => {
            if (field.fieldType === "select" && field.selectItems) {
                // Clonar la lista para asegurar inmutabilidad
                this.originalSelectItemsMap.set(field.fieldName, [
                    ...field.selectItems,
                ]);
            }
        });
    }

    /**
     * Configura la suscripción para recalcular las opciones disponibles
     * cada vez que cambia el valor del FormArray.
     */
    private setupValueChangeSubscription(): void {
        // Limpiar la suscripción existente para evitar duplicados si se llama más de una vez
        this.valueChangesSubscription.unsubscribe();
        this.valueChangesSubscription = new Subscription();

        // Suscripción al FormArray para detectar cambios en cualquier fila.
        this.valueChangesSubscription.add(
            this.rows.valueChanges.subscribe((): void => {
                this.calculateAvailableOptions();
            }),
        );
    }

    /**
     * Recalcula las opciones disponibles para todos los campos 'select'
     * que no permiten repetición (isRepeated: false).
     */
    private calculateAvailableOptions(): void {
        const newAvailableOptionsMap = new Map<string, SelectItem[]>();
        const newSelectedValues: Record<string, (string | number)[]> = {}; // Usamos este para la nueva Signal

        // 1. Recolectar todos los valores seleccionados para campos únicos
        this.data.forEach((field: FormArrayData): void => {
            if (field.fieldType === "select" && !field.isRepeated) {
                const selected: (string | number)[] = [];
                this.rows.controls.forEach((group: AbstractControl): void => {
                    const control = group.get(field.fieldName);
                    // Usar '== null' para capturar null y undefined si el control no existe o no tiene valor
                    if (control?.value != null) {
                        selected.push(control.value);
                    }
                });
                newSelectedValues[field.fieldName] = selected; // Guardamos TODOS, incluyendo duplicados
            }
        });

        // Actualizar la nueva Signal con todos los valores seleccionados (paso clave)
        this.selectedValuesByField.set(newSelectedValues);

        // 2. Filtrar las opciones originales
        this.data.forEach((field: FormArrayData): void => {
            const originalItems = this.originalSelectItemsMap.get(
                field.fieldName,
            );
            if (field.fieldType === "select" && originalItems) {
                if (!field.isRepeated) {
                    // Usamos un Set para obtener solo los IDs seleccionados una o más veces (ej: 'USA')
                    const selected = newSelectedValues[field.fieldName] || [];
                    const usedUniqueIds = new Set(selected);

                    // Filtra: mantiene solo las opciones que NO han sido seleccionadas por NADIE
                    const filteredItems = originalItems.filter(
                        (item: SelectItem): boolean =>
                            !usedUniqueIds.has(item.id),
                    );
                    newAvailableOptionsMap.set(field.fieldName, filteredItems);
                } else {
                    // Si es repetible, mantiene todas las opciones
                    newAvailableOptionsMap.set(field.fieldName, originalItems);
                }
            }
        });

        // Actualizar el signal con el nuevo mapa de opciones DISPONIBLES
        this.availableOptionsMap.set(newAvailableOptionsMap);
    }

    /**
     * Obtiene la lista de validadores para un campo dado.
     */
    private getValidators(field: FormArrayData): any[] {
        const fieldValidators: any[] = [];
        if (field.validations) {
            for (const validation of field.validations) {
                switch (validation.type) {
                    case ValidationKey.required:
                        fieldValidators.push(Validators.required);
                        break;
                    case ValidationKey.minLength:
                        if (validation.value) {
                            fieldValidators.push(
                                Validators.minLength(validation.value),
                            );
                        }
                        break;
                    case ValidationKey.maxLength:
                        if (validation.value) {
                            fieldValidators.push(
                                Validators.maxLength(validation.value),
                            );
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
