import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { EmployeeGridPaginationComponent } from "./employee-grid-pagination.component";

describe("EmployeeGridComponent", (): void => {
    let component: EmployeeGridPaginationComponent;
    let fixture: ComponentFixture<EmployeeGridPaginationComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [
                EmployeeGridPaginationComponent,
                HttpClientTestingModule,
                NoopAnimationsModule,
                RouterTestingModule,
                MatSnackBarModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EmployeeGridPaginationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
