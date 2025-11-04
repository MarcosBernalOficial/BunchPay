import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RechargeRequest } from '../models/recharge.interface';

@Injectable({
    providedIn: 'root'
})
export class ServicesService {
    private readonly API_URL = 'http://localhost:8080/api/recharge';

    constructor(private http: HttpClient) {}

    /**
   * Realizar recarga de servicio
   */
    processRecharge(rechargeData: RechargeRequest): Observable<string> {
        return this.http.post<string>(`${this.API_URL}/service`, rechargeData);
    }
}