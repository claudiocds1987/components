import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EmployeeFormArrayComponent } from "./employee-form-array.component";

describe("EmployeeFormArrayComponent", (): void => {
    let component: EmployeeFormArrayComponent;
    let fixture: ComponentFixture<EmployeeFormArrayComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [EmployeeFormArrayComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EmployeeFormArrayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
