import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MenuCardsComponent } from "./menu-cards.component";

describe("MenuCardsComponent", (): void => {
    let component: MenuCardsComponent;
    let fixture: ComponentFixture<MenuCardsComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [MenuCardsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MenuCardsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
