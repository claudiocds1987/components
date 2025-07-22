import { TestBed } from "@angular/core/testing";
import { EmployeeService } from "./employee.service";

describe("EmployesService", (): void => {
    let service: EmployeeService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(EmployeeService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
