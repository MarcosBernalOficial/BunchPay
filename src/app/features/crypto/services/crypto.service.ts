import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CryptoPrice } from '../models/crypto.interface';

@Injectable({
    providedIn: 'root'
})
export class CryptoService {
    private readonly API_URL = 'http://localhost:8080/api/crypto';
    private http = inject(HttpClient);

    /* Obtener cotizaciones de criptomonedas */
    async getCryptoPrices(): Promise<CryptoPrice[]> {
        return await firstValueFrom(this.http.get<CryptoPrice[]>(`${this.API_URL}/prices`));
    }
}