import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(route: ActivatedRouteSnapshot): boolean {
        const expectedRole = route.data['expectedRole'];
        
        if (this.authService.isAuthenticated() && this.authService.hasRole(expectedRole)) {
        return true;
        } else {
        this.router.navigate(['/unauthorized']);
        return false;
        }
    }
}