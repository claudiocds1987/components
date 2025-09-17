import { TestBed } from "@angular/core/testing";

import { SnackbarService } from "./snackbar.service";

describe("SnackbarService", (): void => {
    let service: SnackbarService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SnackbarService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
