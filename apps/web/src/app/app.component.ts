import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (auth.currentUser()) {
      <div class="app-layout">
        <!-- Mobile Sidebar Backdrop -->
        @if (isMobileNavOpen()) {
          <div class="sidebar-backdrop" (click)="toggleMobileNav(false)"></div>
        }

        <!-- SIDEBAR -->
        <aside class="sidebar" [class.mobile-open]="isMobileNavOpen()">
          <!-- Sidebar Header -->
          <div class="sidebar-header">
            <a routerLink="/dashboard" class="sidebar-brand-group">
              <div class="sidebar-logo-icon">PF</div>
              <div class="sidebar-brand-text">
                <span class="sidebar-brand-title">PharmaFlow</span>
                <span class="sidebar-brand-badge">Enterprise PMS</span>
              </div>
            </a>
          </div>

          <!-- Navigation Links -->
          <nav class="sidebar-nav" aria-label="Main Navigation">
            <div class="nav-section-title">Core Operations</div>
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
              <span>Dashboard</span>
            </a>
            <a routerLink="/pos" routerLinkActive="active" class="nav-item" style="color: #2dd4bf; font-weight: 600;">
              <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
              <span>POS Terminal</span>
            </a>
            <a routerLink="/inventory" routerLinkActive="active" class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-1 18H5V9h14v11zm1-13H4V4h16v3z"/></svg>
              <span>Inventory & FEFO</span>
            </a>
            <a routerLink="/catalogue" routerLinkActive="active" class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M6 3h12c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm0 2v14h12V5H6zm2 3h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/></svg>
              <span>Medication Master</span>
            </a>

            <div class="nav-section-title">Clinical & Procurement</div>
            <a routerLink="/prescriptions" routerLinkActive="active" class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
              <span>Prescriptions Review</span>
            </a>
            <a routerLink="/purchasing" routerLinkActive="active" class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M19 7h-3V6c0-2.21-1.79-4-4-4S8 3.79 8 6v1H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9-1c0-1.1.9-2 2-2s2 .9 2 2v1h-4V6zm9 14H5V9h14v11z"/></svg>
              <span>Purchasing & POs</span>
            </a>
            <a routerLink="/returns" routerLinkActive="active" class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
              <span>Sales Returns</span>
            </a>

            <div class="nav-section-title">Workforce & Compliance</div>
            <a routerLink="/workforce" routerLinkActive="active" class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              <span>Workforce & Roster</span>
            </a>
            <a routerLink="/reporting" routerLinkActive="active" class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
              <span>Financial Intelligence</span>
            </a>
            <a routerLink="/branches" routerLinkActive="active" class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-5-7L2 6v2h19V6l-9-5z"/></svg>
              <span>Branches & Registers</span>
            </a>
          </nav>

          <!-- Sidebar Pinned Footer -->
          <div class="sidebar-footer">
            <div class="user-profile-summary">
              <div class="user-avatar-sm">
                {{ (auth.currentUser()?.fullName || 'U').charAt(0).toUpperCase() }}
              </div>
              <div class="user-profile-info">
                <div class="user-name">{{ auth.currentUser()?.fullName }}</div>
                <span class="user-role-badge">{{ auth.currentUser()?.roles?.[0] || 'Staff Member' }}</span>
              </div>
            </div>
            <button (click)="logout()" class="btn btn-secondary btn-sm" style="width: 100%; color: var(--danger); border-color: rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.05);">
              <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
              Sign Out
            </button>
          </div>
        </aside>

        <!-- MAIN VIEWPORT -->
        <div class="main-content">
          <!-- TOPBAR -->
          <header class="topbar">
            <div class="topbar-left">
              <!-- Mobile menu hamburger -->
              <button class="topbar-hamburger" (click)="toggleMobileNav()" aria-label="Toggle Navigation Menu">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              </button>

              <!-- Operational Context Pill -->
              <div class="branch-context-pill">
                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                <span>PharmaFlow Main Branch</span>
              </div>
            </div>

            <div class="topbar-right">
              <a routerLink="/pos" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
                <svg viewBox="0 0 24 24" style="width: 15px; height: 15px; fill: currentColor;"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                <span>Open POS</span>
              </a>
              <div class="user-avatar-sm" style="background: #f1f5f9; border: 1px solid var(--border); color: var(--primary);">
                {{ (auth.currentUser()?.fullName || 'U').charAt(0).toUpperCase() }}
              </div>
            </div>
          </header>

          <!-- ROUTED CONTENT -->
          <main class="page-content">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    } @else {
      <!-- Unauthenticated View (Login / Bootstrap / Reset) -->
      <router-outlet></router-outlet>
    }
  `
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  isMobileNavOpen = signal(false);

  constructor() {
    // Automatically close mobile nav drawer when navigating
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isMobileNavOpen.set(false);
      });
  }

  toggleMobileNav(force?: boolean) {
    if (force !== undefined) {
      this.isMobileNavOpen.set(force);
    } else {
      this.isMobileNavOpen.update(v => !v);
    }
  }

  logout() {
    this.auth.logout();
  }
}
