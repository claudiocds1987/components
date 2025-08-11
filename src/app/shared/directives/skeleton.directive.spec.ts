import { SkeletonDirective } from "./skeleton.directive";

describe("SkeletonDirective", (): void => {
    it("should create an instance", (): void => {
        const directive = new SkeletonDirective();
        expect(directive).toBeTruthy();
    });
});
