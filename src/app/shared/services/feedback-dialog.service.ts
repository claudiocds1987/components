/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, inject } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { FeedbackDialogComponent } from "../components/feedback-dialog/feedback-dialog.component";

export interface FeedbackData {
    type: "success" | "danger" | "warning";
    title: string;
    message: string;
    showButtons?: boolean;
    acceptButtonText?: string;
    cancelButtonText?: string;
    acceptRoute?: string;
    cancelRoute?: string;
}

@Injectable({
    providedIn: "root",
})
export class FeedbackDialogService {
    private _dialog = inject(MatDialog);

    public openFeedbackDialog(
        config: any,
    ): MatDialogRef<FeedbackDialogComponent> {
        const dialogRef = this._dialog.open(FeedbackDialogComponent, {
            data: config,
            disableClose: true, // Para evitar que se cierre al hacer clic fuera
        });

        return dialogRef;
    }
}
