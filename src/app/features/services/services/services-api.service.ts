import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceItem, ServicePaymentRequest, RechargeRequest } from '../models/service.interface';

@Injectable({
    providedIn: 'root'
})
export class ServicesApiService {
    private readonly API_URL = 'http://localhost:8080/services';
    private http = inject(HttpClient);

    /* Listar servicios disponibles */
    listServices(): Observable<ServiceItem[]> {
        return this.http.get<ServiceItem[]>(`${this.API_URL}/catalog`);
    }

    /* Pagar un servicio */
    payService(payload: ServicePaymentRequest): Observable<string> {
        return this.http.post(`${this.API_URL}/pay`, payload, { responseType: 'text' });
    }

    /* Realizar recarga (SUBE, celular, etc) */
    recharge(payload: RechargeRequest): Observable<string> {
        return this.http.post('http://localhost:8080/api/recharge/service', payload, { responseType: 'text' });
    }
}
