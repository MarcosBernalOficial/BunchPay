import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DiscountCoupon } from '../models/discount-coupon.interface';

@Injectable({ providedIn: 'root' })
export class DiscountCouponService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/discount-coupons';

  coupons = signal<DiscountCoupon[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async loadMyActiveCoupons(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<DiscountCoupon[]>(`${this.API_URL}/my-active`));
      this.coupons.set(data);
      if (data.length === 0) {
        const generated = await firstValueFrom(this.http.post<DiscountCoupon[]>(`${this.API_URL}/generate-if-empty`, {}));
        this.coupons.set(generated);
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Error al cargar beneficios');
    } finally {
      this.loading.set(false);
    }
  }
}
