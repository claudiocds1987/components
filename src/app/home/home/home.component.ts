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
                img: "../../../assets/grid.svg",
                title: "Grilla paginada full",
                description:
                    "Gestión y visualización de empleados con filtro dinámico y chips.",
                resource: "",
                path: "/employee-grid-pagination",
            },
            {
                id: "2",
                img: "../../../assets/grid.svg",
                title: "Grilla infinita",
                description:
                    "Gestión y visualización de empleados cons scroll infinito.",
                resource: "",
                path: "employee-grid-infinite",
            },
            {
                id: "3",
                img: "../../../assets/grid.svg",
                title: "Grilla no paginada",
                description: "Gestión y visualización de empleados.",
                resource: "",
                path: "employee-grid-all",
            },
            // Con boton Incluido en la mat-card usando prop. textBtn
            /*  {
                id: "4",
                title: "gasfgasgasg",
                description: "Gestión y visualización de empleados.",
                resource: "",
                path: "employee-grid-all",
                textBtn: "ir a grilla",
            }, */
        ];
    }
}
