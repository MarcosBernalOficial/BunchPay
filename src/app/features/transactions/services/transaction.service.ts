import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
        return await firstValueFrom(this.http.post<string>(`${this.API_URL}/transfer`, transferData));
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
}