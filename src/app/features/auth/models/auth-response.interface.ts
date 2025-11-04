export interface LoginResponse {
    token: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: Role;
    dni?: string; // Solo para clientes
}

export enum Role {
    CLIENT = 'CLIENT',
    SUPPORT = 'SUPPORT',
    ADMIN = 'ADMIN'
}