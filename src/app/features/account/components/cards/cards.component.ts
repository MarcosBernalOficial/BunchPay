import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardService, CardDto } from '../../services/card.service';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent implements OnInit {
  private cardService = inject(CardService);

  loading = signal(false);
  card = signal<CardDto | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCard();
  }

  loadCard(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.cardService.getMyCard().subscribe({
      next: (data) => {
        console.log('[Cards] Loaded card:', data);
        this.card.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[Cards] Error loading card:', err);
        this.error.set('No se pudo cargar la tarjeta');
        this.loading.set(false);
      }
    });
  }
}
