import { TestBed } from "@angular/core/testing";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";

import { ProvincesService } from "./provinces.service";
import { SelectItem } from "../models/select-item.model";
import { Province } from "../models/province.model";

/* describe("ProvincesService", (): void => {
    let service: ProvincesService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ProvincesService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
}); */

describe("ProvincesService", (): void => {
    let service: ProvincesService;
    let httpMock: HttpTestingController;
    const apiUrl = "https://json-server-data-fpl9.onrender.com/provinces";

    beforeEach((): void => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });

        service = TestBed.inject(ProvincesService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        httpMock.verify();
    });

    // --- 1. Test Básico de Creación ---
    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });

    // --- 2. Test para getProvinces() ---
    it("should return all SelectItems (provinces) via getProvinces()", (): void => {
        // Los datos simulados coinciden con SelectItem (id, description)
        const mockSelectItems: SelectItem[] = [
            { id: 1, description: "Tucumán" },
            { id: 2, description: "Salta" },
        ];

        service.getProvinces().subscribe((items: SelectItem[]): void => {
            expect(items.length).toBe(2);
            expect(items).toEqual(mockSelectItems);
        });

        const req = httpMock.expectOne(apiUrl);
        expect(req.request.method).toBe("GET");
        req.flush(mockSelectItems);
    });

    // --- 3. Test para getProvincesById(provinceId) ---
    it("should return a single Province when calling getProvincesById(1)", (): void => {
        // Los datos simulados coinciden con Province (id, countryId, description)
        const mockProvince: Province[] = [
            {
                id: 1,
                countryId: 10,
                description: "Mendoza", // Usando 'description'
            },
        ];
        const provinceId = 1;

        service
            .getProvincesById(provinceId)
            .subscribe((province: Province[]): void => {
                expect(province.length).toBe(1);
                expect(province[0].description).toBe("Mendoza"); // Verificando 'description'
            });

        const req = httpMock.expectOne(`${apiUrl}/${provinceId}`);
        expect(req.request.method).toBe("GET");
        req.flush(mockProvince);
    });

    // --- 4. Test para getProvincesByCountry(countryId) ---
    it("should return provinces filtered by countryId=5", (): void => {
        // Los datos simulados coinciden con Province (id, countryId, description)
        const mockProvinces: Province[] = [
            { id: 3, countryId: 5, description: "Antofagasta" },
            { id: 4, countryId: 5, description: "Valparaíso" },
        ];
        const countryId = 5;

        service
            .getProvincesByCountry(countryId)
            .subscribe((provinces: Province[]): void => {
                expect(provinces.length).toBe(2);
                expect(
                    provinces.every((p): boolean => p.countryId === countryId),
                ).toBeTrue();
            });

        const expectedUrl = `${apiUrl}?countryId=${countryId}`;
        const req = httpMock.expectOne(expectedUrl);

        expect(req.request.method).toBe("GET");
        req.flush(mockProvinces);
    });
});
