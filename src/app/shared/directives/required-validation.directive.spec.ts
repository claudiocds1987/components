import { RequiredValidationDirective } from "./required-validation.directive";

describe("RequiredValidationDirective", (): void => {
    it("should create an instance", (): void => {
        const directive = new RequiredValidationDirective();
        expect(directive).toBeTruthy();
    });
});
