import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { EmployeeService } from "./employee.service";

describe("EmployesService", (): void => {
    let service: EmployeeService;

    beforeEach((): void => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                NoopAnimationsModule,
                RouterTestingModule,
                MatSnackBarModule,
            ],
        });
        service = TestBed.inject(EmployeeService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
