import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { FeedbackData } from "../../services/feedback-dialog.service";

@Component({
    selector: "app-feedback-dialog",
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    templateUrl: "./feedback-dialog.component.html",
    styleUrl: "./feedback-dialog.component.scss",
})
export class FeedbackDialogComponent {
    public dialogRef = inject(MatDialogRef<FeedbackDialogComponent>);
    public data: FeedbackData = inject(MAT_DIALOG_DATA);

    onAcceptClick(): void {
        // Al cerrar, devuelve `true` para indicar que se presionó "Aceptar"
        this.dialogRef.close(true);
    }

    onCancelClick(): void {
        // Al cerrar, devuelve `false` para indicar que se presionó "Cancelar"
        this.dialogRef.close(false);
    }

    getFeedbackIcon(): string {
        return this.data.type === "success"
            ? "assets/success.svg"
            : "assets/danger.svg";
    }
}
