/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
    flush,
} from "@angular/core/testing";
import { FormArrayComponent } from "./form-array.component";
import {
    FormArray,
    FormGroup,
    FormBuilder,
    ReactiveFormsModule,
    FormControl,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import {
    FormArrayConfig,
    ValidationKey,
} from "../../models/form-array-config.model";
import { SelectItem } from "../../models/select-item.model";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Component } from "@angular/core";
import { CustomValidationMessageDirective } from "../../directives/custom-validation-message.directive";
import { By } from "@angular/platform-browser";

// 1. Define el componente Host para probar la directiva
@Component({
    // La plantilla DEBE usar la directiva Y enlazar el control para NgControl
    // NOTE: la directiva tiene selector "appCustomValidationMessage" (attribute).
    template:
        "<input type='text' [formControl]='testControl' appCustomValidationMessage />",
    standalone: true,
    // ReactiveFormsModule para que [formControl] funcione
    imports: [CustomValidationMessageDirective, ReactiveFormsModule],
})
class TestHostComponent {
    // Declara el FormControl en el componente Host
    testControl = new FormControl("");
}

type OverrideSignalType = {
    fieldName: string;
    rowIndex: number;
} | null;

// --- MOCK DE DATOS DE CONFIGURACIÓN ---

const mockSelectItem: SelectItem[] = [
    { id: 1, description: "Opción A" },
    { id: 2, description: "Opción B" },
    { id: 3, description: "Opción C" },
];

const mockConfig: FormArrayConfig[] = [
    // Campo de texto simple requerido
    {
        fieldName: "name",
        fieldType: "text",
        label: "Nombre",
        placeHolder: "Escriba el nombre",
        isRepeated: true,
        validations: [{ type: ValidationKey.required, value: "true" }],
    },
    // Campo de selección único (isRepeated: false)
    {
        fieldName: "item",
        fieldType: "select",
        label: "Item",
        placeHolder: "Seleccione un ítem",
        isRepeated: false,
        selectItems: mockSelectItem,
        validations: [{ type: ValidationKey.required, value: "true" }],
    },
    // Campos de fecha con validación de rango
    {
        fieldName: "start_date",
        fieldType: "date",
        label: "Fecha Inicio",
        placeHolder: "DD/MM/AAAA",
        isRepeated: true,
        validations: [{ type: ValidationKey.required, value: "true" }],
    },
    {
        fieldName: "end_date",
        fieldType: "date",
        label: "Fecha Fin",
        placeHolder: "DD/MM/AAAA",
        isRepeated: true,
        validations: [
            { type: ValidationKey.required, value: "true" },
            { type: ValidationKey.validateRange, value: "start_date" },
        ],
    },
];

const mockData = [
    {
        name: "Fila 1",
        item: 1,
        start_date: "2024-01-01",
        end_date: "2024-01-31",
    },
    {
        name: "Fila 2",
        item: 2,
        start_date: "2024-02-01",
        end_date: "2024-02-29",
    },
];

const resetConfig: FormArrayConfig[] = [
    {
        fieldName: "country",
        fieldType: "text",
        label: "País",
        placeHolder: "País",
        isRepeated: true,
        emitChangeToParent: true,
    },
    {
        fieldName: "province",
        fieldType: "select",
        label: "Provincia",
        placeHolder: "Provincia",
        isRepeated: true,
        selectItems: mockSelectItem,
    },
];
// --- FIN MOCK DE DATOS ---

