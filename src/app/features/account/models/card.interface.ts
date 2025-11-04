export interface Card {
    id: number;
    cardNumber: string;
    cardType: CardType;
    expirationDate: string;
    cvv: string;
}

export enum CardType {
    DEBIT = 'DEBIT',
    CREDIT = 'CREDIT'
}