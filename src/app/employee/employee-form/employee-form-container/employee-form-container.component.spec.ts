import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EmployeeFormContainerComponent } from "./employee-form-container.component";

describe("EmployeeFormContainerComponent", (): void => {
    let component: EmployeeFormContainerComponent;
    let fixture: ComponentFixture<EmployeeFormContainerComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [EmployeeFormContainerComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EmployeeFormContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
