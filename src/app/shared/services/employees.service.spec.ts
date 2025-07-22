import { TestBed } from "@angular/core/testing";

import { EmployeesService } from "./employees.service";

describe("EmployeesService", (): void => {
    let service: EmployeesService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(EmployeesService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
