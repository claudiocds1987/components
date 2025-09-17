import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SnackbarComponent } from "./snackbar.component";

describe("SnackbarComponent", (): void => {
    let component: SnackbarComponent;
    let fixture: ComponentFixture<SnackbarComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [SnackbarComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SnackbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
