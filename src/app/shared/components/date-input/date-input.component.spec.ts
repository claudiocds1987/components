import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateInputComponent } from "./date-input.component";

describe("DateInputComponent", (): void => {
    let component: DateInputComponent;
    let fixture: ComponentFixture<DateInputComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [DateInputComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DateInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
