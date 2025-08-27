import { TestBed } from "@angular/core/testing";

import { BreadcrumbService } from "./breadcrumb.service";

describe("BreadcrumbService", (): void => {
    let service: BreadcrumbService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(BreadcrumbService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
