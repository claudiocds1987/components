import { Component, inject, OnInit } from "@angular/core";
import { ItemCard } from "../../shared/models/item-card.model";
import { MenuCardsComponent } from "../../shared/components/menu-cards/menu-cards.component";
import { map, Observable, startWith } from "rxjs";
import { AuthService } from "../../shared/services/auth.service";
import { AsyncPipe } from "@angular/common";

@Component({
    selector: "app-home",
    standalone: true,
    imports: [MenuCardsComponent, AsyncPipe],
    templateUrl: "./home.component.html",
    styleUrl: "./home.component.scss",
})
export class HomeComponent implements OnInit {
    /*  NOTA: el usuario es "adminUser" tiene 3 roles ["ADMIN", "GERENTE", "USUARIO_NORMAL"]. 
        (ir a db.json -> objeto profile y fijarse que en la propiedad "roles")    
        Cualquiera de estos roles que se ponga en la propiedad "requiredRoles" va a dar acceso a que se pueda ver el menu o si queremos tener acceso
        tambien se puede poner vacio (requiredRoles: ""). 
        Para hacer una prueba de negarle el acceso al usuario adminUser y que no pueda ver ese menú, poner en "requiredRoles"
        un roll que no exista en adminUser o no sea vacio, por ejemplo requiredRoles:["CHA"].
        Estariamos diciendole al usuario mira que para este menu el rol requerido es "CHA" si vos no lo tenes no podes acceder.
        CORRER JSON-SERVER DE LOCAL
    */
    menuCards: ItemCard[] = [];

    // Observable que contendrá solo las tarjetas a las que el usuario tiene acceso
    public visibleMenuCards$: Observable<ItemCard[]> | undefined;

    // Inyección de dependencias
    private _authService = inject(AuthService);

    private _menuCards = [
        {
            id: "1",
            img: "assets/grid.svg",
            title: "Grilla paginada full",
            description:
                "Gestión y visualización de empleados con filtro dinámico y chips.",
            // requiredRoles: ["ADMIN"], // va a funcionar porque adminUser tiene el rol ADMIN
            //requiredRoles: ["CHA"], // NO VA A FUNCIONAR  porque adminUser NO tiene el rol CHA
            requiredRoles: "", // Visible para todos (o no requiere un rol específico)
            path: "/employee-grid-pagination",
        },
        {
            id: "2",
            img: "assets/grid.svg",
            title: "Grilla infinita",
            description:
                "Gestión y visualización de empleados con scroll infinito.",

            requiredRoles: "", // Visible para todos (o no requiere un rol específico)
            path: "/employee-grid-infinite",
        },
        {
            id: "3",
            img: "assets/grid.svg",
            title: "Grilla no paginada",
            description: "Gestión y visualización de empleados.",
            requiredRoles: "", // Visible para todos los roles (o no requiere un rol específico)
            path: "/employee-grid-all",
        },
        {
            id: "4",
            img: "assets/grid.svg",
            title: "Form Array",
            description: "Form Array dinámico con diferentes configuraciones.",
            requiredRoles: "", // Visible para todos los roles (o no requiere un rol específico)
            path: "/employee-form-array",
        },
    ];

    ngOnInit(): void {
        // Definimos que el Observable emitirá un array de ItemCard, basado en el UserProfile (o null)
        this.visibleMenuCards$ = this._authService.userProfileData$.pipe(
            // El 'map' recibe el perfil (UserProfile | null) y emite un ItemCard[]
            map((): ItemCard[] => {
                // El argumento vacio en map () asegura que el pipe se ejecute
                // cuando el perfil cambie (login/logout).

                // Filtra la lista estática (_menuCards)
                return this._menuCards.filter((card: ItemCard): boolean => {
                    // Usa el método hasAccess del AuthService
                    return this._authService.hasAccess(card.requiredRoles);
                });
            }),
            // Asegura que se emita un valor inmediatamente (el filtro inicial)
            startWith(
                this._menuCards.filter((card: ItemCard): boolean =>
                    this._authService.hasAccess(card.requiredRoles),
                ),
            ),
        );
    }
}
