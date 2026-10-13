import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em;">Financial & Operations Intelligence</h1>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">Audited read projections: Gross profit with COGS basis, shift cash variance, and stock valuation</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button (click)="rebuildProjections()" class="btn btn-secondary btn-sm" [disabled]="rebuilding()">
            {{ rebuilding() ? 'Rebuilding Projections...' : '⚡ Rebuild Projections' }}
          </button>
          <div style="display: flex; gap: 6px;">
            <button (click)="activeTab.set('sales')" class="btn" [ngClass]="activeTab() === 'sales' ? 'btn-primary' : 'btn-secondary'">Daily Sales & P&L</button>
            <button (click)="activeTab.set('shifts')" class="btn" [ngClass]="activeTab() === 'shifts' ? 'btn-primary' : 'btn-secondary'">Shift Discrepancies</button>
            <button (click)="activeTab.set('valuation')" class="btn" [ngClass]="activeTab() === 'valuation' ? 'btn-primary' : 'btn-secondary'">Stock Valuation</button>
          </div>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      @if (dashboardSummary()) {
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px;">
          <div class="card" style="margin-bottom: 0;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Today Net Sales</div>
            <div style="font-size: 1.75rem; font-weight: 800; color: var(--primary); margin-top: 6px;">
              LKR {{ dashboardSummary().todaySales | number:'1.2-2' }}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">{{ dashboardSummary().todayTransactions }} receipts issued</div>
          </div>

          <div class="card" style="margin-bottom: 0;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Gross Profit (COGS Basis)</div>
            <div style="font-size: 1.75rem; font-weight: 800; color: var(--success); margin-top: 6px;">
              LKR {{ dashboardSummary().todayGrossProfit | number:'1.2-2' }}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Real acquisition cost basis</div>
          </div>

          <div class="card" style="margin-bottom: 0;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Inventory Valuation (Cost)</div>
            <div style="font-size: 1.75rem; font-weight: 800; color: var(--text); margin-top: 6px;">
              LKR {{ dashboardSummary().stockValuationCost | number:'1.2-2' }}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Retail: LKR {{ dashboardSummary().stockValuationRetail | number:'1.2-2' }}</div>
          </div>

          <div class="card" style="margin-bottom: 0;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Active Cashier Shifts</div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #f59e0b; margin-top: 6px;">
              {{ dashboardSummary().activeCashierShifts }} Open
            </div>
            <div style="font-size: 0.75rem; color: var(--danger); margin-top: 4px;">{{ dashboardSummary().nearExpiryCount }} batches near expiry</div>
          </div>
        </div>
      }

      <!-- TAB 1: DAILY SALES & PROFIT -->
      @if (activeTab() === 'sales') {
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h2 class="card-title">Sales, Cost of Goods Sold & Margins</h2>
              <p class="card-subtitle" style="margin-bottom: 0;">COGS tracked per batch unit cost at time of sale</p>
            </div>
            <div style="display: flex; gap: 10px;">
              <select class="form-control" [(ngModel)]="branchFilter" (ngModelChange)="loadDailySales()" style="width: 200px;">
                <option value="">All Branches</option>
                @for (b of branches(); track b.id) {
                  <option [value]="b.id">{{ b.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoices</th>
                  <th>Gross Sales</th>
                  <th>Discounts</th>
                  <th>Tax</th>
                  <th>Net Sales</th>
                  <th>COGS</th>
                  <th>Gross Profit</th>
                  <th>Cash Collected</th>
                  <th>Cash Refunds</th>
                </tr>
              </thead>
              <tbody>
                @for (s of dailySales(); track s.id) {
                  <tr>
                    <td style="font-weight: 600;">{{ s.date | date:'mediumDate' }}</td>
                    <td><span class="badge badge-info">{{ s.totalTransactions }}</span></td>
                    <td>{{ s.grossSales | number:'1.2-2' }}</td>
                    <td style="color: var(--danger);">{{ s.discountsGiven | number:'1.2-2' }}</td>
                    <td>{{ s.taxCollected | number:'1.2-2' }}</td>
                    <td style="font-weight: 700; color: var(--primary);">{{ s.netSales | number:'1.2-2' }}</td>
                    <td style="color: var(--text-muted);">{{ s.costOfGoodsSold | number:'1.2-2' }}</td>
                    <td style="font-weight: 700; color: var(--success);">{{ s.grossProfit | number:'1.2-2' }}</td>
                    <td style="font-family: var(--font-mono); color: var(--success);">{{ s.cashCollected | number:'1.2-2' }}</td>
                    <td style="font-family: var(--font-mono); color: var(--danger);">{{ s.cashRefunds | number:'1.2-2' }}</td>
                  </tr>
                }
                @if (dailySales().length === 0) {
                  <tr>
                    <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 32px;">No sales projections available for selected period</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: SHIFT RECONCILIATIONS -->
      @if (activeTab() === 'shifts') {
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h2 class="card-title">Cash Drawer Reconciliation Audit</h2>
              <p class="card-subtitle" style="margin-bottom: 0;">Discrepancies between physical counted cash and systemic expected register balances</p>
            </div>
            <select class="form-control" [(ngModel)]="shiftStatusFilter" (ngModelChange)="loadShiftReconciliations()" style="width: 180px;">
              <option value="">All Shifts</option>
              <option value="Closed">Closed & Reconciled</option>
              <option value="Open">Currently Open</option>
            </select>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Shift Opened</th>
                  <th>Cashier</th>
                  <th>Status</th>
                  <th>Opening Float</th>
                  <th>Cash Sales</th>
                  <th>Refunds</th>
                  <th>Expected Balance</th>
                  <th>Counted Cash</th>
                  <th>Over / Short Variance</th>
                </tr>
              </thead>
              <tbody>
                @for (sr of shiftReconciliations(); track sr.id) {
                  <tr>
                    <td>{{ sr.openedAtUtc | date:'short' }}</td>
                    <td style="font-weight: 600;">{{ sr.cashierName }}</td>
                    <td>
                      <span class="badge" [ngClass]="sr.status === 'Open' ? 'badge-warning' : 'badge-success'">
                        {{ sr.status }}
                      </span>
                    </td>
                    <td>LKR {{ sr.openingFloat | number:'1.2-2' }}</td>
                    <td style="color: var(--success);">+{{ sr.cashSales | number:'1.2-2' }}</td>
                    <td style="color: var(--danger);">-{{ sr.cashRefunds | number:'1.2-2' }}</td>
                    <td style="font-weight: 700;">LKR {{ sr.expectedCash | number:'1.2-2' }}</td>
                    <td style="font-family: var(--font-mono);">
                      {{ sr.closingCash ? ('LKR ' + (sr.closingCash | number:'1.2-2')) : '-- In Progress --' }}
                    </td>
                    <td>
                      @if (sr.closingCash) {
                        <span class="badge" [ngClass]="{
                          'badge-success': sr.overShortVariance === 0,
                          'badge-danger': sr.overShortVariance < 0,
                          'badge-warning': sr.overShortVariance > 0
                        }">
                          {{ sr.overShortVariance >= 0 ? '+' : '' }}{{ sr.overShortVariance | number:'1.2-2' }}
                        </span>
                      } @else {
                        <span style="color: var(--text-muted); font-size: 0.8rem;">Pending count</span>
                      }
                    </td>
                  </tr>
                }
                @if (shiftReconciliations().length === 0) {
                  <tr>
                    <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 32px;">No shift records matching query</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 3: STOCK VALUATION -->
      @if (activeTab() === 'valuation') {
        <div class="card">
          <div style="margin-bottom: 20px;">
            <h2 class="card-title">Inventory Valuation & Freshness Audit</h2>
            <p class="card-subtitle" style="margin-bottom: 0;">Balance sheet valuation based on actual batch landed acquisition costs</p>
          </div>

          @if (stockValuation()) {
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 24px;">
              <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Total Cost Valuation (FIFO/FEFO)</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--primary); margin-top: 8px;">
                  LKR {{ stockValuation().totalCostValuation | number:'1.2-2' }}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px;">Actual inventory capital deployed</div>
              </div>

              <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Total Retail Valuation</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--success); margin-top: 8px;">
                  LKR {{ stockValuation().totalRetailValuation | number:'1.2-2' }}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px;">Total retail realizable value</div>
              </div>

              <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Near-Expiry & At-Risk Stock</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--danger); margin-top: 8px;">
                  {{ stockValuation().nearExpiryBatchCount }} Batches
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px;">Expiring within threshold (90 days)</div>
              </div>
            </div>

            <div style="font-size: 0.85rem; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 16px;">
              Last snapshot generated: {{ stockValuation().snapshotDate | date:'medium' }}
            </div>
          } @else {
            <div style="text-align: center; color: var(--text-muted); padding: 40px;">
              No valuation snapshot found. Click "Rebuild Projections" above to generate snapshot.
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ReportingComponent implements OnInit {
  private api = inject(ApiService);

  activeTab = signal<'sales' | 'shifts' | 'valuation'>('sales');
  dashboardSummary = signal<any>(null);
  dailySales = signal<any[]>([]);
  shiftReconciliations = signal<any[]>([]);
  stockValuation = signal<any>(null);
  branches = signal<any[]>([]);

  branchFilter = '';
  shiftStatusFilter = '';
  rebuilding = signal(false);

  ngOnInit() {
    this.loadBranches();
    this.loadDashboard();
    this.loadDailySales();
    this.loadShiftReconciliations();
    this.loadStockValuation();
  }

  loadBranches() {
    this.api.get<any[]>('/api/operations/branches').subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.branches.set(res.data);
        }
      }
    });
  }

  loadDashboard() {
    let url = '/api/reporting/dashboard';
    if (this.branchFilter) url += `?branchId=${this.branchFilter}`;
    this.api.get<any>(url).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.dashboardSummary.set(res.data);
        }
      }
    });
  }

  loadDailySales() {
    let url = '/api/reporting/sales-summary';
    if (this.branchFilter) url += `?branchId=${this.branchFilter}`;
    this.api.get<any[]>(url).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.dailySales.set(res.data);
        }
      }
    });
  }

  loadShiftReconciliations() {
    let url = '/api/reporting/shift-reconciliation';
    const params: string[] = [];
    if (this.branchFilter) params.push(`branchId=${this.branchFilter}`);
    if (this.shiftStatusFilter) params.push(`status=${this.shiftStatusFilter}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    this.api.get<any[]>(url).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.shiftReconciliations.set(res.data);
        }
      }
    });
  }

  loadStockValuation() {
    let url = '/api/reporting/stock-valuation';
    if (this.branchFilter) url += `?branchId=${this.branchFilter}`;
    this.api.get<any>(url).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.stockValuation.set(res.data);
        }
      }
    });
  }

  rebuildProjections() {
    this.rebuilding.set(true);
    this.api.post<boolean>('/api/reporting/rebuild', {}).subscribe({
      next: (res) => {
        this.rebuilding.set(false);
        if (res.isSuccess) {
          alert('Projection tables recomputed successfully.');
          this.loadDashboard();
          this.loadDailySales();
          this.loadShiftReconciliations();
          this.loadStockValuation();
        } else {
          alert('Error: ' + res.message);
        }
      },
      error: () => {
        this.rebuilding.set(false);
        alert('Failed to rebuild projections.');
      }
    });
  }
}
