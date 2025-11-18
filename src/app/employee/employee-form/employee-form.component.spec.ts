import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { EmployeeFormComponent } from "./employee-form.component";

describe("EmployeeFormComponent", (): void => {
    let component: EmployeeFormComponent;
    let fixture: ComponentFixture<EmployeeFormComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [
                EmployeeFormComponent,
                HttpClientTestingModule,
                NoopAnimationsModule,
                RouterTestingModule,
                MatSnackBarModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EmployeeFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
