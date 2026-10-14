import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em;">Customer Returns & Refunds</h1>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">Return lookup, quarantine routing, and shift cash adjustments</p>
      </div>

      <!-- Search Invoice Form -->
      <div class="card" style="padding: 20px; margin-bottom: 24px;">
        <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px;">Lookup Original Invoice</h2>
        <div style="display: flex; gap: 12px; max-width: 540px;">
          <input 
            type="text" 
            [(ngModel)]="invoiceQuery" 
            (keyup.enter)="lookupInvoice()"
            placeholder="Enter Invoice Number (e.g. INV-20261013-00001)..." 
            class="form-control"
            style="font-family: var(--font-mono); font-weight: 600;"
          >
          <button (click)="lookupInvoice()" class="btn btn-primary" [disabled]="loading()">
            {{ loading() ? 'Searching...' : 'Lookup' }}
          </button>
        </div>
        @if (lookupError()) {
          <div style="color: var(--danger); font-size: 0.82rem; margin-top: 8px;">{{ lookupError() }}</div>
        }
      </div>

      <!-- Sale Details & Returnable Items -->
      @if (sale()) {
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 14px;">
            <div>
              <span class="badge badge-info" style="font-family: var(--font-mono); font-size: 0.85rem;">{{ sale()?.invoiceNumber }}</span>
              <h2 style="font-size: 1.25rem; font-weight: 800; margin-top: 6px;">Sale Transaction Details</h2>
              <div style="font-size: 0.82rem; color: var(--text-muted);">Customer: {{ sale()?.customerName || 'Walk-in' }} • Date: {{ sale()?.createdAtUtc | date:'medium' }}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.8rem; color: var(--text-muted);">Total Paid:</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary); font-family: var(--font-mono);">
                {{ sale()?.grandTotal | currency:'LKR':'symbol':'1.2-2' }}
              </div>
            </div>
          </div>

          <div class="table-responsive" style="margin-bottom: 24px;">
            <table class="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Batch #</th>
                  <th>Sold Qty</th>
                  <th>Already Returned</th>
                  <th>Returnable Max</th>
                  <th style="width: 140px;">Return Qty</th>
                  <th>Unit Refund</th>
                </tr>
              </thead>
              <tbody>
                @for (item of returnLines(); track item.saleItemId) {
                  <tr>
                    <td style="font-weight: 700;">{{ item.productName }}</td>
                    <td style="font-family: var(--font-mono);">{{ item.batchNumber }}</td>
                    <td style="font-family: var(--font-mono);">{{ item.soldQuantity }}</td>
                    <td style="font-family: var(--font-mono); color: var(--text-muted);">{{ item.alreadyReturned }}</td>
                    <td style="font-family: var(--font-mono); font-weight: 700; color: var(--success);">{{ item.returnableQuantity }}</td>
                    <td>
                      <input 
                        type="number" 
                        min="0" 
                        [max]="item.returnableQuantity" 
                        [(ngModel)]="item.returnQuantity" 
                        class="form-control"
                        style="padding: 4px 8px; width: 90px; font-family: var(--font-mono);"
                      >
                    </td>
                    <td style="font-family: var(--font-mono);">{{ item.unitPrice | currency:'LKR':'symbol':'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Refund Execution Form -->
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Refund Method</label>
                <select [(ngModel)]="refundMethod" class="form-control">
                  <option value="Cash">Cash Handover</option>
                  <option value="CreditNote">Store Credit Note</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Return Reason</label>
                <input type="text" [(ngModel)]="returnReason" placeholder="Patient adverse reaction, incorrect dispense..." class="form-control">
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 16px;">
              <div style="font-size: 0.85rem; color: var(--warning); font-weight: 600;">
                ⚠️ Returned medicines are routed to Quarantine status pending audit disposition.
              </div>
              <button (click)="processReturn()" class="btn btn-primary" [disabled]="totalReturnQty() === 0 || processing()">
                {{ processing() ? 'Processing...' : 'Confirm Return & Refund' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ReturnsComponent {
  private api = inject(ApiService);

  invoiceQuery = '';
  loading = signal<boolean>(false);
  lookupError = signal<string | null>(null);
  processing = signal<boolean>(false);

  sale = signal<any>(null);
  returnLines = signal<any[]>([]);

  refundMethod = 'Cash';
  returnReason = 'Customer return';

  lookupInvoice(): void {
    if (!this.invoiceQuery.trim()) return;

    this.loading.set(true);
    this.lookupError.set(null);

    this.api.get<any>(`/api/pos/sales/invoice/${this.invoiceQuery.trim()}`).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.sale.set(res.data);
          const lines = res.data.items.map((i: any) => ({
            saleItemId: i.id,
            productName: i.productName,
            batchNumber: i.batchNumber,
            soldQuantity: i.quantity,
            alreadyReturned: i.quantity - i.remainingReturnableQuantity,
            returnableQuantity: i.remainingReturnableQuantity,
            returnQuantity: 0,
            unitPrice: i.unitPrice
          }));
          this.returnLines.set(lines);
        }
      },
      error: () => {
        this.loading.set(false);
        this.lookupError.set(`Invoice '${this.invoiceQuery}' not found.`);
      }
    });
  }

  totalReturnQty(): number {
    return this.returnLines().reduce((sum, line) => sum + (line.returnQuantity || 0), 0);
  }

  processReturn(): void {
    const linesToReturn = this.returnLines().filter(l => l.returnQuantity > 0);
    if (linesToReturn.length === 0) return;

    const s = this.sale();
    if (!s) return;

    this.processing.set(true);

    // Ensure cashier has an active open shift to record cash refund
    this.api.get<any>('/api/shifts/current').subscribe({
      next: (shiftRes) => {
        if (!shiftRes.success || !shiftRes.data || shiftRes.data.status !== 'Open') {
          this.processing.set(false);
          alert('You must have an active open cashier shift to process refunds.');
          return;
        }

        const activeShiftId = shiftRes.data.id;
        const payload = {
          originalSaleId: s.id,
          shiftId: activeShiftId,
          refundMethod: this.refundMethod,
          reason: this.returnReason,
          idempotencyKey: `RET-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          items: linesToReturn.map(l => ({
            originalSaleItemId: l.saleItemId,
            returnedQuantity: l.returnQuantity
          }))
        };

        this.api.post<any>('/api/pos/returns', payload).subscribe({
          next: (res) => {
            this.processing.set(false);
            if (res.success) {
              alert(`Return processed successfully! Return Reference: ${res.data.returnNumber}. Stock has been routed to Quarantine.`);
              this.sale.set(null);
              this.invoiceQuery = '';
            }
          },
          error: (err) => {
            this.processing.set(false);
            alert(err.error?.message || 'Failed to process return.');
          }
        });
      },
      error: () => {
        this.processing.set(false);
        alert('Could not verify active cashier shift.');
      }
    });
  }
}
