import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
    selector: "app-feedback",
    standalone: true,
    imports: [CommonModule],
    templateUrl: "./feedback.component.html",
    styleUrl: "./feedback.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackComponent {
    @Input() message = "No se encontraron resultados";
    // Puedes cambiar esta URL por una imagen local o un SVG si lo prefieres
    @Input() imageUrl =
        "https://placehold.co/150x150/e0e0e0/424242?text=No+Results";
}
