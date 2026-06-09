import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  safeIcon?: SafeHtml;
  roles: string[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-container" [class.sidebar-collapsed]="isCollapsed()">
      
      <!-- Backdrop for Mobile Drawer -->
      <div class="sidebar-overlay" (click)="closeSidebarMobile()"></div>
      
      <!-- Sidebar Drawer -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="logo-text">Alaya Core <span class="logo-sub">PMS</span></span>
        </div>
        
        <nav class="sidebar-nav">
          <ul>
            <li *ngFor="let item of filteredNavItems()">
              <a [routerLink]="item.route" routerLinkActive="active" [routerLinkActiveOptions]="{exact: item.route === '/admin'}" class="nav-link" (click)="onNavClick()">
                <span class="nav-icon" [innerHTML]="item.safeIcon"></span>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </nav>
        
        <div class="sidebar-footer">
          <div class="user-profile">
            <div class="avatar">{{ userInitials() }}</div>
            <div class="user-info">
              <div class="username">{{ currentUser()?.name }}</div>
              <div class="userrole">{{ currentUser()?.role | titlecase }}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <!-- Top Navigation Header -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="icon-btn toggle-sidebar" (click)="toggleSidebar()" title="Toggle Sidebar">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h2 class="page-title">{{ activePageTitle() }}</h2>
          </div>
          
          <div class="topbar-right">
            <!-- Dark Mode Toggle -->
            <button class="icon-btn theme-toggle" (click)="toggleTheme()" [title]="isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
              <svg *ngIf="!isDark()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              <svg *ngIf="isDark()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            </button>

            <!-- Storefront Quick Link -->
            <a routerLink="/storefront" class="btn btn-sm" style="font-weight: 500;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span class="btn-text">Guest Storefront</span>
            </a>
            
            <button class="btn btn-danger btn-sm" (click)="logout()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span class="btn-text">Logout</span>
            </button>
          </div>
        </header>

        <!-- Main Page Scrollable Viewport -->
        <main class="page-viewport">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background-color: var(--bg-secondary);
    }
    
    .sidebar {
      width: var(--sidebar-width);
      background-color: var(--bg-primary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      height: 100%;
      z-index: 200;
      transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .sidebar-header {
      height: var(--header-height);
      display: flex;
      align-items: center;
      padding: 0 24px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .logo-text {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: var(--fg-primary);
    }
    
    .logo-sub {
      color: var(--primary-color);
      font-size: 14px;
      font-weight: 800;
      background: var(--primary-accent);
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 4px;
    }
    
    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      overflow-y: auto;
    }
    
    .sidebar-nav ul {
      list-style: none;
    }
    
    .sidebar-nav li {
      margin-bottom: 4px;
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      color: var(--fg-secondary);
      border-radius: var(--border-radius);
      font-weight: 500;
      gap: 12px;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    
    .nav-link:hover {
      background-color: var(--bg-secondary);
      color: var(--fg-primary);
      text-decoration: none;
    }
    
    .nav-link.active {
      background-color: var(--primary-accent);
      color: var(--primary-color);
      font-weight: 600;
    }
    
    .nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
    }
    
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border-color);
      background-color: var(--bg-secondary);
    }
    
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: white;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    
    body.dark-theme .avatar {
      color: #0d1117;
    }
    
    .user-info {
      flex: 1;
      min-width: 0;
    }
    
    .username {
      font-weight: 600;
      font-size: 13px;
      color: var(--fg-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .userrole {
      font-size: 11px;
      color: var(--fg-muted);
    }
    
    /* Main Wrapper */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      width: 100%;
    }
    
    .topbar {
      height: var(--header-height);
      background-color: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 90;
    }
    
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .icon-btn {
      background: none;
      border: 1px solid transparent;
      border-radius: var(--border-radius);
      color: var(--fg-secondary);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    
    .icon-btn:hover {
      background-color: var(--bg-secondary);
      border-color: var(--border-color);
      color: var(--fg-primary);
    }
    
    .page-title {
      font-size: 18px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .page-viewport {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background-color: var(--bg-secondary);
    }
    
    /* Collapsed Sidebar overrides */
    .sidebar-collapsed .sidebar {
      width: 64px;
    }
    
    .sidebar-collapsed .logo-text {
      display: none;
    }
    
    .sidebar-collapsed .nav-label {
      display: none;
    }
    
    .sidebar-collapsed .user-info {
      display: none;
    }
    
    .sidebar-collapsed .sidebar-header {
      justify-content: center;
      padding: 0;
    }
    
    .sidebar-collapsed .sidebar-header::after {
      content: 'A';
      font-weight: 800;
      color: var(--primary-color);
      font-size: 20px;
    }
    
    .sidebar-collapsed .user-profile {
      justify-content: center;
    }

    .sidebar-overlay {
      display: none;
    }

    /* RESPONSIVE MOBILE ADJUSTMENTS */
    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: var(--sidebar-width) !important;
        transform: translateX(-100%);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 300;
      }

      /* When NOT collapsed, show the sidebar */
      .app-container:not(.sidebar-collapsed) .sidebar {
        transform: translateX(0);
      }

      /* Sidebar overlay visible when side drawer is open */
      .app-container:not(.sidebar-collapsed) .sidebar-overlay {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.4);
        z-index: 250;
        animation: fadeIn 0.15s ease-out;
      }

      .main-wrapper {
        width: 100vw;
      }

      .topbar {
        padding: 0 12px;
      }

      .topbar-right {
        gap: 6px;
      }

      /* Hide button labels on small viewports */
      .btn-text {
        display: none;
      }

      .topbar-right .btn {
        padding: 6px 8px;
      }

      .page-viewport {
        padding: 12px;
      }

      .page-title {
        font-size: 16px;
      }

      /* Force sidebar layout inside overlay slider to render completely rather than squished */
      .sidebar-header::after {
        display: none !important;
      }
      .logo-text, .nav-label, .user-info {
        display: flex !important;
      }
    }
  `]
})
export class LayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isCollapsed = signal<boolean>(false);
  isDark = signal<boolean>(false);
  currentUser = this.authService.currentUser;

  // Icons derived from SVG path markup directly so we don't depend on external assets
  private dashboardIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`;
  private propertiesIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  private entitiesIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>`;
  private kotIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h18"></path></svg>`;
  private inventoryIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;
  private staffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  private housekeepingIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
  private financeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;

  private checkInOutIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>`;
  private billingIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>`;

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: this.dashboardIcon, roles: ['admin', 'receptionist'] },
    { label: 'Guest Registry', route: '/admin/check-in-out', icon: this.checkInOutIcon, roles: ['admin', 'receptionist'] },
    { label: 'Properties', route: '/admin/properties', icon: this.propertiesIcon, roles: ['admin'] },
    { label: 'Entities', route: '/admin/entities', icon: this.entitiesIcon, roles: ['admin', 'receptionist'] },
    { label: 'KOT Restaurant', route: '/admin/kot', icon: this.kotIcon, roles: ['admin', 'chef', 'captain', 'biller'] },
    { label: 'Restaurant Billing', route: '/admin/restaurant-billing', icon: this.billingIcon, roles: ['admin', 'biller'] },
    { label: 'Inventory', route: '/admin/inventory', icon: this.inventoryIcon, roles: ['admin', 'chef'] },
    { label: 'User Management', route: '/admin/user-management', icon: this.staffIcon, roles: ['admin'] },
    { label: 'Housekeeping', route: '/admin/housekeeping', icon: this.housekeepingIcon, roles: ['admin', 'housekeeper'] },
    { label: 'Finance & Invoices', route: '/admin/finance', icon: this.financeIcon, roles: ['admin'] }
  ];

  constructor() {
    const sanitizer = inject(DomSanitizer);
    
    // Sanitize icons so Angular doesn't strip <svg> tags inside [innerHTML]
    this.navItems.forEach(item => {
      item.safeIcon = sanitizer.bypassSecurityTrustHtml(item.icon);
    });

    // Check system preference for dark mode
    if (typeof window !== 'undefined') {
      const isSavedDark = localStorage.getItem('alaya_pms_theme') === 'dark';
      this.isDark.set(isSavedDark);
      this.applyTheme(isSavedDark);

      // Auto-collapse sidebar to drawer mode on start on mobile screens
      if (window.innerWidth < 768) {
        this.isCollapsed.set(true);
      }
    }
  }

  filteredNavItems(): NavItem[] {
    const userRole = this.currentUser()?.role;
    if (!userRole) return [];
    return this.navItems.filter(item => item.roles.includes(userRole));
  }

  userInitials(): string {
    const name = this.currentUser()?.name || '';
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  toggleSidebar() {
    this.isCollapsed.update(val => !val);
  }

  closeSidebarMobile() {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.isCollapsed.set(true);
    }
  }

  onNavClick() {
    this.closeSidebarMobile();
  }

  toggleTheme() {
    this.isDark.update(val => {
      const next = !val;
      localStorage.setItem('alaya_pms_theme', next ? 'dark' : 'light');
      this.applyTheme(next);
      return next;
    });
  }

  private applyTheme(isDark: boolean) {
    if (typeof document !== 'undefined') {
      const body = document.body;
      if (isDark) {
        body.classList.add('dark-theme');
      } else {
        body.classList.remove('dark-theme');
      }
    }
  }

  activePageTitle(): string {
    const currentUrl = this.router.url;
    const active = this.navItems.find(item => currentUrl.includes(item.route));
    return active ? active.label : 'Admin Portal';
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
