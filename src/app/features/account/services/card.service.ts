import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CardDto {
    cardHolderName: string;
    cardNumber: string;
    maskedCardNumber: string;
    expirationDate: string;
    cvv: string;
}

@Injectable({
    providedIn: 'root'
})

export class CardService {
    private readonly API_URL = 'http://localhost:8080/cards';
    private http = inject(HttpClient);

    /* Obtener tarjeta del usuario */
    getMyCard(): Observable<CardDto> {
        return this.http.get<CardDto>(`${this.API_URL}/my-card`);
    }
}
