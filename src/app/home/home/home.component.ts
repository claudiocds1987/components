import { Component } from "@angular/core";
import { ItemCard } from "../../shared/models/item-card.model";
import { MenuCardsComponent } from "../../shared/components/menu-cards/menu-cards.component";

@Component({
    selector: "app-home",
    standalone: true,
    imports: [MenuCardsComponent],
    templateUrl: "./home.component.html",
    styleUrl: "./home.component.scss",
})
export class HomeComponent {
    menuCards: ItemCard[] = [];

    constructor() {
        this.menuCards = [
            {
                id: "1",
                title: "Grilla paginada dinámica con filtro dinámico y chips",
                description: "Gestión y visualización de empleados.",
                resource: "",
                path: "/employee-grid-pagination",
            },
            {
                id: "2",
                title: "Grilla infinita dinámica",
                description: "Gestión y visualización de empleados.",
                resource: "",
                path: "employee-grid-infinite",
            },
        ];
    }
}
