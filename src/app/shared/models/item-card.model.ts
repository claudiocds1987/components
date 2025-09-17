export interface ItemCard {
    id: number | string;
    title: string;
    description: string;
    textBtn?: string;
    resource: string; // Opcional si aplica a un recurso específico usuario restringido
    path: string;
}
