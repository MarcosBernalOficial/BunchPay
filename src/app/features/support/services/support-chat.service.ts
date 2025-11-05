import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  getUnassigned(): Observable<ChatSummary[]> {
    return this.http.get<ChatSummary[]>(`${this.API}/unassigned`);
  }

  getMyChats(): Observable<ChatSummary[]> {
    return this.http.get<ChatSummary[]>(`${this.API}`);
  }

  assign(chatId: number): Observable<any> {
    return this.http.put(`${this.API}/${chatId}/assign`, {});
  }

  close(chatId: number): Observable<any> {
    return this.http.put(`${this.API}/${chatId}/close`, {});
  }

  getMessages(chatId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.API}/${chatId}/messages`);
  }
}
