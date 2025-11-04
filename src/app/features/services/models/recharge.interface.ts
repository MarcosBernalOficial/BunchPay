export interface RechargeRequest {
    serviceCode: string;
    amount: number;
    phoneNumber?: string;
    accountNumber?: string;
}