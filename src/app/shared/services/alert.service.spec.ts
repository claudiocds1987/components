import { TestBed } from "@angular/core/testing";

import { AlertService } from "./alert.service";

describe("AlertService", (): void => {
    let service: AlertService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AlertService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
