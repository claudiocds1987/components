import { TestBed } from "@angular/core/testing";

import { CountryService } from "./country.service";

describe("CountryService", (): void => {
    let service: CountryService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CountryService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
