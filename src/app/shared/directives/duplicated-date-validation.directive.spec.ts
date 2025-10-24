import { DuplicatedDateValidation } from "./duplicated-date-validation.directive";

describe("DuplicatedDateValidation", (): void => {
    it("should create an instance", (): void => {
        const directive = new DuplicatedDateValidation();
        expect(directive).toBeTruthy();
    });
});
