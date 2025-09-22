import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateRangeComponent } from "./date-range.component";

describe("DateRangeComponent", (): void => {
    let component: DateRangeComponent;
    let fixture: ComponentFixture<DateRangeComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [DateRangeComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DateRangeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
