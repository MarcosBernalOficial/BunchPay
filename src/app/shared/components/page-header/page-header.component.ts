import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface NavLink {
    label: string;
    route: string;
}

@Component({
    selector: 'app-page-header',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './page-header.component.html'
})
export class PageHeaderComponent {
    @Input() title: string = '';
    @Input() showLogo: boolean = false;
    @Input() showBackButton: boolean = false;
    @Input() backRoute: string = '/dashboard';
    @Input() navLinks: NavLink[] = [];
}
