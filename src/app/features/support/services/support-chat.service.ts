import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ChatSummary {
  id: number;
  // Campos que pueden venir del ChatDto de /support/chats
  clientName?: string | null;
  supportName?: string | null;
  lastMessage?: string | null;
  closed: boolean;
  // Compatibilidad con respuestas antiguas de /chats/support/*
  clientEmail?: string | null;
  supportEmail?: string | null;
}

export interface ChatMessage {
  id: number;
  content: string;
  date: string;
  sender: { email: string; role: string } | any;
}

@Injectable({ providedIn: 'root' })
export class SupportChatService {
  // Usamos el controlador dedicado a soporte
  private readonly API = 'http://localhost:8080/support/chats';
  private http = inject(HttpClient);

  async getUnassigned(): Promise<ChatSummary[]> {
    return await firstValueFrom(this.http.get<ChatSummary[]>(`${this.API}/unassigned`));
  }

  async getMyChats(): Promise<ChatSummary[]> {
    return await firstValueFrom(this.http.get<ChatSummary[]>(`${this.API}`));
  }

  async assign(chatId: number): Promise<void> {
    await firstValueFrom(this.http.put(`${this.API}/${chatId}/assign`, {}));
  }

  async close(chatId: number): Promise<void> {
    await firstValueFrom(this.http.put(`${this.API}/${chatId}/close`, {}));
  }

  async getMessages(chatId: number): Promise<ChatMessage[]> {
    return await firstValueFrom(this.http.get<ChatMessage[]>(`${this.API}/${chatId}/messages`));
  }
}
