import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
    BehaviorSubject,
    catchError,
    Observable,
    of,
    switchMap,
    tap,
} from "rxjs";

export type UserRole = "ADMIN" | "USUARIO_NORMAL" | "GERENTE" | "INVITADO";

interface UserRecord {
    id: number;
    username: string;
    password: string; // Requerido para la validación del mock
    roles: UserRole[];
}

// Interfaz para definir la estructura de tu usuario (lo que viene del backend)
export interface UserProfile {
    id: number;
    username: string;
    roles: string[]; // Los roles del usuario logueado
}

export interface UserCredentials {
    username: string;
    password: string;
}

@Injectable({
    providedIn: "root",
})
export class AuthService {
    //  Único Observable público para que los componentes se suscriban al perfil completo.
    public userProfileData$: Observable<UserProfile | null>;

    //private _apiUrl = "http://localhost:3000/profile";
    //private _usersUrl = "http://localhost:3000/users";
    private _apiUrl = "https://json-server-data-fpl9.onrender.com/profile";
    private _usersUrl = "https://json-server-data-fpl9.onrender.com/users";
    // 🎯 Único BehaviorSubject para almacenar todo el perfil del usuario.
    private userProfileDataSubject = new BehaviorSubject<UserProfile | null>(
        null,
    );
    private _http = inject(HttpClient);

    constructor() {
        // this.userRoles$ es el canal público (Observable) para que otros componentes puedan suscribirse.
        // Este canal apunta al BehaviorSubject, Permite a otros componentes suscribirse y recibir el valor actual y futuro.
        this.userProfileDataSubject = new BehaviorSubject<UserProfile | null>(
            null,
        );
        this.userProfileData$ = this.userProfileDataSubject.asObservable();
        this.loadUserProfile().subscribe();
    }

    /**
     * Simula el login: busca al usuario por username y valida el password.
     * @param credentials Objeto con username y password.
     * @returns Observable que emite el UserProfile en caso de éxito.
     */
    public login(credentials: UserCredentials): Observable<UserProfile> {
        return this._http
            .get<
                UserRecord[]
            >(`${this._usersUrl}?username=${credentials.username}`)
            .pipe(
                switchMap((users: UserRecord[]): Observable<UserProfile> => {
                    const user = users[0];

                    if (user && user.password === credentials.password) {
                        const userProfile: UserProfile = {
                            id: user.id,
                            username: user.username,
                            roles: user.roles,
                        };

                        // 🎯 Guardamos el objeto UserProfile COMPLETO.
                        this.userProfileDataSubject.next(userProfile);

                        return of(userProfile);
                    }

                    // Fallo en la autenticación
                    return new Observable<UserProfile>((observer): void => {
                        observer.complete();
                    });
                }),
                catchError((error): never => {
                    throw error;
                }),
            );
    }

    /**
     * Cierra la sesión del usuario.
     * Limpia el estado de los roles y notifica a los suscriptores (ej. HomeComponent).
     */
    public logout(): void {
        // 🎯 Limpiamos el perfil completo
        this.userProfileDataSubject.next(null);

        console.log("Sesión cerrada (Logout exitoso). Perfil limpiado.");
    }

    /*******************************************************************************************************
     * La función loadUserProfile(): Carga el perfil del usuario de json-server objeto profile
     *
     *      "profile":
     *           {
     *               "id": 1,
     *               "username": "adminUser",
     *               "roles": ["ADMIN", "GERENTE", "USUARIO_NORMAL"]
     *           }
     *
     ******************************************************************************************************/
    loadUserProfile(): Observable<UserProfile> {
        return this._http.get<UserProfile>(this._apiUrl).pipe(
            tap((profile: UserProfile): void => {
                // 🎯 Guardamos el objeto UserProfile COMPLETO.
                this.userProfileDataSubject.next(profile);
            }),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            catchError((_): Observable<UserProfile> => {
                // Si falla, el valor pasa a 'null' (estado seguro)
                // 🎯 Limpiamos el perfil completo en caso de error
                this.userProfileDataSubject.next(null);

                return of({
                    id: 0,
                    username: "Error",
                    roles: [],
                } as UserProfile);
            }),
        );
    }

    /*******************************************************************************************************
     * La funció HasAcces(): se le pasa el rol que esta en la menu card y trae todos los roles del usuario.
     * Entonces lo que hace es leer el rol de la menu card y leer todos los roles del usuario y preguntar
     * si el rol de la menu-card lo tiene el usuario.
     * Ambos roles tanto del menu card como el del usuario los convierte a mayuscula (uppercase) para
     * evitar errores de comparación y coincidan si el rol puesto en la mat card o en el esta en minuscula.
     ******************************************************************************************************/
    hasAccess(requiredResource: string | string[] | undefined): boolean {
        if (
            !requiredResource ||
            (Array.isArray(requiredResource) && requiredResource.length === 0)
        ) {
            return true; // Acceso permitido si no hay roles requeridos
        }
        // Aca se obtienen un array con los roles del usuario "adminUser" de la base de datos json-server. ['ADMIN', 'GERENTE', 'USUARIO_NORMAL']
        const userRoles = this.userProfileDataSubject.getValue()?.roles;

        // 1. Denegar si los roles del usuario NO están cargados
        if (!userRoles) {
            return false;
        }

        // 2. Aseguramos en transformar a upperCase los recursos que le estamos pasando de home.component en requiredRoles: ["ADMIN"],
        // al componente menu-cards para que los use aca this._authService.hasAccess(card.requiredRoles),
        // ej ['admin', 'gerente', 'usuario_normal'] el resultado seria => ['ADMIN', 'GERENTE', 'USUARIO_NORMAL']
        const requiredRolesArray = Array.isArray(requiredResource)
            ? requiredResource.map((r: string): string => r.toUpperCase())
            : [requiredResource.toUpperCase()];

        // 3. Aca se pasan a upperCase los roles del usuario leidos de la base de datos ["ADMIN", "GERENTE", "USUARIO_NORMAL"]
        const userRolesUpper = userRoles.map((userRole: string): string =>
            userRole.toUpperCase(),
        );
        // 4. Aca como comparamos que coincidan los roles que menu-cards.component recibe desde home.component, con los roles del usuario de la base de datos.
        // Ambos datos se convirtieron a mayuscula para que la comparacion sea exacta y no de errores. Caso contrario
        // podria leer que el rol en home.component que es el que despues se le pasa a menu-cards.component se escribió en minuscula "admin"
        // y en la base de datos esta con mayuscula "ADMIN" daria false porque no encontraria coincidencia.
        return requiredRolesArray.some((role: string): boolean =>
            userRolesUpper.includes(role),
        );
    }
}
