import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";

// Define la estructura de los datos que el snackbar recibirá
export interface SnackbarData {
    message: string;
    image?: string; // Propiedad opcional para la URL de la imagen
}

@Component({
    selector: "app-snackbar",
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: "./snackbar.component.html",
    styleUrl: "./snackbar.component.scss",
})
export class SnackbarComponent {
    data: SnackbarData = inject(MAT_SNACK_BAR_DATA);
}
