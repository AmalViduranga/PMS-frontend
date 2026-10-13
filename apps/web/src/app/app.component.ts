import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (auth.currentUser()) {
      <div class="app-layout">
        <!-- SIDEBAR -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 1.2rem; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                PF
              </div>
              <div>
                <div style="font-weight: 800; font-size: 1.05rem; letter-spacing: -0.02em; color: var(--text);">PharmaFlow</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">ENTERPRISE PMS</div>
              </div>
            </div>
          </div>

          <div class="sidebar-nav">
            <div class="nav-section-title">Core Operations</div>
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
              <span>📊 Dashboard</span>
            </a>
            <a routerLink="/pos" routerLinkActive="active" class="nav-item" style="color: var(--primary); font-weight: 600;">
              <span>⚡ POS Terminal</span>
            </a>
            <a routerLink="/inventory" routerLinkActive="active" class="nav-item">
              <span>📦 Inventory & FEFO</span>
            </a>
            <a routerLink="/catalogue" routerLinkActive="active" class="nav-item">
              <span>💊 Medication Master</span>
            </a>

            <div class="nav-section-title">Clinical & Procurement</div>
            <a routerLink="/prescriptions" routerLinkActive="active" class="nav-item">
              <span>📋 Prescriptions Review</span>
            </a>
            <a routerLink="/purchasing" routerLinkActive="active" class="nav-item">
              <span>🛒 Purchasing & POs</span>
            </a>
            <a routerLink="/returns" routerLinkActive="active" class="nav-item">
              <span>🔄 Sales Returns</span>
            </a>

            <div class="nav-section-title">Workforce & Compliance</div>
            <a routerLink="/workforce" routerLinkActive="active" class="nav-item">
              <span>👥 Workforce & Roster</span>
            </a>
            <a routerLink="/reporting" routerLinkActive="active" class="nav-item">
              <span>📈 Financial Intelligence</span>
            </a>
            <a routerLink="/branches" routerLinkActive="active" class="nav-item">
              <span>🏢 Branches & Registers</span>
            </a>
          </div>

          <div class="sidebar-footer">
            <div style="margin-bottom: 12px;">
              <div style="font-weight: 600; font-size: 0.88rem; color: var(--text);">{{ auth.currentUser()?.fullName }}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">{{ auth.currentUser()?.email }}</div>
              <div style="margin-top: 4px;">
                <span class="badge badge-info" style="font-size: 0.7rem;">{{ auth.currentUser()?.roles?.[0] || 'Staff' }}</span>
              </div>
            </div>
            <button (click)="logout()" class="btn btn-secondary btn-sm" style="width: 100%; justify-content: center; color: var(--danger);">
              Sign Out
            </button>
          </div>
        </aside>

        <!-- MAIN VIEWPORT -->
        <div class="main-content">
          <!-- TOPBAR -->
          <header class="topbar">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="badge badge-success" style="font-family: var(--font-mono); font-size: 0.72rem;">
                ● BFF SECURE SESSION
              </span>
              <span style="font-size: 0.82rem; color: var(--text-muted);">
                Cookie Auth • XSRF Guard Active
              </span>
            </div>

            <div style="display: flex; align-items: center; gap: 14px;">
              <a routerLink="/pos" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 6px;">
                <span>🛒 Open POS</span>
              </a>
              <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; color: var(--primary);">
                {{ (auth.currentUser()?.fullName || 'U').charAt(0) }}
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
      <!-- Unauthenticated View (Login / Bootstrap) -->
      <router-outlet></router-outlet>
    }
  `
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout();
  }
}
