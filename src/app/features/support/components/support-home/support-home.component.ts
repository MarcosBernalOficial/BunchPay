import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../chat/services/chat.service';
import { SupportChatService, ChatSummary } from '../../services/support-chat.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Router } from '@angular/router';

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

  async ngOnInit() {
    await this.ws.connect().catch(() => {});
    this.refreshLists();
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }

  refreshLists() {
    this.api.getUnassigned().subscribe(list => this.unassigned = list);
    this.api.getMyChats().subscribe(list => this.myChats = list);
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
    this.api.assign(this.selected.id).subscribe(updated => {
      this.selected = updated;
      this.refreshLists();
    });
  }

  closeSelected() {
    if (!this.selected) return;
    this.api.close(this.selected.id).subscribe(() => {
      this.refreshLists();
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
