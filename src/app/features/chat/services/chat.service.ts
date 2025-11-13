import { Injectable, NgZone, inject } from '@angular/core';
import { Client, IMessage, StompSubscription, IFrame } from '@stomp/stompjs';
// Usar el build de navegador para evitar dependencias de Node (global)
import SockJS from 'sockjs-client/dist/sockjs';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private subjects: Map<string, Subject<any>> = new Map();
  private zone = inject(NgZone);

  private get token(): string | null {
    return sessionStorage.getItem('token');
  }

  connect(): Promise<void> {
    if (this.client?.active) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const stompClient = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        connectHeaders: this.token ? { Authorization: `Bearer ${this.token}` } : {},
        debug: () => {},
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => resolve(),
  onStompError: (frame: IFrame) => reject(frame.headers['message'] || 'WS error'),
        onWebSocketClose: () => {
          this.subscriptions.clear();
        }
      });
      stompClient.activate();
      this.client = stompClient;
    });
  }

  disconnect(): void {
    this.client?.deactivate();
    this.subscriptions.clear();
    this.subjects.clear();
  }

  subscribeToChat(chatId: number): Observable<any> {
    const topic = `/topic/chats/${chatId}`;

    if (!this.subjects.has(topic)) {
      this.subjects.set(topic, new Subject<any>());
    }
    const subject = this.subjects.get(topic)!;

    if (!this.subscriptions.has(topic)) {
      if (!this.client?.connected) {
        throw new Error('WebSocket not connected');
      }
      const sub = this.client.subscribe(topic, (message: IMessage) => {
        this.zone.run(() => {
          try {
            const body = JSON.parse(message.body);
            subject.next(body);
          } catch {
            subject.next(message.body);
          }
        });
      });
      this.subscriptions.set(topic, sub);
    }

    return subject.asObservable();
  }

  subscribeToTopic(topic: string): Observable<any> {
    if (!this.subjects.has(topic)) {
      this.subjects.set(topic, new Subject<any>());
    }
    const subject = this.subjects.get(topic)!;

    if (!this.subscriptions.has(topic)) {
      if (!this.client?.connected) {
        throw new Error('WebSocket not connected');
      }
      const sub = this.client.subscribe(topic, (message: IMessage) => {
        try {
          const body = JSON.parse(message.body);
          subject.next(body);
        } catch {
          subject.next(message.body);
        }
      });
      this.subscriptions.set(topic, sub);
    }

    return subject.asObservable();
  }

  sendMessage(chatId: number, content: string): void {
    if (!this.client?.connected) {
      throw new Error('WebSocket not connected');
    }
    const destination = `/app/chats/${chatId}/send`;
    this.client.publish({ destination, body: JSON.stringify({ content }) });
  }

  unsubscribeFromTopic(topic: string): void {
    const sub = this.subscriptions.get(topic);
    if (sub) {
      try { sub.unsubscribe(); } catch {}
      this.subscriptions.delete(topic);
    }
    this.subjects.delete(topic);
  }
  
  unsubscribeFromChat(chatId: number): void {
    this.unsubscribeFromTopic(`/topic/chats/${chatId}`);
  }
}
