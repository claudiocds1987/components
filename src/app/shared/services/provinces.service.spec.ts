import { TestBed } from "@angular/core/testing";

import { ProvincesService } from "./provinces.service";

describe("ProvincesService", (): void => {
    let service: ProvincesService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ProvincesService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
