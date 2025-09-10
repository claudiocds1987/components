import { TestBed } from "@angular/core/testing";

import { FeedbackDialogService } from "./feedback-dialog.service";

describe("FeedbackDialogService", (): void => {
    let service: FeedbackDialogService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(FeedbackDialogService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
