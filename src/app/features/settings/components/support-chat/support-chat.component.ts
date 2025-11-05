import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ClientChatService, ClientChatMessage, ClientChatSummary } from '../../../../features/chat/services/client-chat.service';
import { ChatService } from '../../../../features/chat/services/chat.service';

@Component({
  selector: 'app-support-chat',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './support-chat.component.html'
})
export class SupportChatComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private clientChat = inject(ClientChatService);
  private ws = inject(ChatService);

  chat: ClientChatSummary | null = null;
  messages: ClientChatMessage[] = [];
  loading = false;
  sending = false;

  form = this.fb.group({
    content: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  async ngOnInit() {
    this.loading = true;
    try {
      await this.ws.connect();
      const chats = (await this.clientChat.listMyChats().toPromise()) || [];
      let active: ClientChatSummary | null = chats.find(c => !c.closed) || null;
      if (!active) {
        active = (await this.clientChat.startChat().toPromise()) || null;
      }
      this.chat = active;

      if (!this.chat) return;
      const history = await this.clientChat.getMessages(this.chat.id).toPromise();
      this.messages = history || [];

      this.ws.subscribeToChat(this.chat.id).subscribe(event => {
        // event puede ser un mensaje o un objeto con contenido
        const msg: ClientChatMessage = typeof event === 'string' ? { id: Date.now(), content: event, date: new Date().toISOString(), sender: { email: 'system', role: 'SYSTEM' } } as any : event;
        this.messages = [...this.messages, msg];
        // scroll al final lo maneja la vista si agregamos autoscroll
      });
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }

  back(): void {
    this.router.navigate(['/settings']);
  }

  send(): void {
    if (this.form.invalid || !this.chat) {
      this.form.markAllAsTouched();
      return;
    }
    const { content } = this.form.getRawValue();
    this.sending = true;
    try {
      this.ws.sendMessage(this.chat.id, content!);
      this.form.reset();
    } finally {
      this.sending = false;
    }
  }

  // Determina si el mensaje es del cliente (yo) para alinear a la derecha
  isMine(m: any): boolean {
    // REST (ClientChatController): MessageDto => senderType
    if (m && typeof m.senderType === 'string') {
      return m.senderType === 'CLIENT';
    }
    // WS (ChatWsController): payload => senderRole
    if (m && typeof m.senderRole === 'string') {
      return m.senderRole === 'CLIENT';
    }
    if (m?.sender?.role) {
      return m.sender.role === 'CLIENT';
    }
    return false;
  }
}
