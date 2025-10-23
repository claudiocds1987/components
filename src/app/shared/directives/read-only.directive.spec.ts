import { ReadOnlyDirective } from "./read-only.directive";

describe("ReadOnlyDirective", (): void => {
    it("should create an instance", (): void => {
        const directive = new ReadOnlyDirective();
        expect(directive).toBeTruthy();
    });
});
