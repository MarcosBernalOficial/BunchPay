import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ClientChatService, ClientChatMessage, ClientChatSummary } from '../../../../features/chat/services/client-chat.service';
import { ChatService } from '../../../../features/chat/services/chat.service';
import { PageHeaderComponent, NavLink } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-support-chat',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './support-chat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportChatComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private clientChat = inject(ClientChatService);
  private ws = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);

  navLinks: NavLink[] = [
    { label: 'Home', route: '/dashboard' },
    { label: 'Crypto', route: '/crypto' },
    { label: 'Configuración', route: '/settings' }
  ];

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
      await Promise.race([
        this.ws.connect().catch(() => {}),
        new Promise<void>(res => setTimeout(res, 1500))
      ]);
      const chats = await this.clientChat.listMyChats();
      let active: ClientChatSummary | null = chats.find(c => !c.closed) || null;
      if (!active) {
        active = await this.clientChat.startChat();
      }
      this.chat = active;

      if (!this.chat) return;
      const history = await this.clientChat.getMessages(this.chat.id);
      this.messages = history;

      this.ws.subscribeToChat(this.chat.id).subscribe(event => {
        const msg: ClientChatMessage = typeof event === 'string' ? { id: Date.now(), content: event, date: new Date().toISOString(), sender: { email: 'system', role: 'SYSTEM' } } as any : event;
        this.messages = [...this.messages, msg];
        this.cdr.markForCheck();
      });

      this.ws.subscribeToTopic(`/topic/chats/${this.chat.id}/closed`).subscribe(async () => {
        await this.handleChatClosed();
      });
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }

  private async handleChatClosed(): Promise<void> {
    if (!this.chat) return;

    this.ws.unsubscribeFromChat(this.chat.id);
    this.ws.unsubscribeFromTopic(`/topic/chats/${this.chat.id}/closed`);

    this.messages = [];
    this.chat = null;
    this.cdr.markForCheck();

    try {
      const newChat = await this.clientChat.startChat();
      this.chat = newChat;

      const history = await this.clientChat.getMessages(newChat.id);
      this.messages = history;

      const systemMessage: ClientChatMessage = {
        id: Date.now(),
        content: 'El soporte ha cerrado el chat anterior. Esta es una nueva conversación.',
        date: new Date().toISOString(),
        sender: { email: 'system', role: 'SYSTEM' },
        senderType: 'SUPPORT',
        senderName: 'Sistema'
      };
      this.messages = [...this.messages, systemMessage];

      this.ws.subscribeToChat(newChat.id).subscribe(event => {
        const msg: ClientChatMessage = typeof event === 'string' ? { id: Date.now(), content: event, date: new Date().toISOString(), sender: { email: 'system', role: 'SYSTEM' } } as any : event;
        this.messages = [...this.messages, msg];
        this.cdr.markForCheck();
      });

      this.ws.subscribeToTopic(`/topic/chats/${newChat.id}/closed`).subscribe(async () => {
        await this.handleChatClosed();
      });

      this.cdr.markForCheck();
    } catch (err) {
      console.error('Error al crear nuevo chat:', err);
    }
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
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
    } finally {
      this.sending = false;
      this.cdr.markForCheck();
    }
  }

  isMine(m: any): boolean {
    if (m && typeof m.senderType === 'string') {
      return m.senderType === 'CLIENT';
    }
    if (m && typeof m.senderRole === 'string') {
      return m.senderRole === 'CLIENT';
    }
    if (m?.sender?.role) {
      return m.sender.role === 'CLIENT';
    }
    return false;
  }
}
