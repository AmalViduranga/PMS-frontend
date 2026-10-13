import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PagedResult } from '../../core/services/api.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em;">Batch Inventory & FEFO Ledger</h1>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">Track physical batch expiry, allocations, and stock movements</p>
        </div>
        <button (click)="openAdjustmentModal()" class="btn btn-secondary btn-sm">
          ⚖️ Adjust Stock
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border); margin-bottom: 20px;">
        <button 
          (click)="activeTab = 'batches'; loadBatches()" 
          class="btn btn-sm"
          [style.background]="activeTab === 'batches' ? 'var(--primary)' : 'transparent'"
          [style.color]="activeTab === 'batches' ? '#fff' : 'var(--text-main)'"
          style="border-radius: 6px 6px 0 0;"
        >
          All Stock Batches
        </button>
        <button 
          (click)="activeTab = 'nearExpiry'; loadNearExpiry()" 
          class="btn btn-sm"
          [style.background]="activeTab === 'nearExpiry' ? 'var(--warning)' : 'transparent'"
          [style.color]="activeTab === 'nearExpiry' ? '#000' : 'var(--text-main)'"
          style="border-radius: 6px 6px 0 0;"
        >
          ⚠️ Near Expiry (&lt; 90 Days)
        </button>
        <button 
          (click)="activeTab = 'lowStock'; loadLowStock()" 
          class="btn btn-sm"
          [style.background]="activeTab === 'lowStock' ? 'var(--danger)' : 'transparent'"
          [style.color]="activeTab === 'lowStock' ? '#fff' : 'var(--text-main)'"
          style="border-radius: 6px 6px 0 0;"
        >
          📉 Low Stock Alerts
        </button>
      </div>

      <!-- Batches Table View -->
      @if (activeTab === 'batches' || activeTab === 'nearExpiry') {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Batch #</th>
                <th>Medicine / Product</th>
                <th>SKU</th>
                <th>Expiry Date</th>
                <th>On Hand</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Unit Cost</th>
                <th>Selling Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (batch of batches(); track batch.id) {
                <tr>
                  <td style="font-family: var(--font-mono); font-weight: 700;">{{ batch.batchNumber }}</td>
                  <td style="font-weight: 700;">{{ batch.productName }}</td>
                  <td style="font-family: var(--font-mono); color: var(--text-muted); font-size: 0.8rem;">{{ batch.sku }}</td>
                  <td>
                    <span [style.color]="isExpiringSoon(batch.expiryDate) ? 'var(--danger)' : 'var(--text-main)'" style="font-weight: 600;">
                      {{ batch.expiryDate | date:'yyyy-MM-dd' }}
                    </span>
                  </td>
                  <td style="font-family: var(--font-mono); font-weight: 700;">{{ batch.quantityOnHand }}</td>
                  <td style="font-family: var(--font-mono); color: var(--text-muted);">{{ batch.quantityReserved }}</td>
                  <td style="font-family: var(--font-mono); font-weight: 800; color: var(--success);">{{ batch.quantityAvailable }}</td>
                  <td style="font-family: var(--font-mono);">{{ batch.unitCost | currency:'LKR':'symbol':'1.2-2' }}</td>
                  <td style="font-family: var(--font-mono); font-weight: 700;">{{ batch.sellingPrice | currency:'LKR':'symbol':'1.2-2' }}</td>
                  <td>
                    <span class="badge" [ngClass]="getBatchBadgeClass(batch)">
                      {{ batch.status }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 36px;">
                    No batches found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Low Stock Alerts View -->
      @if (activeTab === 'lowStock') {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Brand</th>
                <th>Generic Name</th>
                <th>Reorder Threshold</th>
                <th>Current Stock</th>
                <th>Deficit</th>
              </tr>
            </thead>
            <tbody>
              @for (item of lowStockItems(); track item.productId) {
                <tr>
                  <td style="font-family: var(--font-mono); font-weight: 700; color: var(--danger);">{{ item.sku }}</td>
                  <td style="font-weight: 700;">{{ item.brandName }}</td>
                  <td style="color: var(--text-muted);">{{ item.genericName }}</td>
                  <td style="font-family: var(--font-mono);">{{ item.reorderThreshold }} {{ item.baseUnit }}</td>
                  <td style="font-family: var(--font-mono); font-weight: 800; color: var(--danger);">{{ item.currentStock }} {{ item.baseUnit }}</td>
                  <td style="font-family: var(--font-mono); color: var(--warning); font-weight: 700;">
                    -{{ item.reorderThreshold - item.currentStock }} {{ item.baseUnit }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 36px;">
                    All products are above their reorder thresholds.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal: Stock Adjustment -->
      @if (showAdjustmentModal()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 6px;">Audit Stock Adjustment</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">Durable adjustment recorded with manager sign-off</p>

            <form (ngSubmit)="saveAdjustment()">
              <div class="form-group">
                <label class="form-label">Target Batch</label>
                <select [(ngModel)]="adjustmentForm.stockBatchId" name="stockBatchId" required class="form-control">
                  @for (b of batches(); track b.id) {
                    <option [ngValue]="b.id">{{ b.productName }} (Batch: {{ b.batchNumber }} - Qty: {{ b.quantityOnHand }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Adjustment Type</label>
                <select [(ngModel)]="adjustmentForm.adjustmentType" name="adjustmentType" class="form-control">
                  <option value="QuantityIncrease">Quantity Increase (+)</option>
                  <option value="QuantityDecrease">Quantity Decrease (-)</option>
                  <option value="Damage">Damaged / Broken Stock</option>
                  <option value="Scrap">Expired Scrap</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Quantity Delta (Units)</label>
                <input type="number" min="1" [(ngModel)]="adjustmentForm.quantityDelta" name="quantityDelta" required class="form-control">
              </div>

              <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Justification Reason</label>
                <textarea [(ngModel)]="adjustmentForm.reason" name="reason" required rows="3" placeholder="Reason for inventory variance..." class="form-control"></textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="showAdjustmentModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class InventoryComponent implements OnInit {
  private api = inject(ApiService);

  activeTab: 'batches' | 'nearExpiry' | 'lowStock' = 'batches';
  batches = signal<any[]>([]);
  lowStockItems = signal<any[]>([]);

  showAdjustmentModal = signal<boolean>(false);
  adjustmentForm = {
    branchId: '',
    productId: '',
    stockBatchId: '',
    adjustmentType: 'QuantityIncrease',
    quantityDelta: 10,
    reason: 'Stock count physical audit variance'
  };

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.api.get<PagedResult<any>>('/api/inventory/batches', { pageIndex: 0, pageSize: 50 }).subscribe({
      next: (res) => {
        if (res.success) this.batches.set(res.data.items);
      }
    });
  }

  loadNearExpiry(): void {
    this.api.get<any[]>('/api/inventory/near-expiry', { daysThreshold: 90 }).subscribe({
      next: (res) => {
        if (res.success) this.batches.set(res.data);
      }
    });
  }

  loadLowStock(): void {
    this.api.get<any[]>('/api/inventory/low-stock').subscribe({
      next: (res) => {
        if (res.success) this.lowStockItems.set(res.data);
      }
    });
  }

  isExpiringSoon(expiryDateStr: string): boolean {
    const diffDays = (new Date(expiryDateStr).getTime() - Date.now()) / (1000 * 3600 * 24);
    return diffDays < 90;
  }

  getBatchBadgeClass(batch: any): string {
    if (batch.status === 'Quarantined') return 'badge-danger';
    if (batch.status === 'Active' && this.isExpiringSoon(batch.expiryDate)) return 'badge-warning';
    return 'badge-success';
  }

  openAdjustmentModal(): void {
    if (this.batches().length > 0) {
      const first = this.batches()[0];
      this.adjustmentForm.stockBatchId = first.id;
      this.adjustmentForm.branchId = first.branchId;
      this.adjustmentForm.productId = first.productId;
    }
    this.showAdjustmentModal.set(true);
  }

  saveAdjustment(): void {
    const selected = this.batches().find(b => b.id === this.adjustmentForm.stockBatchId);
    if (selected) {
      this.adjustmentForm.branchId = selected.branchId;
      this.adjustmentForm.productId = selected.productId;
    }

    this.api.post('/api/inventory/adjust', this.adjustmentForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.showAdjustmentModal.set(false);
          this.loadBatches();
        }
      }
    });
  }
}
