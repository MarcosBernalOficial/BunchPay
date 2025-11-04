export interface Transaction {
    transactionId: number;
    date: string; // LocalDateTime del backend se convierte a string
    amount: number;
    description: string;
    type: TransactionType;
    senderFirstName: string;
    senderLastName: string;
    senderCvu: string;
    recieverFirstName: string;
    recieverLastName: string;
    recieverCvu: string;
}

export enum TransactionType {
    DEPOSITO = 'DEPOSITO',
    RETIRO = 'RETIRO', 
    TRANSFERENCIA = 'TRANSFERENCIA',
    PAGO = 'PAGO'
}