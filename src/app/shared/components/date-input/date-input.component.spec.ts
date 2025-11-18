import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { DateInputComponent } from "./date-input.component";

describe("DateInputComponent", (): void => {
    let component: DateInputComponent;
    let fixture: ComponentFixture<DateInputComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [
                DateInputComponent,
                NoopAnimationsModule,
                HttpClientTestingModule,
                RouterTestingModule,
                MatSnackBarModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DateInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });

    it("writeValue should set internalControl from ISO string", (): void => {
        component.writeValue("2024-01-02");
        const val = component.internalControl.value;
        expect(val).toBeInstanceOf(Date);
        // Compare ISO date string
        expect((val as Date).toISOString().slice(0, 10)).toBe("2024-01-02");
    });

    it("onInputChange accepts dd/MM/yyyy and notifies parent via registerOnChange", (): void => {
        const changeSpy = jasmine.createSpy("onChangeSpy");
        component.registerOnChange(changeSpy);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = { target: { value: "02/01/2024" } } as any;
        component.onInputChange(event as Event);

        const internal = component.internalControl.value;
        expect(internal).toBeInstanceOf(Date);
        expect(changeSpy).toHaveBeenCalledWith("2024-01-02");
    });

    it("onInputChange sets null for invalid full-format date and notifies null", (): void => {
        const changeSpy = jasmine.createSpy("onChangeSpy2");
        component.registerOnChange(changeSpy);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = { target: { value: "31/02/2024" } } as any;
        component.onInputChange(event as Event);

        expect(component.internalControl.value).toBeNull();
        expect(changeSpy).toHaveBeenCalledWith(null);
    });

    it("registerOnTouched and onInputBlur should call touched callback", (): void => {
        const touchedSpy = jasmine.createSpy("touchedSpy");
        component.registerOnTouched(touchedSpy);

        component.onInputBlur();

        expect(touchedSpy).toHaveBeenCalled();
    });

    it("setDisabledState should disable/enable internal control", (): void => {
        component.setDisabledState(true);
        expect(component.internalControl.disabled).toBeTrue();

        component.setDisabledState(false);
        expect(component.internalControl.enabled).toBeTrue();
    });
});
