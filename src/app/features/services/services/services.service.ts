import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RechargeRequest } from '../models/recharge.interface';

@Injectable({
    providedIn: 'root'
})
export class ServicesService {
    private readonly API_URL = 'http://localhost:8080/api/recharge';
    private http = inject(HttpClient);

    /* Realizar recarga de servicio */
    async processRecharge(rechargeData: RechargeRequest): Promise<string> {
        return await firstValueFrom(this.http.post<string>(`${this.API_URL}/service`, rechargeData));
    }
}