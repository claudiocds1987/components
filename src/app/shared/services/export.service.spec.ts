import { TestBed } from "@angular/core/testing";

import { ExportService } from "./export.service";

describe("ExportService", (): void => {
    let service: ExportService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ExportService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
