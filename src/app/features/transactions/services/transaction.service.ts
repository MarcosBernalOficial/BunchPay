import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';
import { TransferRequest } from '../models/transfer-request.interface';
import { Transaction } from '../models/transaction.interface';

@Injectable({
    providedIn: 'root'
})
export class TransactionService {
    private readonly API_URL = 'http://localhost:8080/transactions';
    private http = inject(HttpClient);

    transactions = signal<Transaction[]>([]);

    /**
     * Realizar transferencia
     */
    async makeTransfer(transferData: TransferRequest): Promise<string> {
        // LOG: antes de enviar
        console.log('[TransactionService] Sending POST /transactions/transfer', {
            ts: new Date().toISOString(),
            operationId: transferData.operationId,
            payload: transferData
        });
        return await firstValueFrom(
            this.http
                .post(`${this.API_URL}/transfer`, transferData, { responseType: 'text' })
                .pipe(
                    tap({
                        next: (res) =>
                            console.log('[TransactionService] OK /transactions/transfer', {
                                ts: new Date().toISOString(),
                                operationId: transferData.operationId,
                                response: res
                            }),
                        error: (err) =>
                            console.log('[TransactionService] ERROR /transactions/transfer', {
                                ts: new Date().toISOString(),
                                operationId: transferData.operationId,
                                error: err
                            })
                    })
                )
        );
    }

    /**
     * Obtener historial de transacciones
     */
    async loadTransactionHistory(): Promise<void> {
        const data = await firstValueFrom(this.http.get<Transaction[]>(`${this.API_URL}/viewAll`));
        this.transactions.set(data);
    }

    /**
     * Filtrar transacciones (si el backend lo soporta)
     */
    async filterTransactions(filters: any): Promise<Transaction[]> {
        return await firstValueFrom(this.http.post<Transaction[]>(`${this.API_URL}/filter`, filters));
    }

    /**
     * Obtener comprobante PDF
     */
    getReceipt(transactionId: number) {
        return this.http.get(`${this.API_URL}/receipt/${transactionId}`, { responseType: 'blob' });
    }
}