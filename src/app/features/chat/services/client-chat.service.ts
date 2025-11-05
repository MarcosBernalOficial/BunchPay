import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClientChatSummary {
  id: number;
  clientEmail: string | null;
  clientName: string | null;
  supportEmail: string | null;
  closed: boolean;
}

export interface ClientChatMessage {
  id: number;
  content: string;
  date: string; // ISO
  sender: { email: string; role: string } | any;
  // Compatibilidad con DTOs del backend y WS
  senderName?: string;
  senderType?: 'CLIENT' | 'SUPPORT';
  senderRole?: 'CLIENT' | 'SUPPORT';
  senderEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientChatService {
  private readonly API = 'http://localhost:8080/client/chats';

  constructor(private http: HttpClient) {}

  listMyChats(): Observable<ClientChatSummary[]> {
    return this.http.get<ClientChatSummary[]>(`${this.API}`);
  }

  getMessages(chatId: number): Observable<ClientChatMessage[]> {
    return this.http.get<ClientChatMessage[]>(`${this.API}/${chatId}/messages`);
  }

  startChat(): Observable<ClientChatSummary> {
    return this.http.post<ClientChatSummary>(`${this.API}/start`, {});
  }
}
