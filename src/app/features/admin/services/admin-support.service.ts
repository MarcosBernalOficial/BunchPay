import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SupportDto {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: 'SUPPORT' | 'ADMIN';
}

export interface CreateSupportPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'SUPPORT' | 'ADMIN';
}

@Injectable({ providedIn: 'root' })
export class AdminSupportService {
  private readonly API = 'http://localhost:8080/support';

  constructor(private http: HttpClient) {}

  listAll(): Observable<SupportDto[]> {
    return this.http.get<SupportDto[]>(`${this.API}/all`);
  }

  create(payload: CreateSupportPayload): Observable<SupportDto> {
    return this.http.post<SupportDto>(`${this.API}/create`, payload);
  }

  update(id: number, dto: { firstName: string; lastName: string; password?: string }): Observable<SupportDto> {
    return this.http.put<SupportDto>(`${this.API}/${id}`, dto);
  }

  remove(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }
}
