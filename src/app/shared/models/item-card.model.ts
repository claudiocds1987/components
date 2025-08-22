export interface ItemCard {
    id: number | string;
    title: string;
    description: string;
    resource: string; // Opcional si aplica a un recurso específico usuario restringido
    path: string;
}
