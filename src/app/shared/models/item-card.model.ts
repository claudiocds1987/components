export interface ItemCard {
    id: number | string;
    img?: string;
    title: string;
    description: string;
    textBtn?: string;
    resource: string; // para aplicar un recurso específico usuario restringido
    path: string;
}
