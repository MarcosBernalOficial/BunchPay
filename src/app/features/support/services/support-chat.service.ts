import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatSummary {
  id: number;
  clientEmail: string | null;
  clientName: string | null;
  supportEmail: string | null;
  closed: boolean;
}

export interface ChatMessage {
  id: number;
  content: string;
  date: string;
  sender: { email: string; role: string } | any;
}

@Injectable({ providedIn: 'root' })
export class SupportChatService {
  private readonly API = 'http://localhost:8080/chats';

  constructor(private http: HttpClient) {}

  getUnassigned(): Observable<ChatSummary[]> {
    return this.http.get<ChatSummary[]>(`${this.API}/support/unassigned`);
  }

  getMyChats(): Observable<ChatSummary[]> {
    return this.http.get<ChatSummary[]>(`${this.API}/support/my`);
  }

  assign(chatId: number): Observable<ChatSummary> {
    return this.http.post<ChatSummary>(`${this.API}/${chatId}/assign`, {});
  }

  close(chatId: number): Observable<void> {
    return this.http.post<void>(`${this.API}/${chatId}/close`, {});
  }

  getMessages(chatId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.API}/${chatId}/messages`);
  }
}
