import { TestBed } from "@angular/core/testing";

import { PositionService } from "./position.service";

describe("PositionService", (): void => {
    let service: PositionService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PositionService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
