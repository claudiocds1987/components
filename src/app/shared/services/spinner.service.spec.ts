import { TestBed } from "@angular/core/testing";

import { SpinnerService } from "./spinner.service";

describe("SpinnerService", (): void => {
    let service: SpinnerService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SpinnerService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
