import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GridFilterComponent } from "./grid-filter.component";

describe("GridFilterComponent", (): void => {
    let component: GridFilterComponent;
    let fixture: ComponentFixture<GridFilterComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [GridFilterComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GridFilterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
