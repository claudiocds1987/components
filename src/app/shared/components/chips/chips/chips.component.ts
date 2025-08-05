import { CommonModule } from "@angular/common";
import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
} from "@angular/core";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";

// Definimos la interfaz para la estructura de los chips
export interface Chip {
    key: string; // Nombre del campo del filtro (ej: 'name', 'position')
    label: string; // Etiqueta descriptiva para el chip (ej: 'Nombre: Juan Doe')
    value: unknown; // Valor del filtro asociado (ej: 'Juan Doe')
}

@Component({
    selector: "app-chips",
    standalone: true,
    imports: [CommonModule, MatChipsModule, MatIconModule],
    templateUrl: "./chips.component.html",
    styleUrl: "./chips.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipsComponent {
    @Input() chips: Chip[] = [];
    @Output() chipRemoved = new EventEmitter<Chip>();

    trackByChipKey(index: number, chip: Chip): string {
        return chip.key;
    }

    removeChip(chip: Chip): void {
        this.chipRemoved.emit(chip);
    }
}
