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
  assigning = false;
  assignSuccess: string | null = null;
  assignError: string | null = null;
  closeSuccess: string | null = null;
  closeError: string | null = null;

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
      const unassignedList = await this.api.getUnassigned();
      // Filtrar chats que tengan al menos un mensaje
      this.unassigned = unassignedList.filter(chat => chat.lastMessage && chat.lastMessage.trim() !== '');
    } catch { /* ignore */ }
    try {
      const myChatsRaw = await this.api.getMyChats();
      // Ordenar: primero los abiertos (!closed), luego los cerrados (closed)
      this.myChats = myChatsRaw.sort((a, b) => {
        if (a.closed === b.closed) return 0;
        return a.closed ? 1 : -1; // Si a está cerrado, va después (1); si está abierto, va antes (-1)
      });
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
    console.log('Pick chat:', chat.id, 'closed:', chat.closed);
    
    // Cancelar subscripción previa si había otro chat
    if (this.selected) {
      this.ws.unsubscribeFromChat(this.selected.id);
    }
    
    // Resetear estado
    this.selected = chat;
    this.messages = [];
    this.loadingMessages = true;
    
    // Forzar actualización inmediata del UI
    this.cdr.detectChanges();
    
    try {
      this.messages = await this.api.getMessages(chat.id);
      console.log('Mensajes cargados para chat', chat.id, ':', this.messages.length);
    } catch (e) { 
      console.error('Error cargando mensajes para chat', chat.id, ':', e);
      this.messages = []; 
    } finally {
      // Asegurar que loadingMessages se resetea siempre
      this.loadingMessages = false;
      console.log('Loading messages set to false');
      // Forzar detección completa de cambios
      this.cdr.detectChanges();
    }
    
    // Suscribirse a mensajes nuevos
    try {
      this.ws.subscribeToChat(chat.id).subscribe(msg => {
        console.log('Nuevo mensaje recibido:', msg.id || msg.content?.substring(0, 20));
        // Verificar si el mensaje ya existe para evitar duplicados
        const messageExists = this.messages.some(m => 
          (m.id && msg.id && m.id === msg.id) || 
          (m.content === msg.content && m.date === msg.date)
        );
        
        if (!messageExists) {
          this.messages = [...this.messages, msg];
          this.cdr.markForCheck();
        } else {
          console.log('Mensaje duplicado ignorado');
        }
      });
    } catch (e) { 
      console.error('Error suscribiendo a chat', chat.id, ':', e);
    }
  }

  async assignSelected() {
    if (!this.selected) return;
    const assignedId = this.selected.id;
    const clientName = this.selected.clientName || this.selected.clientEmail;
    
    // Limpiar mensajes previos
    this.assignSuccess = null;
    this.assignError = null;
    this.assigning = true;
    this.cdr.markForCheck();
    
    try {
      await this.api.assign(assignedId);
      
      // Actualizar listas
      await this.refreshLists();
      
      // Encontrar el chat asignado
      const assignedChat = this.myChats.find(c => c.id === assignedId);
      
      if (assignedChat) {
        // Mover a la pestaña "Mis chats"
        this.tab = 'my';
        // Reseleccionar el chat asignado para cargar sus mensajes
        this.selected = assignedChat;
        
        // Cargar mensajes del chat asignado
        this.loadingMessages = true;
        this.cdr.markForCheck();
        try {
          this.messages = await this.api.getMessages(assignedId);
        } catch { 
          this.messages = []; 
        }
        this.loadingMessages = false;
        
        // Suscribirse a mensajes nuevos del chat asignado
        try {
          this.ws.subscribeToChat(assignedId).subscribe(msg => {
            // Verificar si el mensaje ya existe para evitar duplicados
            const messageExists = this.messages.some(m => 
              (m.id && msg.id && m.id === msg.id) || 
              (m.content === msg.content && m.date === msg.date)
            );
            
            if (!messageExists) {
              this.messages = [...this.messages, msg];
              this.cdr.markForCheck();
            }
          });
        } catch { /* ignore ws errors */ }
        
        // Mostrar mensaje de éxito
        this.assignSuccess = `Chat de ${clientName} asignado correctamente`;
        setTimeout(() => {
          this.assignSuccess = null;
          this.cdr.markForCheck();
        }, 3000);
      }
      
      this.cdr.markForCheck();
    } catch (err: any) {
      // Verificar si el chat realmente se asignó a pesar del error
      let chatReallyWasAssigned = false;
      
      try {
        await this.refreshLists();
        const assignedChat = this.myChats.find(c => c.id === assignedId);
        if (assignedChat) {
          chatReallyWasAssigned = true;
          
          // Mover a la pestaña "Mis chats" y reseleccionar
          this.tab = 'my';
          this.selected = assignedChat;
          
          // Cargar mensajes
          this.loadingMessages = true;
          this.cdr.markForCheck();
          try {
            this.messages = await this.api.getMessages(assignedId);
          } catch { 
            this.messages = []; 
          }
          this.loadingMessages = false;
          
          // Suscribirse a mensajes nuevos
          try {
            this.ws.subscribeToChat(assignedId).subscribe(msg => {
              // Verificar si el mensaje ya existe para evitar duplicados
              const messageExists = this.messages.some(m => 
                (m.id && msg.id && m.id === msg.id) || 
                (m.content === msg.content && m.date === msg.date)
              );
              
              if (!messageExists) {
                this.messages = [...this.messages, msg];
                this.cdr.markForCheck();
              }
            });
          } catch { /* ignore ws errors */ }
        }
      } catch {
        // Si falla la verificación, asumir que no se asignó
      }
      
      if (chatReallyWasAssigned) {
        // El chat se asignó exitosamente (aunque hubo un error en la respuesta)
        this.assignSuccess = `Chat de ${clientName} asignado correctamente`;
        setTimeout(() => {
          this.assignSuccess = null;
          this.cdr.markForCheck();
        }, 3000);
      } else {
        // Error real: el chat no se asignó
        if (err?.status === 409) {
          this.assignError = 'Este chat ya está asignado a otro agente';
        } else if (err?.status === 404) {
          this.assignError = 'Chat no encontrado';
        } else {
          this.assignError = 'No se pudo asignar el chat. Intentá nuevamente.';
        }
        
        setTimeout(() => {
          this.assignError = null;
          this.cdr.markForCheck();
        }, 4000);
      }
      
      this.cdr.markForCheck();
    } finally {
      this.assigning = false;
      this.cdr.markForCheck();
    }
  }

  async closeSelected() {
    if (!this.selected) return;
    const id = this.selected.id;
    const clientName = this.selected.clientName || this.selected.clientEmail;
    
    // Limpiar mensajes previos
    this.closeSuccess = null;
    this.closeError = null;
    this.closing = true;
    this.cdr.markForCheck();
    
    try {
      await this.api.close(id);
      
      // Éxito: actualizar el estado del chat seleccionado
      this.selected = { ...this.selected!, closed: true };
      
      // Actualizar listas
      await this.refreshLists();
      
      // Mostrar mensaje de éxito
      this.closeSuccess = `Chat de ${clientName} cerrado correctamente`;
      setTimeout(() => {
        this.closeSuccess = null;
        this.cdr.markForCheck();
      }, 3000);
      
      this.cdr.markForCheck();
    } catch (err: any) {
      // Verificar si el chat realmente se cerró a pesar del error
      let chatReallyWasClosed = false;
      
      if (err?.status === 400) {
        // Error 400: El chat ya estaba cerrado - tratarlo como éxito
        chatReallyWasClosed = true;
      } else {
        // Para otros errores, verificar el estado real del chat
        try {
          await this.refreshLists();
          const updatedChat = this.myChats.find(c => c.id === id) || this.unassigned.find(c => c.id === id);
          if (updatedChat && updatedChat.closed) {
            chatReallyWasClosed = true;
          }
        } catch {
          // Si falla la verificación, asumir que no se cerró
        }
      }
      
      if (chatReallyWasClosed) {
        // El chat se cerró exitosamente (aunque hubo un error en la respuesta)
        this.selected = { ...this.selected!, closed: true };
        this.closeSuccess = `Chat de ${clientName} cerrado correctamente`;
        setTimeout(() => {
          this.closeSuccess = null;
          this.cdr.markForCheck();
        }, 3000);
      } else {
        // Error real: el chat no se cerró
        if (err?.status === 403) {
          this.closeError = 'No estás asignado a este chat';
        } else {
          this.closeError = 'No se pudo cerrar el chat. Intentá nuevamente.';
        }
        
        setTimeout(() => {
          this.closeError = null;
          this.cdr.markForCheck();
        }, 4000);
      }
      
      this.cdr.markForCheck();
    } finally {
      this.closing = false;
      this.cdr.markForCheck();
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
