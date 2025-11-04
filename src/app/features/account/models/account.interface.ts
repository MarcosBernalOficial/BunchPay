export interface AccountSummary {
    balance: number;
    alias: string;
    cvu: string;
}

export interface ClientProfile {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    dni: string;
}

export interface AliasChange {
    newAlias: string;
}

export interface PasswordChange {
    currentPassword: string;
    newPassword: string;
}