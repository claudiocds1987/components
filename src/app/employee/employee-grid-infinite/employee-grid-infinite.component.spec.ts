import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EmployeeGridInfiniteComponent } from "./employee-grid-infinite.component";

describe("EmployeeGridInfiniteComponent", (): void => {
    let component: EmployeeGridInfiniteComponent;
    let fixture: ComponentFixture<EmployeeGridInfiniteComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [EmployeeGridInfiniteComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EmployeeGridInfiniteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
