export interface TransferRequest {
    receiverCVU?: string;
    receiverAlias?: string;
    description: string;
    amount: number;
}