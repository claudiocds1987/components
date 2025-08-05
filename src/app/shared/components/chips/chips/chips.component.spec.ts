import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChipsComponent } from "./chips.component";

describe("ChipsComponent", (): void => {
    let component: ChipsComponent;
    let fixture: ComponentFixture<ChipsComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [ChipsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ChipsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
