import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
  private http = inject(HttpClient);

  async listAll(): Promise<SupportDto[]> {
    return await firstValueFrom(this.http.get<SupportDto[]>(`${this.API}/all`));
  }

  async create(payload: CreateSupportPayload): Promise<SupportDto> {
    return await firstValueFrom(this.http.post<SupportDto>(`${this.API}/create`, payload));
  }

  async update(id: number, dto: { firstName: string; lastName: string; password?: string }): Promise<SupportDto> {
    return await firstValueFrom(this.http.put<SupportDto>(`${this.API}/${id}`, dto));
  }

  async remove(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.API}/${id}`));
  }
}