describe("FormArrayComponent", (): void => {
    let component: FormArrayComponent;
    let fixture: ComponentFixture<FormArrayComponent>;
    // Helper para obtener el FormArray 'rows'
    const getRows = (): FormArray =>
        component.mainForm.get("rows") as FormArray;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [
                FormArrayComponent,
                ReactiveFormsModule,
                CommonModule,
                NoopAnimationsModule,
            ],
            providers: [FormBuilder],
        }).compileComponents();

        fixture = TestBed.createComponent(FormArrayComponent);
        component = fixture.componentInstance;

        // Llamar a detectChanges() aquí asegura que el mainForm se inicialice
        fixture.detectChanges();
    });

    it("should create the component and initialize the main form", (): void => {
        expect(component).toBeTruthy();
        expect(component.mainForm).toBeDefined();
        expect(getRows()).toBeDefined();
        expect(getRows().length).toBe(0);
    });

    // -------------------------------------------------------------------------
    // 1. Tests de Inicialización y ngOnChanges
    // -------------------------------------------------------------------------
    it("should initialize structure and add a row when config is provided and no initial data exists", (): void => {
        component.formArrayConfig = mockConfig;
        component.data = null;

        fixture.detectChanges(); // Ejecuta ngOnChanges

        expect(component["isInitialized"]).toBeTrue();
        expect(getRows().length).toBe(1, "Debería agregar una fila vacía.");

        const row = getRows().at(0) as FormGroup;
        expect(row.contains("name")).toBeTrue();
        expect(row.get("name")?.value).toBeNull();
    });

    // --- MODIFICACIÓN DEL TEST FALLIDO ---
    it("should load initial data and set form as pristine when data is provided", (): void => {
        // 1. Recibir CONFIGURACIÓN (Inicializa la estructura y establece isInitialized = true)
        component.formArrayConfig = mockConfig;
        fixture.detectChanges();
        // En este punto, el FormArray existe y isInitialized es true
        expect(component["isInitialized"]).toBeTrue();
        // 2. Recibir DATOS (Activa la rama 'else if (this.isInitialized)' y llama a _resetAndLoadRows)
        component.data = mockData;
        fixture.detectChanges();

        // 1. Número de filas
        expect(getRows().length)
            .withContext("Debería crear una fila por cada ítem de data.")
            .toBe(2);

        // 2. Valores cargados
        // Asegúrate de que los controles existan antes de acceder a su valor
        const row0 = getRows().at(0);
        const row1 = getRows().at(1);

        expect(row0.value.name).toBe("Fila 1");
        expect(row1.value.item).toBe(2);

        // 3. Estado Pristine
        expect(component.mainForm.pristine)
            .withContext(
                "El formulario debe ser pristine después de cargar data inicial.",
            )
            .toBe(true);
    });

    it("should flatten nested data objects on load", (): void => {
        const nestedData = [
            {
                employee: { name: "Juan" },
                item: 1,
                start_date: "2024-01-01",
                end_date: "2024-01-31",
            },
        ];
        // 1. Configuración de la estructura
        component.formArrayConfig = mockConfig;
        fixture.detectChanges(); // Inicializa
        // 2. Carga de datos
        component.data = nestedData;
        fixture.detectChanges(); // Carga datos

        expect(getRows().length).toBe(1); // Añadido para verificar la carga
        expect(getRows().at(0).value.name).toBe("Juan");
    });

    // -------------------------------------------------------------------------
    // 2. Tests de Manipulación de Filas
    // -------------------------------------------------------------------------
    it("should add a row when addRow() is called and mark the FormArray as dirty", (): void => {
        component.formArrayConfig = mockConfig;
        fixture.detectChanges(); // 1 fila

        expect(getRows().length).toBe(1);
        getRows().markAsPristine();

        component.addRow();

        expect(getRows().length).toBe(2);
        expect(getRows().dirty).toBeTrue();
    });

    it("should remove a row when removeRow() is called", (): void => {
        component.formArrayConfig = mockConfig;
        component.data = mockData;
        fixture.detectChanges(); // 2 filas

        expect(getRows().length).toBe(2);

        component.removeRow(0); // Eliminar la primera fila

        expect(getRows().length).toBe(1);
        expect(getRows().at(0).value.name).toBe("Fila 2");
    });

    it("should not allow adding a row if maxRows is reached", (): void => {
        component.formArrayConfig = mockConfig;
        component.maxRows = 1;
        component.data = [
            {
                name: "Existente",
                item: 1,
                start_date: "2024-01-01",
                end_date: "2024-01-31",
            },
        ]; // Asegurar que los datos iniciales llenen todos los campos requeridos
        fixture.detectChanges(); // Crea 1 fila

        expect(getRows().length).toBe(1);

        // La fila ya debería ser válida debido a los datos iniciales
        const row = getRows().at(0) as FormGroup;
        row.updateValueAndValidity();

        // Verificar la lógica de restricción: maxRows > rows.length
        expect(component.isReadyToAdd()).toBeFalse();
        component.addRow();

        expect(getRows().length).toBe(
            1,
            "No debería agregar una fila si el máximo se alcanzó.",
        );
    });

    // -------------------------------------------------------------------------
    // 3. Tests de Validación y Unicidad (Select)
    // -------------------------------------------------------------------------
    it("should apply required validator to a control", (): void => {
        component.formArrayConfig = mockConfig;
        fixture.detectChanges();

        const row = getRows().at(0) as FormGroup;
        const nameControl = row.get("name");

        expect(nameControl?.errors?.["required"]).toBeTrue();
        nameControl?.setValue("Valor");
        expect(nameControl?.errors).toBeNull();
    });

    it("should apply row-level dateRangeValidator and show error", (): void => {
        component.formArrayConfig = mockConfig;
        fixture.detectChanges();
        component.addRow();

        const row = getRows().at(1) as FormGroup;
        const startDate = row.get("start_date");
        const endDate = row.get("end_date");

        // Simular un rango inválido (Fecha Fin < Fecha Inicio)
        startDate?.setValue("2024-03-31");
        endDate?.setValue("2024-03-01");
        row.updateValueAndValidity();

        // El error 'dateRangeInvalid' está a nivel de FormGroup (fila)
        expect(row.errors?.["dateRangeInvalid"]).toBeTrue();
    });

    it("should filter available options for unique fields (isRepeated: false)", fakeAsync((): void => {
        // 1. CONFIGURACIÓN: Inicializa la estructura y añade la Fila 0
        component.formArrayConfig = mockConfig;
        fixture.detectChanges(); // Ejecuta ngOnChanges (configReceived && !isInitialized)

        // Verificación: Debe haber 1 fila
        expect(getRows().length).toBe(1);

        // 2. AÑADIR FILA: Añade la Fila 1
        component.addRow();
        fixture.detectChanges(); // Asegura que el DOM/componente detecte la nueva fila
        tick(100); // Esperar debounce para la suscripción de valueChanges
        const row0 = getRows().at(0) as FormGroup;
        const row1 = getRows().at(1) as FormGroup;
        // Verificación: Debe haber 2 filas
        expect(getRows().length).toBe(2);
        // 3. Prueba la unicidad
        // Inicialmente, ambas filas tienen 3 opciones
        let optionsRow1 = component.getOptionsForField("item", row1);
        expect(optionsRow1.length).toBe(3); // (Opción A, B, C)
        // 4. Seleccionar Opción A (id: 1) en Fila 0
        row0.get("item")?.setValue(1);
        // Necesario: Forzar la re-validación y esperar el debounce para
        // que _calculateSelectAvailableOptions() se ejecute correctamente.
        getRows().updateValueAndValidity();
        fixture.detectChanges();
        tick(300); // Usamos 300ms para cubrir el debounce de statusChanges (si influye)
        // Ahora, Fila 1 no debería tener Opción A
        optionsRow1 = component.getOptionsForField("item", row1);
        expect(optionsRow1.length).toBe(2); // (Opción B, Opción C)
        expect(optionsRow1.some((i): boolean => i.id === 1)).toBeFalse();
        // Fila 0 aún debe ver su opción seleccionada (Opción A) + las disponibles (Opción B, Opción C)
        const optionsRow0 = component.getOptionsForField("item", row0);
        expect(optionsRow0.length).toBe(3);

        flush();
    }));

    // -------------------------------------------------------------------------
    // 4. Tests de Outputs y Suscripciones (Async)
    // -------------------------------------------------------------------------
    it("should emit fieldChange after debounceTime when emitChangeToParent is true", fakeAsync((): void => {
        const emitConfig: FormArrayConfig[] = [
            {
                fieldName: "country",
                fieldType: "text",
                label: "País",
                placeHolder: "País",
                isRepeated: true,
                emitChangeToParent: true,
            },
        ];
        component.formArrayConfig = emitConfig;
        fixture.detectChanges();

        spyOn(component.fieldChange, "emit");

        const row = getRows().at(0) as FormGroup;
        const countryControl = row.get("country");

        countryControl?.setValue("Chile");
        // Esperar debounceTime(100)
        tick(100);

        expect(component.fieldChange.emit).toHaveBeenCalledWith({
            fieldName: "country",
            value: "Chile",
            indexRow: 0,
        });

        flush();
    }));

    it("should emit emitFormArrayValue only when FormArray status is VALID (after debounce)", fakeAsync((): void => {
        component.formArrayConfig = mockConfig;
        fixture.detectChanges();

        const emitSpy = spyOn(component.emitFormArrayValue, "emit");

        const row = getRows().at(0) as FormGroup;

        // 1. Invalidación
        row.get("name")?.setValue(null);
        getRows().updateValueAndValidity();
        tick(300);
        // Se espera que emita null cuando es INVALID (o el valor inicial si no se ha emitido nada antes)
        expect(emitSpy).toHaveBeenCalledWith(null);

        emitSpy.calls.reset();

        // 2. Validación
        row.get("name")?.setValue("Test");
        row.get("item")?.setValue(1);
        row.get("start_date")?.setValue("2024-01-01");
        row.get("end_date")?.setValue("2024-01-31");
        getRows().updateValueAndValidity(); // -> VALID
        tick(300);
        // Se espera que emita un Array cuando es VALID
        expect(emitSpy).toHaveBeenCalledWith(jasmine.any(Array));

        flush();
    }));

    // -------------------------------------------------------------------------
    // 5. Tests de Signal Inputs (Cascada y Reset)
    // -------------------------------------------------------------------------
    it("should reset the control to null when lastOverrideSig changes", (): void => {
        // 1. Configuración de la estructura
        component.formArrayConfig = resetConfig;
        fixture.detectChanges(); // Inicializa la estructura

        // 2. Carga de datos
        component.data = [{ country: "AR", province: 2 }];
        fixture.detectChanges(); // Carga datos

        const row0 = getRows().at(0) as FormGroup;
        expect(row0.get("province")?.value).toBe(
            2,
            "Valor inicial debe ser 2.",
        );
        // 3. Simular el cambio de la señal (override)
        spyOnProperty(
            component,
            "lastOverrideSig" as any,
            "get",
        ).and.returnValue(
            (): OverrideSignalType => ({
                fieldName: "province",
                rowIndex: 0,
            }),
        );

        // 4. Forzar la ejecución de ngOnChanges cambiando un Input @Input()
        component.id = "force-update-1"; // Cualquier cambio en un @Input()
        fixture.detectChanges(); // Ejecuta ngOnChanges, que llama a _applyOverridesAndResetControls()

        expect(row0.get("province")?.value)
            .withContext(
                "El valor debe ser reseteado a null después del override.",
            )
            .toBeNull();
    });

    // ------------------------------------------------------------------------
    // Test de directiva
    // ------------------------------------------------------------------------
    describe("CustomValidationMessageDirective", (): void => {
        // beforeEach PARA AISLAR LA CONFIGURACIÓN
        beforeEach(async (): Promise<void> => {
            // 1. Limpiamos el TestBed del FormArrayComponent padre
            TestBed.resetTestingModule();
            // 2. Configuramos el TestBed SÓLO para la directiva, permitiendo la inyección de ElementRef
            await TestBed.configureTestingModule({
                // El TestHostComponent ya importa la directiva y ReactiveFormsModule.
                imports: [TestHostComponent],
            }).compileComponents();
        });
        // afterEach para limpiar después del test aislado
        afterEach((): void => {
            TestBed.resetTestingModule();
        });

        it("should create an instance (via Test Host)", (): void => {
            // El TestHostComponent fue configurado en el beforeEach de arriba.
            const hostFixture = TestBed.createComponent(TestHostComponent);
            hostFixture.detectChanges();
            // 1. Encontrar el DebugElement que TIENE la directiva.
            // Buscar el DebugElement que tenga la directiva aplicada.
            const inputDebugEl = hostFixture.debugElement.query(
                By.directive(CustomValidationMessageDirective),
            );

            expect(inputDebugEl)
                .withContext("No se encontró el elemento con la directiva.")
                .toBeTruthy();

            // 2. Obtener la instancia de la directiva.
            const directiveInstance = inputDebugEl.injector.get(
                CustomValidationMessageDirective,
            );

            expect(directiveInstance)
                .withContext("La directiva no fue instanciada.")
                .toBeTruthy();
        });
    });

    // -------------------------------------------------------------------------
    // Tests de Limpieza
    // -------------------------------------------------------------------------
    it("should unsubscribe from all subscriptions on ngOnDestroy", (): void => {
        component.formArrayConfig = mockConfig;
        fixture.detectChanges();
        // Obtener la subscripción DESPUÉS de ngOnChanges (detectChanges)
        const subscription = component["_valueChangesSubscription"];
        spyOn(subscription, "unsubscribe");

        component.ngOnDestroy();

        expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
    });
});
