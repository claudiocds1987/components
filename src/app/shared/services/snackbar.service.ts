import { inject, Injectable } from "@angular/core";
import {
    MatSnackBar,
    MatSnackBarHorizontalPosition,
    MatSnackBarVerticalPosition,
} from "@angular/material/snack-bar";
import {
    SnackbarComponent,
    SnackbarData,
} from "../components/snackbar/snackbar.component";

@Injectable({
    providedIn: "root",
})
export class SnackbarService {
    private _snackBar = inject(MatSnackBar);

    show(
        message: string,
        image?: string, // <--- Nuevo parámetro opcional para la imagen
        duration = 3000,
        horizontalPosition: MatSnackBarHorizontalPosition = "center",
        verticalPosition: MatSnackBarVerticalPosition = "bottom",
    ): void {
        const data: SnackbarData = { message, image }; // <-- Pasa la data a tu componente

        this._snackBar.openFromComponent(SnackbarComponent, {
            data: data,
            duration: duration,
            horizontalPosition: horizontalPosition,
            verticalPosition: verticalPosition,
        });
    }
}
