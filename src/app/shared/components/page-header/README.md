# Componente PageHeader

Componente reutilizable para headers de página que soporta dos variantes:

## 1. Header con Logo y Navbar (Dashboard/Settings)

```typescript
// En el componente .ts
import {
  PageHeaderComponent,
  NavLink,
} from '../../../shared/components/page-header/page-header.component';

@Component({
  imports: [PageHeaderComponent, ...otros],
})
export class MiComponent {
  navLinks: NavLink[] = [
    { label: 'Home', route: '/dashboard' },
    { label: 'Crypto', route: '/crypto' },
    { label: 'Configuración', route: '/settings' },
  ];
}
```

```html
<!-- En el template .html -->
<app-page-header [showLogo]="true" [navLinks]="navLinks"></app-page-header>
```

## 2. Header Simple con Botón Volver (Otras páginas)

```typescript
// En el componente .ts
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  imports: [PageHeaderComponent, ...otros],
})
export class MiComponent {}
```

```html
<!-- En el template .html -->
<app-page-header title="Mi Título" [showBackButton]="true" backRoute="/dashboard">
</app-page-header>
```

## Propiedades

- `title`: Título a mostrar en el header (solo para header simple)
- `showLogo`: Si es `true`, muestra el logo y navbar (para dashboard/settings)
- `showBackButton`: Si es `true`, muestra el botón "Volver" (para páginas internas)
- `backRoute`: Ruta a la que debe navegar el botón "Volver" (por defecto `/dashboard`)
- `navLinks`: Array de links de navegación (solo para header con logo)

## Componentes actualizados

Los siguientes componentes ya utilizan este header compartido:

- ✅ `dashboard.component` - Header con logo y navbar
- ✅ `settings.component` - Header con logo y navbar
- ✅ `transfer.component` - Header simple con botón volver
- ✅ `transactions-history.component` - Header simple con botón volver
- ✅ `cards.component` - Header simple con botón volver
- ✅ `catalog.component` - Header simple con botón volver
- ✅ `recharge.component` - Header simple con botón volver
- ✅ `payment.component` - Header simple con botón volver (backRoute personalizado)
