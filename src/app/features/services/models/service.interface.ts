export interface ServiceItem {
    id: number;
    name: string;
    category: string;
    description?: string;
    iconUrl?: string;
    minAmount?: number;
    maxAmount?: number;
}

export interface ServicePaymentRequest {
    serviceId: number;
    amount: number;
    reference?: string;
    cardId?: number;
}

export interface RechargeRequest {
    type: string;
    destination: string;
    amount: number;
}
