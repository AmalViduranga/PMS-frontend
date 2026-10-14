import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Pharmacy Operations Dashboard</h1>
          <p class="page-subtitle">Real-time executive telemetry, revenue realization, and inventory valuation</p>
        </div>
        <div class="page-actions">
          <button (click)="loadMetrics()" class="btn btn-secondary btn-sm" [disabled]="loading()">
            <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;" [style.animation]="loading() ? 'spin 1s linear infinite' : 'none'">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            <span>{{ loading() ? 'Refreshing...' : 'Refresh Telemetry' }}</span>
          </button>
        </div>
      </div>

      <!-- Error State -->
      @if (errorMessage()) {
        <div class="alert alert-danger">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: currentColor; flex-shrink: 0;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            <div>
              <div style="font-weight: 700;">Reporting Telemetry Unavailable</div>
              <div style="font-size: 0.85rem;">{{ errorMessage() }}</div>
            </div>
          </div>
          <button (click)="loadMetrics()" class="btn btn-secondary btn-sm">Retry</button>
        </div>
      }

      <!-- Metric Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 28px;">
        
        <!-- Card 1: Today Sales -->
        <div class="stat-card" style="border-left: 4px solid var(--primary);">
          <div>
            <div class="stat-card-label">Today Net Sales</div>
            <div class="stat-card-value">
              {{ (metrics()?.todaySales ?? metrics()?.TodaySales ?? 0) | currency:(metrics()?.currency || metrics()?.Currency || 'LKR'):'symbol':'1.2-2' }}
            </div>
            <div class="stat-card-sub">
              {{ metrics()?.todayTransactions ?? metrics()?.TodayTransactions ?? 0 }} total posted transactions
            </div>
          </div>
          <div class="stat-card-icon" style="background: var(--primary-light); color: var(--primary);">
            <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
          </div>
        </div>

        <!-- Card 2: Gross Profit -->
        <div class="stat-card" style="border-left: 4px solid var(--success);">
          <div>
            <div class="stat-card-label">Today Gross Profit</div>
            <div class="stat-card-value" style="color: var(--success);">
              {{ (metrics()?.todayGrossProfit ?? metrics()?.TodayGrossProfit ?? 0) | currency:(metrics()?.currency || metrics()?.Currency || 'LKR'):'symbol':'1.2-2' }}
            </div>
            <div class="stat-card-sub">
              Net sales minus acquisition cost
            </div>
          </div>
          <div class="stat-card-icon" style="background: var(--success-bg); color: var(--success);">
            <svg viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
          </div>
        </div>

        <!-- Card 3: Active Shifts -->
        <div class="stat-card" style="border-left: 4px solid var(--accent);">
          <div>
            <div class="stat-card-label">Active Cashier Shifts</div>
            <div class="stat-card-value">
              {{ metrics()?.activeCashierShifts ?? metrics()?.ActiveCashierShifts ?? 0 }}
            </div>
            <div class="stat-card-sub">
              Open registers across branches
            </div>
          </div>
          <div class="stat-card-icon" style="background: var(--accent-light); color: var(--accent);">
            <svg viewBox="0 0 24 24"><path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-5-7L2 6v2h19V6l-9-5z"/></svg>
          </div>
        </div>

        <!-- Card 4: Inventory Valuation -->
        <div class="stat-card" style="border-left: 4px solid var(--warning);">
          <div>
            <div class="stat-card-label">Stock Valuation (Cost)</div>
            <div class="stat-card-value">
              {{ (metrics()?.stockValuationCost ?? metrics()?.StockValuationCost ?? 0) | currency:(metrics()?.currency || metrics()?.Currency || 'LKR'):'symbol':'1.0-0' }}
            </div>
            <div class="stat-card-sub" style="color: var(--warning); font-weight: 600;">
              {{ metrics()?.nearExpiryCount ?? metrics()?.NearExpiryCount ?? 0 }} batch(es) near expiry
            </div>
          </div>
          <div class="stat-card-icon" style="background: var(--warning-bg); color: var(--warning);">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-1 18H5V9h14v11zm1-13H4V4h16v3z"/></svg>
          </div>
        </div>

      </div>

      <!-- Telemetry Info Card -->
      <div class="card">
        <h2 class="card-title">Accounting & Compliance Telemetry Rules</h2>
        <p class="card-subtitle">Server-authoritative metrics definitions</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; font-size: 0.85rem;">
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: var(--primary);"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              Cost Basis Accounting
            </div>
            <div style="color: var(--text-muted);">{{ metrics()?.metricDefinitions?.grossProfit ?? metrics()?.MetricDefinitions?.GrossProfit || 'Calculated as posted net sales less exact weighted unit acquisition cost.' }}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: var(--success);"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
              Cash Reconciliation
            </div>
            <div style="color: var(--text-muted);">{{ metrics()?.metricDefinitions?.cashCollected ?? metrics()?.MetricDefinitions?.CashCollected || 'Reconciled from active and closed shift registers.' }}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: var(--info);"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
              Data Freshness
            </div>
            <div style="color: var(--text-muted);">{{ metrics()?.metricDefinitions?.freshness ?? metrics()?.MetricDefinitions?.Freshness || 'Real-time event projection synchronized via RabbitMQ event outbox.' }}</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  metrics = signal<any>(null);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.get<any>('/api/reporting/dashboard').subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.metrics.set(res.data);
        } else {
          this.errorMessage.set(res.message || 'Unable to retrieve dashboard metrics.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to connect to the reporting service.');
      }
    });
  }
}
