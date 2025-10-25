import { DuplicatedEmailValidationDirective } from "./duplicated-email-validation.directive";

describe("DuplicatedEmailValidationDirective", (): void => {
    it("should create an instance", (): void => {
        const directive = new DuplicatedEmailValidationDirective();
        expect(directive).toBeTruthy();
    });
});
