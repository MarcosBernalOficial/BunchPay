export interface ApiResponse<T = any> {
    data?: T;
    message?: string;
    error?: string;
    status?: number;
}

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
}

export enum Role {
    CLIENT = 'CLIENT',
    SUPPORT = 'SUPPORT',
    ADMIN = 'ADMIN'
}