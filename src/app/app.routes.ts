import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { DashboardComponent } from './features/dashboard/components/dashboard.component';
// import { AuthGuard } from './core/guards/auth.guard';
// import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    // Ruta por defecto
    { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
    
    // Rutas de autenticación (públicas) - Comentado temporalmente hasta crear componentes
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
    },
    
    // Dashboard protegido
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'support', loadComponent: () => import('./features/support/components/support-home/support-home.component').then(c => c.SupportHomeComponent), canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'SUPPORT' } },
    { path: 'admin/supports', loadComponent: () => import('./features/admin/components/admin-supports/admin-supports.component').then(c => c.AdminSupportsComponent), canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'ADMIN' } },
    { path: 'admin', redirectTo: 'admin/supports', pathMatch: 'full' },
    // { path: 'account', component: null },   // TODO: Crear AccountComponent  
    // { path: 'transactions', component: null }, // TODO: Crear TransactionsComponent
    // { path: 'services', component: null },  // TODO: Crear ServicesComponent
    // { path: 'crypto', component: null },    // TODO: Crear CryptoComponent

    // Rutas de error
    { path: 'unauthorized', redirectTo: '/auth/login' },
    { path: '**', redirectTo: '/auth/login' }
];
