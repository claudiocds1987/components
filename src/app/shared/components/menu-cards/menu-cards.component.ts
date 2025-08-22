import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { ItemCard } from "../../models/item-card.model";

@Component({
    selector: "app-menu-cards",
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, RouterLink],
    templateUrl: "./menu-cards.component.html",
    styleUrl: "./menu-cards.component.scss",
})
export class MenuCardsComponent {
    @Input() cards: ItemCard[] = [];
}
