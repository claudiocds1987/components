import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { SnackbarComponent } from "./snackbar.component";

describe("SnackbarComponent", (): void => {
    let component: SnackbarComponent;
    let fixture: ComponentFixture<SnackbarComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [
                SnackbarComponent,
                NoopAnimationsModule,
                HttpClientTestingModule,
                RouterTestingModule,
                MatSnackBarModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SnackbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
