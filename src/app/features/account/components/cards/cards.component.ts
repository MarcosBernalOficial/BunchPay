import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardService, CardDto } from '../../services/card.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
    selector: 'app-cards',
    standalone: true,
    imports: [CommonModule, RouterModule, PageHeaderComponent],
    templateUrl: './cards.component.html',
    styleUrls: ['./cards.component.css']
})
export class CardsComponent implements OnInit {
    private cardService = inject(CardService);

    loading = signal(false);
    card = signal<CardDto | null>(null);
    error = signal<string | null>(null);
    showData = signal(false);
    copySuccess = signal(false);

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

    toggleDataVisibility(): void {
        this.showData.set(!this.showData());
    }

    copyCardNumber(): void {
        const cardNumber = this.card()?.cardNumber;
        if (cardNumber) {
        navigator.clipboard.writeText(cardNumber).then(() => {
            this.copySuccess.set(true);
            setTimeout(() => this.copySuccess.set(false), 2000);
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
        });
        }
    }

    getMaskedCVV(): string {
        return this.showData() ? this.card()?.cvv || '****' : '****';
    }

    getDisplayCardNumber(): string {
        if (this.showData()) {
            // Show full card number, format in groups of 4
            const cardNumber = this.card()?.cardNumber || '';
            return cardNumber.replace(/(.{4})/g, '$1 ').trim();
        } else {
            // Show masked number (backend already formats it with spaces)
            return this.card()?.maskedCardNumber || '';
        }
    }

    getDisplayExpiration(): string {
        return this.showData() ? this.card()?.expirationDate || 'XX/XX' : 'XX/XX';
    }
}
