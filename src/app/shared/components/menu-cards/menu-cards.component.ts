import { Component, inject, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { ItemCard } from "../../models/item-card.model";
import { AuthService, UserRole } from "../../services/auth.service";
import { filter, map, Observable } from "rxjs";

@Component({
    selector: "app-menu-cards",
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, RouterLink],
    templateUrl: "./menu-cards.component.html",
    styleUrl: "./menu-cards.component.scss",
})
export class MenuCardsComponent {
    @Input() cards: ItemCard[] = [];

    // Observable que contendrá la lista de tarjetas visibles
    public visibleCards$: Observable<ItemCard[]> | undefined;
    private _authService = inject(AuthService);
    constructor() {}

    ngOnInit(): void {
        // Obtengo los roles del usuario que trajo authService de la base de datos guardados en el observable userRoles$ de authService
        this.visibleCards$ = this._authService.userRoles$.pipe(
            // Bloquea la emisión inicial de null
            filter(
                (roles: UserRole[] | null): roles is UserRole[] =>
                    roles !== null,
            ),
            // Esperamos a que userRoles$ emita un valor (null o el array de roles)
            map((_): ItemCard[] => {
                // La función map se ejecuta CADA VEZ que hay un cambio en userRoles$
                // El valor de los roles (el array) NO se usa DENTRO del map,
                // pero el hecho de que el map se ejecute es lo que dispara el filtro.
                return this.cards.filter((card: ItemCard): boolean =>
                    // Para cada tarjeta, preguntamos al `AuthService` si el usuario actual tiene el permiso necesario. Sólo si la respuesta es true,
                    // la tarjeta permanece en la lista."
                    this._authService.hasAccess(card.requiredRoles),
                );
            }),
        );
    }
}
