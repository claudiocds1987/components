import { CommonModule } from "@angular/common";
import {
    Component,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    input,
    computed,
} from "@angular/core";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

// Definimos la interfaz para la estructura de los chips
export interface Chip {
    key: string; // Nombre del campo del filtro (ej: 'name', 'position')
    label: string; // Etiqueta descriptiva para el chip (ej: 'Nombre: Juan Doe')
    value: unknown; // Valor del filtro asociado (ej: 'Juan Doe')
    type?: "number" | "text" | "date" | "select" | "dateRange" | undefined; // Agregamos el tipo para aplicar formato
    disabled?: boolean; // Indica si el chip está deshabilitado
}

@Component({
    selector: "app-chips",
    standalone: true,
    imports: [CommonModule, MatChipsModule, MatIconModule, MatTooltipModule],
    templateUrl: "./chips.component.html",
    styleUrl: "./chips.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipsComponent {
    chips = input<Chip[]>();
    isLoadingSig = input<boolean>(true);
    @Output() chipRemoved = new EventEmitter<Chip>();
    @Output() defaultChips = new EventEmitter<Chip[]>();

    // Para que el skeleton mantenga la forma y el número de los chips que ya estaban visibles antes de la carga
    // Esto se recalcula automáticamente cada vez que 'chips()' cambia.
    skeletonChips = computed<null[]>((): null[] => {
        // Obtenemos la longitud actual de los chips, o 3 si no hay chips
        const length = this.chips()?.length ?? 3;
        // Creamos y retornamos el array de tamaño fijo
        return Array(length).fill(null);
    });

    truncate(label: string): string {
        const value = label.substring(label.indexOf(":") + 1);
        return value.length > 25 ? value.substring(0, 25) + "..." : value;
    }

    trackByChipKey(index: number, chip: Chip): string {
        return chip.key;
    }

    removeChip(chip: Chip): void {
        this.chipRemoved.emit(chip);
    }
}
