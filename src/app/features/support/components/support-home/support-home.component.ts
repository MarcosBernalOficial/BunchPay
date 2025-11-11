import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../chat/services/chat.service';
import { SupportChatService, ChatSummary } from '../../services/support-chat.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-support-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './support-home.component.html',
  styleUrls: ['./support-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportHomeComponent implements OnInit, OnDestroy {
  private ws = inject(ChatService);
  private api = inject(SupportChatService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private refreshTimer: any; // id del intervalo de auto-refresh

  tab: 'unassigned' | 'my' = 'unassigned';
  unassigned: ChatSummary[] = [];
  myChats: ChatSummary[] = [];
  selected: ChatSummary | null = null;
  messages: any[] = [];
  newMessage = '';
  loading = false;
  closing = false;
  loadingLists = false;
  loadingMessages = false;

  async ngOnInit() {
    await this.ws.connect().catch(() => {});
    // primer render: mostrar loader de listas
    this.loadingLists = true;
    this.cdr.markForCheck();
    this.refreshLists();
    // Suscribirse a eventos de cambios en la lista de sin asignar (nuevo mensaje, creado, asignado, cerrado)
    try {
      this.ws.subscribeToTopic('/topic/support/unassigned').subscribe(() => this.refreshLists());
    } catch {
      // si falla la suscripción, la UI seguirá funcionando con refresh manual por acciones
    }
    // Auto-refresh cada 8 segundos como respaldo para asegurar estado consistente
    this.refreshTimer = setInterval(() => this.refreshLists(), 8000);
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  async refreshLists() {
    const firstLoad = this.unassigned.length === 0 && this.myChats.length === 0;
    if (firstLoad) {
      this.loadingLists = true;
      this.cdr.markForCheck();
    }
    try {
      this.unassigned = await this.api.getUnassigned();
    } catch { /* ignore */ }
    try {
      this.myChats = await this.api.getMyChats();
    } catch { /* ignore */ }
    this.loadingLists = false;
    this.cdr.markForCheck();
  }

  // Determina si el mensaje es del soporte (yo) para alinear a la derecha
  isMine(m: any): boolean {
    // REST (SupportChatController): senderType = 'SUPPORT' | 'CLIENT'
    if (m && typeof m.senderType === 'string') {
      return m.senderType === 'SUPPORT';
    }
    // WS (ChatWsController): senderRole = 'SUPPORT' | 'CLIENT'
    if (m && typeof m.senderRole === 'string') {
      return m.senderRole === 'SUPPORT';
    }
    // Fallback por estructura antigua
    if (m?.sender?.role) {
      return m.sender.role === 'SUPPORT';
    }
    return false;
  }

  async pick(chat: ChatSummary) {
    // Cancelar subscripción previa si había otro chat
    if (this.selected) {
      this.ws.unsubscribeFromChat(this.selected.id);
    }
    this.selected = chat;
    this.messages = [];
    this.loadingMessages = true;
    this.cdr.markForCheck();
    try {
      this.messages = await this.api.getMessages(chat.id);
    } catch { this.messages = []; }
    this.loadingMessages = false;
    this.cdr.markForCheck();
    // Suscribirse a mensajes nuevos
    try {
      this.ws.subscribeToChat(chat.id).subscribe(msg => {
        this.messages = [...this.messages, msg];
        this.cdr.markForCheck();
      });
    } catch { /* ignore ws errors */ }
  }

  async assignSelected() {
    if (!this.selected) return;
    const assignedId = this.selected.id;
    try {
      await this.api.assign(assignedId);
      // Mover a la pestaña "Mis chats" y reseleccionar el chat asignado
      this.tab = 'my';
      const list = await this.api.getMyChats();
      this.myChats = list;
      this.selected = list.find(c => c.id === assignedId) || null;
      // Actualizar también la lista de sin asignar
      this.unassigned = await this.api.getUnassigned();
      this.cdr.markForCheck();
    } catch { /* ignore */ }
  }

  async closeSelected() {
    if (!this.selected) return;
    const id = this.selected.id;
    this.closing = true;
    try {
      await this.api.close(id);
      this.selected = { ...this.selected!, closed: true };
      this.myChats = await this.api.getMyChats();
      this.unassigned = await this.api.getUnassigned();
      this.cdr.markForCheck();
    } catch (err: any) {
      if (err?.status === 400) {
        this.selected = { ...this.selected!, closed: true };
        this.myChats = await this.api.getMyChats();
        this.unassigned = await this.api.getUnassigned();
        this.cdr.markForCheck();
      } else if (err?.status === 403) {
        alert('No estás asignado a este chat.');
      } else {
        alert('No se pudo cerrar el chat.');
      }
    } finally {
      this.closing = false;
    }
  }

  send() {
    if (!this.selected || !this.newMessage.trim()) return;
    this.ws.sendMessage(this.selected.id, this.newMessage.trim());
    this.newMessage = '';
    this.cdr.markForCheck();
  }

  logout() {
    (async () => {
      try { await this.auth.logout(); } finally { this.router.navigate(['/auth/login']); }
    })();
  }
}
