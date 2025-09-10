import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FeedbackComponent } from "./feedback.component";

describe("FeedbackComponent", (): void => {
    let component: FeedbackComponent;
    let fixture: ComponentFixture<FeedbackComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [FeedbackComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(FeedbackComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
