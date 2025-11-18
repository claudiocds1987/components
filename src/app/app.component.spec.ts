import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { AppComponent } from "./app.component";

describe("AppComponent", (): void => {
    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [
                AppComponent,
                HttpClientTestingModule,
                NoopAnimationsModule,
                RouterTestingModule,
                MatSnackBarModule,
            ],
        }).compileComponents();
    });

    it("should create the app", (): void => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it("should have the 'components' title", (): void => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app.title).toEqual("components");
    });

    it("should render title", (): void => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector("h1")?.textContent).toContain(
            "Hello, components",
        );
    });
});
