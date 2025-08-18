import { TestBed } from "@angular/core/testing";

import { RandomUserService } from "./random-user.service";

describe("RandomUserService", (): void => {
    let service: RandomUserService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RandomUserService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
