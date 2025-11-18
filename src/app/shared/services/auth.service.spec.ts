import { TestBed } from "@angular/core/testing";

import {
    AuthService,
    UserCredentials,
    UserProfile,
    UserRecord,
} from "./auth.service";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";

/* describe("AuthService", (): void => {
    let service: AuthService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AuthService);
    });

    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });
});
 */
describe("AuthService", (): void => {
    let service: AuthService;
    let httpMock: HttpTestingController;

    // URLs del servicio para mocking
    const usersUrl = "https://json-server-data-fpl9.onrender.com/users";
    const profileUrl = "https://json-server-data-fpl9.onrender.com/profile";

    // Mocks de datos
    const mockUserRecord: UserRecord[] = [
        {
            id: 1,
            username: "adminUser",
            password: "securepassword",
            roles: ["ADMIN", "GERENTE"],
        },
    ];

    const mockUserProfile: UserProfile = {
        id: 1,
        username: "adminUser",
        roles: ["ADMIN", "GERENTE"],
    };

    const mockCredentials: UserCredentials = {
        username: "adminUser",
        password: "securepassword",
    };

    beforeEach((): void => {
        TestBed.configureTestingModule({
            // 1. Importar el módulo de testing HTTP
            imports: [HttpClientTestingModule],
            providers: [AuthService],
        });

        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        // Asegurar que no queden peticiones HTTP sin resolver
        httpMock.verify();
    });

    // --- 1. Test Básico de Creación ---
    it("should be created", (): void => {
        expect(service).toBeTruthy();
    });

    // --- 2. Test de Login Exitoso ---
    it("should log in successfully and update userProfileData$", (done: DoneFn): void => {
        // 🟢 Paso 1: Suscribirse para verificar el cambio de estado
        service.userProfileData$.subscribe(
            (profile: UserProfile | null): void => {
                if (profile) {
                    // 🟢 Paso 4: Verificar el estado del BehaviorSubject
                    expect(profile).toEqual(mockUserProfile);
                    done(); // Finaliza el test asíncrono
                }
            },
        );

        // 🟢 Paso 2: Llamar al método login
        service.login(mockCredentials).subscribe((user: UserProfile): void => {
            expect(user.username).toBe("adminUser");
        });

        // 🟢 Paso 3: Interceptar y simular la respuesta de búsqueda de usuario
        const req = httpMock.expectOne(
            `${usersUrl}?username=${mockCredentials.username}`,
        );
        expect(req.request.method).toBe("GET");
        req.flush(mockUserRecord); // Enviar el usuario válido con password
    });

    // --- 3. Test de Login Fallido (Password Incorrecta) ---
    it("should not update userProfileData$ on failed login due to incorrect password", (done: DoneFn): void => {
        // Paso 1: Llamar a login con password incorrecta
        service.login({ ...mockCredentials, password: "wrong" }).subscribe({
            next: (): void => {
                fail("Expected login to fail, but it succeeded");
            },
            complete: (): void => {
                // ... (resto de tu lógica de verificación del perfil)
                service.userProfileData$.subscribe((profile): void => {
                    expect(profile).toBeNull();
                    done();
                });
            },
        });

        // 🟢 Paso 2: Simular la respuesta de búsqueda de usuario
        const req = httpMock.expectOne(
            `${usersUrl}?username=${mockCredentials.username}`,
        );
        expect(req.request.method).toBe("GET");
        req.flush(mockUserRecord);
    });

    // --- 4. Test de Logout ---
    it("should clear userProfileData$ on logout", (done: DoneFn): void => {
        // Inicializar el estado (SIMULAMOS el login mediante un método auxiliar si fuera público,
        // pero para mockear el estado, asumiremos que ya fue establecido por un login exitoso).
        // Nota: Aunque el setter del Subject es privado, podemos empezar la prueba asumiendo un estado conocido.
        // Usaremos la suscripción para verificar el cambio de 'mockUserProfile' a 'null'.

        let initialValueChecked = false;

        // 🟢 Paso 1: Suscribirse y verificar el estado después del logout
        service.userProfileData$.subscribe(
            (profile: UserProfile | null): void => {
                if (!initialValueChecked) {
                    // Este es el valor inicial (después del login simulado, si lo hubiéramos hecho)
                    // Ya que el constructor lo pone en null, no podemos "forzar" el estado aquí.
                    // Para este test, lo mejor es basarse en el cambio a 'null'.
                    initialValueChecked = true;
                    return;
                }

                if (profile === null) {
                    // Paso 3: Verificar que el perfil se limpió (lo hacemos a través del Observable público)
                    expect(profile).toBeNull();
                    done();
                }
            },
        );

        // NOTA: Para simular que el perfil EXISTE antes del logout (ya que no podemos llamar al setter privado),
        // primero corremos un login exitoso.

        // 1. Simular Login (para establecer el estado)
        service.login(mockCredentials).subscribe();
        httpMock
            .expectOne(`${usersUrl}?username=${mockCredentials.username}`)
            .flush(mockUserRecord);

        // 2. Llamar a logout (esto triggerá el 'next(null)' que verificamos en la suscripción)
        service.logout();
    });

    // --- 5. Test de loadUserProfile ---

    it("should load profile data and update userProfileData$ on loadUserProfile", (done: DoneFn): void => {
        service.userProfileData$.subscribe(
            (profile: UserProfile | null): void => {
                if (profile && profile.username !== "Error") {
                    expect(profile.username).toBe(mockUserProfile.username);
                    done();
                }
            },
        );

        service.loadUserProfile().subscribe();

        const req = httpMock.expectOne(profileUrl);
        expect(req.request.method).toBe("GET");
        req.flush(mockUserProfile);
    });

    // --- 6. Test de HasAccess ---
    describe("hasAccess", (): void => {
        // Necesitamos simular un login exitoso para ESTABLECER el estado
        beforeEach((): void => {
            // Simular Login exitoso antes de cada prueba de hasAccess
            service.login(mockCredentials).subscribe();
            const req = httpMock.expectOne(
                `${usersUrl}?username=${mockCredentials.username}`,
            );
            req.flush(mockUserRecord);
            httpMock.verify(); // Verifica que el request de login fue manejado
        });

        // Prueba 6.1 (Sin roles requeridos)
        it("should return true if no required roles are passed", (): void => {
            // El estado ya está establecido por el beforeEach
            expect(service.hasAccess(undefined)).toBeTrue();
            expect(service.hasAccess([])).toBeTrue();
        });

        // Prueba 6.2 (Perfil nulo - debe simularse el logout)
        it("should return false if user profile is null", (): void => {
            service.logout(); // Usar el método público para poner el estado en null
            expect(service.hasAccess("ADMIN")).toBeFalse();
        });

        // Prueba 6.3 (Roles encontrados)
        it("should return true if user has the required single role (case-insensitive)", (): void => {
            expect(service.hasAccess("admin")).toBeTrue();
            expect(service.hasAccess("GERENTE")).toBeTrue();
        });
    });
});
