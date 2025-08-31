import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EmployeeGridPaginationComponent } from "./employee-grid-pagination.component";

describe("EmployeeGridComponent", (): void => {
    let component: EmployeeGridPaginationComponent;
    let fixture: ComponentFixture<EmployeeGridPaginationComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [EmployeeGridPaginationComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EmployeeGridPaginationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
