import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
  date: string; 
  sender: { email: string; role: string } | any;
  senderName?: string;
  senderType?: 'CLIENT' | 'SUPPORT';
  senderRole?: 'CLIENT' | 'SUPPORT';
  senderEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientChatService {
  private readonly API = 'http://localhost:8080/client/chats';

  private http = inject(HttpClient);

  async listMyChats(): Promise<ClientChatSummary[]> {
    return await firstValueFrom(this.http.get<ClientChatSummary[]>(`${this.API}`));
  }

  async getMessages(chatId: number): Promise<ClientChatMessage[]> {
    return await firstValueFrom(this.http.get<ClientChatMessage[]>(`${this.API}/${chatId}/messages`));
  }

  async startChat(): Promise<ClientChatSummary> {
    return await firstValueFrom(this.http.post<ClientChatSummary>(`${this.API}/start`, {}));
  }
}
