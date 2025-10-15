import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, catchError, Observable, of, tap } from "rxjs";

export type UserRole = "ADMIN" | "USUARIO_NORMAL" | "GERENTE" | "INVITADO";

// Interfaz para definir la estructura de tu usuario (lo que viene del backend)
interface UserProfile {
    id: number;
    username: string;
    roles: string[]; // Los roles del usuario logueado
}

@Injectable({
    providedIn: "root",
})
export class AuthService {
    // Se define userRoles$ para permitir que otros componentes obtengan los roles del usuario.
    public userRoles$: Observable<UserRole[] | null>;

    //private _apiUrl = "http://localhost:3000/profile";
    private _apiUrl = "https://json-server-data-fpl9.onrender.com/profile";
    private userRolesSubject = new BehaviorSubject<UserRole[] | null>(null);
    private _http = inject(HttpClient);

    constructor() {
        // this.userRoles$ es el canal público (Observable) para que otros componentes puedan suscribirse.
        // Este canal apunta al BehaviorSubject, Permite a otros componentes suscribirse y recibir el valor actual y futuro.
        this.userRoles$ = this.userRolesSubject.asObservable();
        this.loadUserProfile().subscribe();
    }

    // loadUserProfile() Carga el perfil del usuario de json-server objeto profile
    /*  "profile": 
    {
      "id": 1,
      "username": "adminUser",
      "roles": ["ADMIN", "GERENTE", "USUARIO_NORMAL"]
      
    } */
    loadUserProfile(): Observable<UserProfile> {
        return this._http.get<UserProfile>(this._apiUrl).pipe(
            tap((profile: UserProfile): void => {
                //console.log("El usuario cargado es:", profile.username);
                const roles = profile.roles || [];
                this.userRolesSubject.next(roles as UserRole[]);
            }),
            catchError((error) => {
                // Si falla, el valor pasa de 'null' a un array vacío '[]' (estado seguro)
                this.userRolesSubject.next([]);
                // Retornamos un observable vacío para que la suscripción no falle
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
     */
    hasAccess(requiredResource: string | string[] | undefined): boolean {
        if (
            !requiredResource ||
            (Array.isArray(requiredResource) && requiredResource.length === 0)
        ) {
            return true; // Acceso permitido si no hay roles requeridos
        }
        // Aca se obtienen un array con los roles del usuario "adminUser" de la base de datos json-server. ['ADMIN', 'GERENTE', 'USUARIO_NORMAL']
        const userRoles = this.userRolesSubject.getValue();

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
        const userRolesUpper = userRoles.map((userRole: UserRole): string =>
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
