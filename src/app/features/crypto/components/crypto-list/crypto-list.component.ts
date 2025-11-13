import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CryptoService } from '../../services/crypto.service';
import { CryptoPrice } from '../../models/crypto.interface';
import { PageHeaderComponent, NavLink } from '../../../../shared/components/page-header/page-header.component';

@Component({
    selector: 'app-crypto-list',
    standalone: true,
    imports: [CommonModule, RouterModule, PageHeaderComponent],
    templateUrl: './crypto-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CryptoListComponent implements OnInit {
    private cryptoService = inject(CryptoService);
    private cdr = inject(ChangeDetectorRef);

    navLinks: NavLink[] = [
        { label: 'Home', route: '/dashboard' },
        { label: 'Crypto', route: '/crypto' },
        { label: 'Configuración', route: '/settings' }
    ];

    prices = signal<CryptoPrice[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);
    lastUpdate = signal<Date | null>(null);

    async ngOnInit() {
        await this.loadPrices();
        // Auto-refresh cada 30 segundos
        setInterval(() => this.loadPrices(true), 30000);
    }

    async loadPrices(silent: boolean = false) {
        if (!silent) {
        this.loading.set(true);
        }
        this.error.set(null);

        try {
        const data = await this.cryptoService.getCryptoPrices();
        this.prices.set(data);
        this.lastUpdate.set(new Date());
        } catch (err: any) {
        this.error.set(err?.error?.message || 'Error al cargar las cotizaciones');
        console.error('Error al cargar precios de crypto:', err);
        } finally {
        if (!silent) {
            this.loading.set(false);
        }
        this.cdr.markForCheck();
        }
    }

    formatPrice(price: string): string {
        const num = parseFloat(price);
        return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
        }).format(num);
    }

    getCryptoName(symbol: string): string {
        const names: { [key: string]: string } = {
        'BTCARS': 'Bitcoin',
        'ETHARS': 'Ethereum',
        'USDTARS': 'Tether',
        'BNBARS': 'Binance Coin',
        'ADAARS': 'Cardano',
        'DOGEARS': 'Dogecoin',
        'XRPARS': 'Ripple',
        'DOTARS': 'Polkadot',
        'UNIARS': 'Uniswap',
        'LTCARS': 'Litecoin'
        };
        return names[symbol] || symbol.replace('ARS', '');
    }

    getCryptoIcon(symbol: string): string {
        const icons: { [key: string]: string } = {
        'BTCARS': '₿',
        'ETHARS': 'Ξ',
        'USDTARS': '₮',
        'BNBARS': 'BNB',
        'ADAARS': '₳',
        'DOGEARS': 'Ð',
        'XRPARS': 'XRP',
        'DOTARS': '●',
        'UNIARS': '🦄',
        'LTCARS': 'Ł'
        };
        return icons[symbol] || '●';
    }

    getCryptoColor(symbol: string): string {
        const colors: { [key: string]: string } = {
        'BTCARS': 'text-orange-400',
        'ETHARS': 'text-blue-400',
        'USDTARS': 'text-green-400',
        'BNBARS': 'text-yellow-400',
        'ADAARS': 'text-blue-500',
        'DOGEARS': 'text-yellow-300',
        'XRPARS': 'text-gray-400',
        'DOTARS': 'text-pink-400',
        'UNIARS': 'text-purple-400',
        'LTCARS': 'text-gray-300'
        };
        return colors[symbol] || 'text-white';
    }
}
