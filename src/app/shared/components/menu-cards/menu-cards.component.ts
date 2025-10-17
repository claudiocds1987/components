import {
    Component,
    inject,
    Input,
    OnDestroy,
    OnInit,
    signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { ItemCard } from "../../models/item-card.model";
import { AuthService, UserRole } from "../../services/auth.service";
import { filter, map, Observable, Subscription, tap } from "rxjs";
import { SkeletonDirective } from "../../directives/skeleton.directive";

@Component({
    selector: "app-menu-cards",
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        RouterLink,
        SkeletonDirective,
    ],
    templateUrl: "./menu-cards.component.html",
    styleUrls: [
        "./menu-cards.component.scss",
        "../../../shared/styles/skeleton.scss",
    ],
})
export class MenuCardsComponent implements OnInit, OnDestroy {
    @Input() cards: ItemCard[] = [];
    isLoadingSig = signal(true);
    // Observable que contendrá la lista de tarjetas visibles
    public visibleCards$: Observable<ItemCard[]> | undefined;

    private visibleCardsSubscription: Subscription | undefined;

    private _authService = inject(AuthService);

    ngOnInit(): void {
        // En visibleCards$ obtengo se define que menúes se van a mostrar
        this.visibleCards$ = this._authService.userRoles$.pipe(
            filter(
                (roles: UserRole[] | null): roles is UserRole[] =>
                    roles !== null,
            ),
            tap((): void => {
                this.isLoadingSig.set(false);
            }),
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

        // Forzar la suscripción para que el pipe (incluyendo el tap) se ejecute.
        // El | async del template manejará la entrega de los datos a la vista.
        this.visibleCardsSubscription = this.visibleCards$.subscribe();
    }

    ngOnDestroy(): void {
        this.visibleCardsSubscription?.unsubscribe();
    }
}
