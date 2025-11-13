import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServicesApiService } from '../../services/services-api.service';
import { ServiceItem } from '../../models/service.interface';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css'
})
export class CatalogComponent implements OnInit {
  services = signal<ServiceItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private servicesApi: ServicesApiService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading.set(true);
    this.error.set(null);

    this.servicesApi.listServices().subscribe({
      next: (data) => {
        this.services.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading services:', err);
        this.error.set('No se pudieron cargar los servicios. Intentá nuevamente.');
        this.loading.set(false);
      }
    });
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'utilities': 'Servicios públicos',
      'telecom': 'Telecomunicaciones',
      'transport': 'Transporte',
      'streaming': 'Streaming',
      'other': 'Otros'
    };
    return labels[category] || category;
  }

  getGroupedServices(): { category: string; services: ServiceItem[] }[] {
    const grouped = this.services().reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {} as Record<string, ServiceItem[]>);

    return Object.entries(grouped).map(([category, services]) => ({
      category,
      services
    }));
  }
}
