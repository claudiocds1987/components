import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EmployeeGridComponent } from "./employee-grid.component";

describe("EmployeeGridComponent", (): void => {
    let component: EmployeeGridComponent;
    let fixture: ComponentFixture<EmployeeGridComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [EmployeeGridComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EmployeeGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
