export interface ItemCard {
    id: number | string;
    img?: string;
    title: string;
    description: string;
    textBtn?: string;
    // resource: string; // para aplicar un recurso específico usuario restringido
    // 'requiredRoles' puede ser un string (un solo rol) o un array de strings (múltiples roles)
    requiredRoles?: string | string[];
    path: string;
}
