import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EmployeeFormComponent } from "./employee-form.component";

describe("EmployeeFormComponent", (): void => {
    let component: EmployeeFormComponent;
    let fixture: ComponentFixture<EmployeeFormComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [EmployeeFormComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EmployeeFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
