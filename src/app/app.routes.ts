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
    { path: 'settings', loadComponent: () => import('./features/settings/components/settings.component').then(c => c.SettingsComponent), canActivate: [AuthGuard] },
    { path: 'support', loadComponent: () => import('./features/support/components/support-home/support-home.component').then(c => c.SupportHomeComponent), canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'SUPPORT' } },
    { path: 'admin/supports', loadComponent: () => import('./features/admin/components/admin-supports/admin-supports.component').then(c => c.AdminSupportsComponent), canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'ADMIN' } },
    { path: 'admin', redirectTo: 'admin/supports', pathMatch: 'full' },
    // Placeholders para que los routerLink no rompan hasta crear los módulos
    { path: 'transactions/transfer', loadComponent: () => import('./features/transactions/components/transfer/transfer.component').then(c => c.TransferComponent), canActivate: [AuthGuard] },
    { path: 'transactions/history', loadComponent: () => import('./features/transactions/components/history/transactions-history.component').then(c => c.TransactionsHistoryComponent), canActivate: [AuthGuard] },
    { path: 'account/card', loadComponent: () => import('./features/account/components/cards/cards.component').then(c => c.CardsComponent), canActivate: [AuthGuard] },
    { path: 'services/recharge', loadComponent: () => import('./features/services/components/recharge/recharge.component').then(c => c.RechargeComponent), canActivate: [AuthGuard] },
    { path: 'benefits', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'crypto', redirectTo: 'dashboard', pathMatch: 'full' },
    // { path: 'settings', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'services', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'services/:child', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'account', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'account/:child', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'settings/support', loadComponent: () => import('./features/settings/components/support-chat/support-chat.component').then(c => c.SupportChatComponent), canActivate: [AuthGuard] },
    // { path: 'account', component: null },   // TODO: Crear AccountComponent  
    // { path: 'transactions', component: null }, // TODO: Crear TransactionsComponent
    // { path: 'services', component: null },  // TODO: Crear ServicesComponent
    // { path: 'crypto', component: null },    // TODO: Crear CryptoComponent

    // Rutas de error
    { path: 'unauthorized', redirectTo: '/auth/login' },
    { path: '**', redirectTo: '/auth/login' }
];
