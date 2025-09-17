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

    show({
        message,
        icon = "check", // icono de material por defecto
        duration = 3000,
        horizontalPosition = "center",
        verticalPosition = "bottom",
    }: {
        message: string;
        icon?: string;
        duration?: number;
        horizontalPosition?: MatSnackBarHorizontalPosition;
        verticalPosition?: MatSnackBarVerticalPosition;
    }): void {
        const data: SnackbarData = { message, icon };

        this._snackBar.openFromComponent(SnackbarComponent, {
            data: data,
            duration: duration,
            horizontalPosition: horizontalPosition,
            verticalPosition: verticalPosition,
        });
    }
}
