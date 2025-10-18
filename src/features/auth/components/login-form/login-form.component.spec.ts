import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LoginFormComponent } from "./login-form.component";

describe("LoginFormComponent", (): void => {
    let component: LoginFormComponent;
    let fixture: ComponentFixture<LoginFormComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [LoginFormComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(LoginFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
});
