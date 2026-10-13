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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-main);">Pharmacy Operations Dashboard</h1>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">Live executive telemetry and financial performance</p>
        </div>
        <button (click)="loadMetrics()" class="btn btn-secondary btn-sm" [disabled]="loading()">
          <span>🔄</span> <span>{{ loading() ? 'Refreshing...' : 'Refresh Telemetry' }}</span>
        </button>
      </div>

      <!-- Metric Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 28px;">
        
        <!-- Card 1: Today Sales -->
        <div class="card" style="margin-bottom: 0; border-left: 4px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Today Net Sales</div>
              <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); margin: 8px 0 4px; font-family: var(--font-mono);">
                {{ metrics()?.TodaySales | currency:(metrics()?.Currency || 'LKR'):'symbol':'1.2-2' }}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                {{ metrics()?.TodayTransactions || 0 }} total posted transactions
              </div>
            </div>
            <div style="width: 44px; height: 44px; background: var(--primary-light); color: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              💳
            </div>
          </div>
        </div>

        <!-- Card 2: Gross Profit -->
        <div class="card" style="margin-bottom: 0; border-left: 4px solid var(--success);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Today Gross Profit</div>
              <div style="font-size: 1.85rem; font-weight: 800; color: var(--success); margin: 8px 0 4px; font-family: var(--font-mono);">
                {{ metrics()?.TodayGrossProfit | currency:(metrics()?.Currency || 'LKR'):'symbol':'1.2-2' }}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Net sales minus acquisition cost
              </div>
            </div>
            <div style="width: 44px; height: 44px; background: var(--success-bg); color: var(--success); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              📈
            </div>
          </div>
        </div>

        <!-- Card 3: Active Shifts -->
        <div class="card" style="margin-bottom: 0; border-left: 4px solid var(--accent);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Active Cashier Shifts</div>
              <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); margin: 8px 0 4px; font-family: var(--font-mono);">
                {{ metrics()?.ActiveCashierShifts || 0 }}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Open registers across branches
              </div>
            </div>
            <div style="width: 44px; height: 44px; background: #eff6ff; color: var(--accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              🏪
            </div>
          </div>
        </div>

        <!-- Card 4: Inventory Valuation -->
        <div class="card" style="margin-bottom: 0; border-left: 4px solid var(--warning);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Stock Valuation (Cost)</div>
              <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); margin: 8px 0 4px; font-family: var(--font-mono);">
                {{ metrics()?.StockValuationCost | currency:(metrics()?.Currency || 'LKR'):'symbol':'1.0-0' }}
              </div>
              <div style="font-size: 0.78rem; color: var(--warning); font-weight: 600;">
                {{ metrics()?.NearExpiryCount || 0 }} batch(es) near expiry
              </div>
            </div>
            <div style="width: 44px; height: 44px; background: var(--warning-bg); color: var(--warning); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              📦
            </div>
          </div>
        </div>

      </div>

      <!-- Telemetry Info Card -->
      <div class="card">
        <h2 class="card-title">Accounting & Compliance Telemetry Rules</h2>
        <p class="card-subtitle">Server-authoritative metrics definitions</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; font-size: 0.85rem;">
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">🎯 Cost Basis Accounting</div>
            <div style="color: var(--text-muted);">{{ metrics()?.MetricDefinitions?.GrossProfit }}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">💵 Cash Reconciliation</div>
            <div style="color: var(--text-muted);">{{ metrics()?.MetricDefinitions?.CashCollected }}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">⏱️ Data Freshness</div>
            <div style="color: var(--text-muted);">{{ metrics()?.MetricDefinitions?.Freshness }}</div>
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

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.loading.set(true);
    this.api.get<any>('/api/reporting/dashboard').subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.metrics.set(res.data);
        }
      },
      error: () => this.loading.set(false)
    });
  }
}
