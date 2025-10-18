import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LoginPageComponent } from "./login-page.component";

describe("LoginPageComponent", (): void => {
    let component: LoginPageComponent;
    let fixture: ComponentFixture<LoginPageComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [LoginPageComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(LoginPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
