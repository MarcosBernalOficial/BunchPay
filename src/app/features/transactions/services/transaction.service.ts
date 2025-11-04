import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransferRequest } from '../models/transfer-request.interface';
import { Transaction } from '../models/transaction.interface';

@Injectable({
    providedIn: 'root'
})
export class TransactionService {
    private readonly API_URL = 'http://localhost:8080/transactions';

    constructor(private http: HttpClient) {}

    /**
     * Realizar transferencia
     */
    makeTransfer(transferData: TransferRequest): Observable<string> {
        return this.http.post<string>(`${this.API_URL}/transfer`, transferData);
    }

    /**
     * Obtener historial de transacciones
     */
    getTransactionHistory(): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.API_URL}/viewAll`);
    }

    /**
     * Filtrar transacciones (si el backend lo soporta)
     */
    filterTransactions(filters: any): Observable<Transaction[]> {
        return this.http.post<Transaction[]>(`${this.API_URL}/filter`, filters);
    }
}