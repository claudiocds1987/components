import { TestBed } from "@angular/core/testing";

import { CountryService } from "./country.service";
import { SelectItem } from "../models/select-item.model";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";

/* describe("CountryService", (): void => {
    let service: CountryService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CountryService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
}); */
describe("CountryService", (): void => {
    let service: CountryService;
    let httpMock: HttpTestingController;
    const apiUrl = "https://json-server-data-fpl9.onrender.com/countries"; // Coincide con el servicio

    beforeEach((): void => {
        TestBed.configureTestingModule({
            // 1. Importar el módulo de testing HTTP para resolver la dependencia de HttpClient
            imports: [HttpClientTestingModule],
        });

        service = TestBed.inject(CountryService);
        // Obtener el controlador para simular peticiones HTTP
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        // 2. Verificar que no queden peticiones HTTP pendientes sin resolver
        httpMock.verify();
    });

    // --- 1. Test Básico de Creación ---
    it("should be created", (): void => {
        // Esta prueba ahora pasa porque la dependencia HttpClient está resuelta.
        expect(service).toBeTruthy();
    });

    // --- 2. Test para getCountries() ---
    it("should return a list of countries (SelectItem[]) via getCountries()", (): void => {
        // Datos simulados (mocks) que coinciden con SelectItem[]
        const mockCountries: SelectItem[] = [
            { id: 1, description: "Argentina" },
            { id: 2, description: "Chile" },
            { id: 3, description: "Uruguay" },
        ];

        // Paso 1: Llamar al método del servicio
        service.getCountries().subscribe((countries: SelectItem[]): void => {
            // 🟢 Paso 4: Verificar la respuesta
            expect(countries.length).toBe(3);
            expect(countries).toEqual(mockCountries);
            expect(countries[0].description).toBe("Argentina");
        });

        // Paso 2: Interceptar el request HTTP esperado (debe coincidir con la URL del servicio)
        const req = httpMock.expectOne(apiUrl);

        // Paso 3: Verificar que el método sea GET y responder al request
        expect(req.request.method).toBe("GET");
        req.flush(mockCountries); // Envía la respuesta simulada al observable
    });
});
