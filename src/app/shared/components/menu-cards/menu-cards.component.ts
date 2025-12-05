/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    Component,
    computed,
    inject,
    Input,
    OnDestroy,
    OnInit,
    Signal,
    signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { ItemCard } from "../../models/item-card.model";
import {
    AuthService,
    UserProfile,
    UserRole,
} from "../../services/auth.service";
import { filter, map, Observable, startWith, Subscription, tap } from "rxjs";
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

    skeletonIterations: number[] = [];
    isLoadingSig = signal(true);
    // Observable que contendrá la lista de tarjetas visibles
    public visibleCards$: Observable<ItemCard[]> | undefined;

    private visibleCardsSubscription: Subscription | undefined;

    private _authService = inject(AuthService);

    ngOnInit(): void {
        // Mostramos el skeleton con la cantidad de cards que viene del input cards
        this.skeletonIterations = Array.from({
            length: this.cards.length > 0 ? this.cards.length : 20,
        });
        // Resetear el estado de loading al inicializar
        this.isLoadingSig.set(true);
        // En visibleCards$ obtengo se define que menúes se van a mostrar
        // Asumo que ItemCard está definido y tienes los imports correctos (filter, tap, map)
        this.visibleCards$ = this._authService.userProfileData$.pipe(
            // 1. Filtramos: Solo continuamos si el perfil no es nulo (el usuario está logueado)
            // El 'profile is UserProfile' es un predicado de tipo para satisfacer a TypeScript
            filter(
                (profile: UserProfile | null): profile is UserProfile =>
                    profile !== null,
            ),
            tap((): void => {
                this.isLoadingSig.set(false);
            }),
            // 2. Mapeamos: El 'profile' se recibe y se usa para disparar el filtro de tarjetas
            map((_profile: UserProfile): ItemCard[] => {
                // La función map se ejecuta CADA VEZ que hay un cambio en userProfileData$
                // El valor del perfil NO se usa DENTRO del map,
                // pero el hecho de que el map se ejecute es lo que dispara el filtro.
                return this.cards.filter((card: ItemCard): boolean =>
                    // Para cada tarjeta, preguntamos al `AuthService` si el usuario actual tiene el permiso necesario.
                    // hasAccess usa this.userProfileDataSubject.getValue() para obtener los roles.
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
