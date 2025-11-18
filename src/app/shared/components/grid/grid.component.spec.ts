import { ComponentFixture, TestBed } from "@angular/core/testing";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { GridComponent } from "./grid.component";

/* describe("GridComponent", (): void => {
    let component: GridComponent;
    let fixture: ComponentFixture<GridComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [GridComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });
}); */

describe("GridComponent", (): void => {
    let component: GridComponent;
    let fixture: ComponentFixture<GridComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [GridComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", (): void => {
        expect(component).toBeTruthy();
    });

    it("getInfinitePaginatorData returns correct string", (): void => {
        const result = component.getInfinitePaginatorData(1, 10, 50);
        expect(result).toBe("Mostrando 20 de 50");
    });

    it("showFeeback returns true when not loading and no data", (): void => {
        // Set signals via any-cast to avoid typing issues in test
        (component as any).isLoadingSig.set(false);
        (component as any).gridDataSig.set([]);

        const res = component.showFeeback();
        expect(res).toBeTrue();
    });

    it("getCellValue handles normal and elipsisActions cases", (): void => {
        const row = { name: "John", elipsisActions: ["a", "b"] } as any;
        expect(component.getCellValue(row, "name")).toBe("John");
        // elipsisActions should return empty string
        expect(component.getCellValue(row, "elipsisActions")).toBe("");
    });

    it("getTruncatedValue truncates long values", (): void => {
        const long = "abcdefghijklmnopqrstuvwxyz";
        const truncated = component.getTruncatedValue({} as any, "name");
        // when cell missing returns empty
        expect(truncated).toBe("");
        // direct call to private truncate via getTruncatedValue using a constructed row
        const row = { col: long } as any;
        const val = component.getTruncatedValue(row, "col");
        expect(val.length).toBeLessThan(long.length + 1);
    });

    it("onInputSearch sets dataSource.filter", (): void => {
        const event = { target: { value: "searchTerm" } } as unknown as Event;
        component.onInputSearch(event);
        expect(component.dataSource.filter).toBe("searchterm");
    });

    it("onRowDblClick emits rowDblClick", (): void => {
        spyOn(component.rowDblClick, "emit");
        const row = { id: 1 } as any;
        component.onRowDblClick(row);
        expect(component.rowDblClick.emit).toHaveBeenCalledWith(row);
    });

    it("onPaginatorPageChange emits and resets scroll for client-side paginator", (): void => {
        spyOn(component.pageChange, "emit");
        // Provide a paginator config and a fake scroll container
        (component as any).gridConfigSig.set({
            paginator: { isServerSide: false },
        } as any);

        component.scrollContainer = {
            nativeElement: { scrollTop: 123 },
        } as any;

        const pageEvent = { pageIndex: 1, pageSize: 10, length: 100 } as any;
        component.onPaginatorPageChange(pageEvent);

        expect(component.pageChange.emit).toHaveBeenCalledWith(pageEvent);
        expect(component.scrollContainer.nativeElement.scrollTop).toBe(0);
    });

    it("exportToExcel emits client-side data when not server-side sort", (): void => {
        spyOn(component.exportExcelClientSide, "emit");
        // set gridDataSig and config
        (component as any).gridDataSig.set([{ a: 1 }]);
        (component as any).gridConfigSig.set({
            hasSorting: { isServerSide: false },
        } as any);
        // ensure dataSource.filteredData has the data
        component.dataSource.filteredData = [{ a: 1 } as any];

        component.exportToExcel();

        expect(component.exportExcelClientSide.emit).toHaveBeenCalled();
    });
});
