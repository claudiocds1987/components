import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { EmployeeGridInfiniteComponent } from "./employee-grid-infinite.component";

describe("EmployeeGridInfiniteComponent", (): void => {
    let component: EmployeeGridInfiniteComponent;
    let fixture: ComponentFixture<EmployeeGridInfiniteComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [
                EmployeeGridInfiniteComponent,
                HttpClientTestingModule,
                NoopAnimationsModule,
                RouterTestingModule,
                MatSnackBarModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EmployeeGridInfiniteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
