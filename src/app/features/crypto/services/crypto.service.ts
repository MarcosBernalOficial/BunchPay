import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CryptoPrice } from '../models/crypto.interface';

@Injectable({
    providedIn: 'root'
})
export class CryptoService {
    private readonly API_URL = 'http://localhost:8080/api/crypto';

    constructor(private http: HttpClient) {}

    /**
     * Obtener cotizaciones de criptomonedas
     */
    getCryptoPrices(): Observable<CryptoPrice[]> {
        return this.http.get<CryptoPrice[]>(`${this.API_URL}/prices`);
    }
}