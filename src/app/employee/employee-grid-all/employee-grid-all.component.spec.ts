import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EmployeeGridAllComponent } from "./employee-grid-all.component";

describe("EmployeeGridAllComponent", (): void => {
    let component: EmployeeGridAllComponent;
    let fixture: ComponentFixture<EmployeeGridAllComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [EmployeeGridAllComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EmployeeGridAllComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
