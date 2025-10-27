import { CustomValidationMessageDirective } from "./custom-validation-message.directive";

describe("CustomValidationMessageDirective", (): void => {
    it("should create an instance", (): void => {
        const directive = new CustomValidationMessageDirective();
        expect(directive).toBeTruthy();
    });
});
