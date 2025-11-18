/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from "@angular/core/testing";

import { FeedbackDialogComponent } from "./feedback-dialog.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

// 1. Define un Mock para MatDialogRef (simula el cierre del diálogo)
const mockMatDialogRef = {
    close: jasmine.createSpy("closeSpy"),
};

// 2. Define datos simulados para MAT_DIALOG_DATA
const mockDialogData = {
    title: "Test Title",
    message: "Test Message",
    type: "success",
};

describe("FeedbackDialogComponent", (): void => {
    let component: FeedbackDialogComponent;
    let fixture: any;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [
                FeedbackDialogComponent, // Si es standalone
                NoopAnimationsModule, // Asegura que las animaciones de Material no fallen
            ],
            // AÑADIR LOS PROVIDERS ACA
            providers: [
                // Provee el mock para MatDialogRef
                { provide: MatDialogRef, useValue: mockMatDialogRef },
                // Provee datos simulados (si tu componente los inyecta)
                { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FeedbackDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });

    // TEST onAcceptClick()
    it("should call MatDialogRef.close with true when calling onAcceptClick()", (): void => {
        component.onAcceptClick();

        // Verificamos que se llamó a close() del mock con el valor esperado (true)
        expect(mockMatDialogRef.close).toHaveBeenCalledWith(true);
    });

    //  // TEST onAcceptClick() para onCancelClick()
    it("should call MatDialogRef.close with false when calling onCancelClick()", (): void => {
        component.onCancelClick();

        // Verificamos que se llamó a close() del mock con el valor esperado (false)
        expect(mockMatDialogRef.close).toHaveBeenCalledWith(false);
    });
});
