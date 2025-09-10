import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FeedbackDialogComponent } from "./feedback-dialog.component";

describe("FeedbackDialogComponent", (): void => {
    let component: FeedbackDialogComponent;
    let fixture: ComponentFixture<FeedbackDialogComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [FeedbackDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(FeedbackDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
