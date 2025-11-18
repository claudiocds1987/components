import { TestBed } from "@angular/core/testing";

import { PositionService } from "./position.service";
import { SelectItem } from "../models/select-item.model";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";

describe("PositionService", (): void => {
    let service: PositionService;
    let httpMock: HttpTestingController; // Controlador para simular HTTP
    const apiUrl = "https://json-server-data-fpl9.onrender.com/positions"; // URL del servicio

    beforeEach((): void => {
        TestBed.configureTestingModule({
            // 1. Importar el módulo de testing HTTP para resolver la dependencia de HttpClient
            imports: [HttpClientTestingModule],
        });

        service = TestBed.inject(PositionService);
        // Obtener el controlador para simular peticiones HTTP
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        // 2. Verificar que no queden peticiones HTTP pendientes sin resolver
        httpMock.verify();
    });

    // --- 1. Test Básico de Creación ---
    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });

    // --- 2. Test para getPositions() ---
    it("should return a list of positions (SelectItem[]) via getPositions()", (): void => {
        // Datos simulados (mocks) que coinciden con SelectItem[]
        const mockPositions: SelectItem[] = [
            { id: 101, description: "Gerente de Proyectos" },
            { id: 102, description: "Desarrollador Senior" },
            { id: 103, description: "Diseñador UX/UI" },
        ];

        // Paso 1: Llamar al método del servicio y suscribirse
        service.getPositions().subscribe((positions: SelectItem[]): void => {
            // 🟢 Paso 4: Verificar la respuesta
            expect(positions.length).toBe(3);
            expect(positions).toEqual(mockPositions);
            expect(positions[0].description).toBe("Gerente de Proyectos");
        });

        // Paso 2: Interceptar el request HTTP esperado
        const req = httpMock.expectOne(apiUrl);

        // Paso 3: Verificar que el método sea GET y responder al request
        expect(req.request.method).toBe("GET");
        req.flush(mockPositions); // Envía la respuesta simulada
    });
});
