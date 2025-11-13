import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { DashboardComponent } from './features/dashboard/components/dashboard.component';

export const routes: Routes = [

    { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
    },
    
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'settings', loadComponent: () => import('./features/settings/components/settings.component').then(c => c.SettingsComponent), canActivate: [AuthGuard] },
    { path: 'support', loadComponent: () => import('./features/support/components/support-home/support-home.component').then(c => c.SupportHomeComponent), canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'SUPPORT' } },
    { path: 'admin/supports', loadComponent: () => import('./features/admin/components/admin-supports/admin-supports.component').then(c => c.AdminSupportsComponent), canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'ADMIN' } },
    { path: 'admin', redirectTo: 'admin/supports', pathMatch: 'full' },
    
    { path: 'transactions/transfer', loadComponent: () => import('./features/transactions/components/transfer/transfer.component').then(c => c.TransferComponent), canActivate: [AuthGuard] },
    { path: 'transactions/history', loadComponent: () => import('./features/transactions/components/history/transactions-history.component').then(c => c.TransactionsHistoryComponent), canActivate: [AuthGuard] },
    { path: 'account/card', loadComponent: () => import('./features/account/components/cards/cards.component').then(c => c.CardsComponent), canActivate: [AuthGuard] },
    { path: 'services/recharge', loadComponent: () => import('./features/services/components/recharge/recharge.component').then(c => c.RechargeComponent), canActivate: [AuthGuard] },
    { path: 'benefits', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'crypto', loadComponent: () => import('./features/crypto/components/crypto-list/crypto-list.component').then(c => c.CryptoListComponent), canActivate: [AuthGuard] },
    { path: 'services', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'services/:child', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'account', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'account/:child', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'settings/support', loadComponent: () => import('./features/settings/components/support-chat/support-chat.component').then(c => c.SupportChatComponent), canActivate: [AuthGuard] },
    
    { path: 'unauthorized', redirectTo: '/auth/login' },
    { path: '**', redirectTo: '/auth/login' }
];
