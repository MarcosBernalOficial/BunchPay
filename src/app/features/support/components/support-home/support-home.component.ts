import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../chat/services/chat.service';
import { SupportChatService, ChatSummary } from '../../services/support-chat.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-support-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './support-home.component.html',
  styleUrls: ['./support-home.component.css']
})
export class SupportHomeComponent implements OnInit, OnDestroy {
  private ws = inject(ChatService);
  private api = inject(SupportChatService);
  private auth = inject(AuthService);
  private router = inject(Router);

  tab: 'unassigned' | 'my' = 'unassigned';
  unassigned: ChatSummary[] = [];
  myChats: ChatSummary[] = [];
  selected: ChatSummary | null = null;
  messages: any[] = [];
  newMessage = '';
  loading = false;
  closing = false;

  async ngOnInit() {
    await this.ws.connect().catch(() => {});
    this.refreshLists();
    // Suscribirse a eventos de cambios en la lista de sin asignar (nuevo mensaje, creado, asignado, cerrado)
    try {
      this.ws.subscribeToTopic('/topic/support/unassigned').subscribe(() => this.refreshLists());
    } catch {
      // si falla la suscripción, la UI seguirá funcionando con refresh manual por acciones
    }
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }

  refreshLists() {
    this.api.getUnassigned().subscribe(list => this.unassigned = list);
    this.api.getMyChats().subscribe(list => this.myChats = list);
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

  pick(chat: ChatSummary) {
    this.selected = chat;
    this.messages = [];
    this.api.getMessages(chat.id).subscribe(msgs => this.messages = msgs);
    this.ws.subscribeToChat(chat.id).subscribe(msg => {
      this.messages = [...this.messages, msg];
    });
  }

  assignSelected() {
    if (!this.selected) return;
    const assignedId = this.selected.id;
    this.api.assign(assignedId).subscribe(() => {
      // Mover a la pestaña "Mis chats" y reseleccionar el chat asignado
      this.tab = 'my';
      this.api.getMyChats().subscribe(list => {
        this.myChats = list;
        this.selected = list.find(c => c.id === assignedId) || null;
      });
      // Actualizar también la lista de sin asignar
      this.api.getUnassigned().subscribe(list => this.unassigned = list);
    });
  }

  closeSelected() {
    if (!this.selected) return;
    const id = this.selected.id;
    this.closing = true;
    this.api.close(id).pipe(finalize(() => (this.closing = false))).subscribe({
      next: () => {
        // Marcar localmente y refrescar listas
        this.selected = { ...this.selected!, closed: true };
        this.api.getMyChats().subscribe(list => this.myChats = list);
        this.api.getUnassigned().subscribe(list => this.unassigned = list);
      },
      error: (err) => {
        if (err?.status === 400) {
          // Ya estaba cerrado: reflejar estado y refrescar
          this.selected = { ...this.selected!, closed: true };
          this.api.getMyChats().subscribe(list => this.myChats = list);
          this.api.getUnassigned().subscribe(list => this.unassigned = list);
        } else if (err?.status === 403) {
          alert('No estás asignado a este chat.');
        } else {
          alert('No se pudo cerrar el chat.');
        }
      }
    });
  }

  send() {
    if (!this.selected || !this.newMessage.trim()) return;
    this.ws.sendMessage(this.selected.id, this.newMessage.trim());
    this.newMessage = '';
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/auth/login'])
    });
  }
}
