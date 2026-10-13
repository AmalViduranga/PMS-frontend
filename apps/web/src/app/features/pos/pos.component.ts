import { Component, OnInit, OnDestroy, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface CartItem {
  productId: string;
  sku: string;
  brandName: string;
  genericName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  baseUnit: string;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Shift Status Alert Banner -->
      @if (!currentShift()) {
        <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid var(--danger); border-radius: var(--radius-md); padding: 18px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="color: var(--danger); font-weight: 800; font-size: 1.05rem;">🔒 No Active Cashier Shift</div>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">You must open a cashier shift with an audited starting float before performing transactions.</p>
          </div>
          <button (click)="openShiftModal.set(true)" class="btn btn-primary" style="background: var(--danger);">
            Open Cashier Shift
          </button>
        </div>
      } @else {
        <!-- Active Shift Header Bar -->
        <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm);">
          <div style="display: flex; gap: 24px; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--success); display: inline-block;"></span>
              <span style="font-weight: 700; font-size: 0.9rem;">Register Active: {{ currentShift().registerName }}</span>
            </div>
            <div style="font-size: 0.82rem; color: var(--text-muted);">
              Float: <strong style="color: var(--text-main); font-family: var(--font-mono);">{{ currentShift().openingFloat | currency:'LKR':'symbol':'1.2-2' }}</strong>
            </div>
            <div style="font-size: 0.82rem; color: var(--text-muted);">
              Sales: <strong style="color: var(--success); font-family: var(--font-mono);">{{ currentShift().cashSalesTotal | currency:'LKR':'symbol':'1.2-2' }}</strong>
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button (click)="cashMovementModal.set(true)" class="btn btn-secondary btn-sm">💵 Cash In/Out</button>
            <button (click)="closeShiftModal.set(true)" class="btn btn-secondary btn-sm" style="color: var(--danger);">Close Shift</button>
          </div>
        </div>
      }

      <!-- POS Grid Screen -->
      <div class="pos-grid">
        
        <!-- Left Column: Search & Cart Table -->
        <div class="pos-catalog">
          
          <!-- Barcode & Quick Search Input -->
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; gap: 12px;">
              <div style="position: relative; flex: 1;">
                <input 
                  #barcodeInput
                  type="text" 
                  [(ngModel)]="searchBarcode" 
                  (keyup.enter)="onBarcodeEntered()"
                  placeholder="Scan barcode or enter SKU/Name (Keyboard-wedge auto-detect enabled)..." 
                  class="form-control"
                  style="padding-left: 38px; font-weight: 600;"
                  [disabled]="!currentShift()"
                >
                <span style="position: absolute; left: 12px; top: 11px;">🔍</span>
              </div>
              <button (click)="onBarcodeEntered()" class="btn btn-primary" [disabled]="!currentShift()">
                Find & Add
              </button>
            </div>
            @if (scannerStatusMessage()) {
              <div style="font-size: 0.78rem; color: var(--primary); margin-top: 6px; font-weight: 600;">
                {{ scannerStatusMessage() }}
              </div>
            }
          </div>

          <!-- Cart Items Table -->
          <div class="card" style="flex: 1; display: flex; flex-direction: column; padding: 0; overflow: hidden; margin-bottom: 0;">
            <div style="padding: 14px 20px; border-bottom: 1px solid var(--border); font-weight: 700; font-size: 0.95rem; display: flex; justify-content: space-between;">
              <span>Dispensing Cart ({{ cartItems().length }} items)</span>
              @if (cartItems().length > 0) {
                <button (click)="clearCart()" style="background: none; border: none; color: var(--danger); font-size: 0.8rem; cursor: pointer; font-weight: 600;">Clear All</button>
              }
            </div>

            <div style="flex: 1; overflow-y: auto;">
              <table class="table" style="margin-bottom: 0;">
                <thead style="position: sticky; top: 0; background: #f8fafc; z-index: 10;">
                  <tr>
                    <th>Item</th>
                    <th style="width: 100px;">Price</th>
                    <th style="width: 110px;">Qty</th>
                    <th style="width: 100px;">Disc (LKR)</th>
                    <th style="width: 120px;">Total</th>
                    <th style="width: 50px;"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of cartItems(); track item.productId; let idx = $index) {
                    <tr>
                      <td>
                        <div style="font-weight: 700;">{{ item.brandName }}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">{{ item.sku }} • {{ item.genericName }}</div>
                      </td>
                      <td style="font-family: var(--font-mono); font-size: 0.85rem;">
                        {{ item.unitPrice | currency:'LKR':'symbol':'1.2-2' }}
                      </td>
                      <td>
                        <input 
                          type="number" 
                          min="1" 
                          [(ngModel)]="item.quantity" 
                          (ngModelChange)="recalculateCart()"
                          class="form-control"
                          style="padding: 4px 8px; font-size: 0.85rem; width: 70px; font-family: var(--font-mono);"
                        >
                      </td>
                      <td>
                        <input 
                          type="number" 
                          min="0" 
                          [(ngModel)]="item.discountAmount" 
                          (ngModelChange)="recalculateCart()"
                          class="form-control"
                          style="padding: 4px 8px; font-size: 0.85rem; width: 70px; font-family: var(--font-mono);"
                        >
                      </td>
                      <td style="font-family: var(--font-mono); font-weight: 700; color: var(--text-main);">
                        {{ item.lineTotal | currency:'LKR':'symbol':'1.2-2' }}
                      </td>
                      <td>
                        <button (click)="removeItem(idx)" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem;">&times;</button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 48px;">
                        Cart is currently empty. Scan a barcode or search to add medicines.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Column: Checkout Panel & Cash Tendering -->
        <div class="pos-cart">
          <h2 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
            Order Settlement
          </h2>

          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Customer Name / Prescription Ref</label>
            <input type="text" [(ngModel)]="customerName" placeholder="Walk-in Customer" class="form-control">
          </div>

          <!-- Totals Breakdown -->
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 18px; font-size: 0.88rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--text-muted);">Subtotal:</span>
              <span style="font-family: var(--font-mono);">{{ cartSubtotal() | currency:'LKR':'symbol':'1.2-2' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--text-muted);">Discounts:</span>
              <span style="font-family: var(--font-mono); color: var(--success);">-{{ cartDiscount() | currency:'LKR':'symbol':'1.2-2' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--text-muted);">Tax:</span>
              <span style="font-family: var(--font-mono);">{{ cartTax() | currency:'LKR':'symbol':'1.2-2' }}</span>
            </div>
            <div style="border-top: 1px solid var(--border); padding-top: 8px; margin-top: 8px; display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 800; color: var(--primary);">
              <span>Grand Total:</span>
              <span style="font-family: var(--font-mono);">{{ cartGrandTotal() | currency:'LKR':'symbol':'1.2-2' }}</span>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label">Payment Method</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button 
                type="button" 
                (click)="paymentMethod = 'Cash'" 
                class="btn btn-sm"
                [ngClass]="paymentMethod === 'Cash' ? 'btn-primary' : 'btn-secondary'"
              >
                💵 Cash
              </button>
              <button 
                type="button" 
                (click)="paymentMethod = 'CardManual'" 
                class="btn btn-sm"
                [ngClass]="paymentMethod === 'CardManual' ? 'btn-primary' : 'btn-secondary'"
              >
                💳 Card (Manual)
              </button>
            </div>
          </div>

          <!-- Cash Tendering & Change Given -->
          @if (paymentMethod === 'Cash') {
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Cash Tendered (LKR)</label>
              <input 
                type="number" 
                step="50" 
                [(ngModel)]="tenderedAmount" 
                placeholder="0.00"
                class="form-control"
                style="font-family: var(--font-mono); font-size: 1.1rem; font-weight: 700;"
              >
            </div>

            <div style="background: #f1f5f9; border-radius: var(--radius-sm); padding: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: 0.9rem;">Change to Return:</span>
              <span style="font-family: var(--font-mono); font-size: 1.2rem; font-weight: 800; color: var(--primary);">
                {{ changeAmount() | currency:'LKR':'symbol':'1.2-2' }}
              </span>
            </div>
          }

          <button 
            (click)="checkout()" 
            [disabled]="cartItems().length === 0 || !currentShift() || isCheckingOut()"
            class="btn btn-primary"
            style="width: 100%; padding: 14px; font-size: 1.05rem; justify-content: center; margin-top: auto;"
          >
            @if (isCheckingOut()) {
              <span>Posting Transaction...</span>
            } @else {
              <span>Complete Sale & Print Receipt</span>
            }
          </button>
        </div>
      </div>

      <!-- Modal: Open Shift -->
      @if (openShiftModal()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 6px;">Open Cashier Shift</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">Declare opening cash float for audit reconciliation</p>

            <form (ngSubmit)="confirmOpenShift()">
              <div class="form-group">
                <label class="form-label">Select Branch & Register</label>
                <select [(ngModel)]="shiftForm.registerId" name="registerId" required class="form-control">
                  @for (reg of availableRegisters(); track reg.id) {
                    <option [ngValue]="reg.id">{{ reg.name }} ({{ reg.code }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Opening Cash Float (LKR)</label>
                <input type="number" step="100" [(ngModel)]="shiftForm.openingFloat" name="openingFloat" required class="form-control" style="font-family: var(--font-mono); font-size: 1.1rem;">
              </div>

              <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Notes</label>
                <input type="text" [(ngModel)]="shiftForm.notes" name="notes" placeholder="Shift opening notes..." class="form-control">
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="openShiftModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Authorize & Open Shift</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal: Close Shift -->
      @if (closeShiftModal()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 6px;">Close Cashier Shift</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">Perform end-of-shift cash drawer count</p>

            <form (ngSubmit)="confirmCloseShift()">
              <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 18px; font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Opening Float:</span>
                  <span style="font-family: var(--font-mono);">{{ currentShift()?.openingFloat | currency:'LKR':'symbol':'1.2-2' }}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Cash Sales Recorded:</span>
                  <span style="font-family: var(--font-mono); color: var(--success);">+{{ currentShift()?.cashSalesTotal | currency:'LKR':'symbol':'1.2-2' }}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 700; border-top: 1px solid var(--border); padding-top: 6px; margin-top: 6px;">
                  <span>Expected Drawer Cash:</span>
                  <span style="font-family: var(--font-mono);">{{ currentShift()?.expectedCash | currency:'LKR':'symbol':'1.2-2' }}</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Actual Counted Cash in Drawer (LKR)</label>
                <input type="number" step="50" [(ngModel)]="closingCountedCash" name="countedCash" required class="form-control" style="font-family: var(--font-mono); font-size: 1.1rem; font-weight: 700;">
              </div>

              <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Handover Notes</label>
                <input type="text" [(ngModel)]="closeShiftNotes" name="notes" placeholder="Variance explanation..." class="form-control">
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="closeShiftModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary" style="background: var(--danger);">Reconcile & Close Shift</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal: Print Receipt -->
      @if (lastReceipt()) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 420px; font-family: var(--font-mono);">
            <div style="text-align: center; border-bottom: 1px dashed var(--border); padding-bottom: 14px; margin-bottom: 14px;">
              <h3 style="font-weight: 800; font-size: 1.15rem; letter-spacing: 0.05em;">PHARMAFLOW HEALTHCARE</h3>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Central Pharmacy Terminal</div>
              <div style="font-size: 0.78rem; font-weight: 700; margin-top: 6px;">RECEIPT: {{ lastReceipt()?.invoiceNumber }}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Date: {{ lastReceipt()?.createdAtUtc | date:'medium' }}</div>
            </div>

            <div style="font-size: 0.8rem; margin-bottom: 14px;">
              @for (item of lastReceipt()?.items; track item.id) {
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>{{ item.productName }} x{{ item.quantity }}</span>
                  <span>{{ item.lineTotal | currency:'LKR':'symbol':'1.2-2' }}</span>
                </div>
              }
            </div>

            <div style="border-top: 1px dashed var(--border); padding-top: 8px; font-size: 0.85rem; font-weight: 700;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Total:</span>
                <span>{{ lastReceipt()?.grandTotal | currency:'LKR':'symbol':'1.2-2' }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">
                <span>Tendered:</span>
                <span>{{ lastReceipt()?.tenderedAmount | currency:'LKR':'symbol':'1.2-2' }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">
                <span>Change:</span>
                <span>{{ lastReceipt()?.changeGiven | currency:'LKR':'symbol':'1.2-2' }}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 18px; font-size: 0.75rem; color: var(--text-muted);">
              Thank you for trusting PharmaFlow!
            </div>

            <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
              <button (click)="lastReceipt.set(null)" class="btn btn-secondary btn-sm">Close</button>
              <button (click)="printReceiptWindow()" class="btn btn-primary btn-sm">🖨️ Print Receipt</button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class PosComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  currentShift = signal<any>(null);
  availableRegisters = signal<any[]>([]);

  cartItems = signal<CartItem[]>([]);
  searchBarcode = '';
  customerName = '';
  paymentMethod = 'Cash';
  tenderedAmount: number | null = null;
  scannerStatusMessage = signal<string | null>(null);

  isCheckingOut = signal<boolean>(false);
  lastReceipt = signal<any>(null);

  openShiftModal = signal<boolean>(false);
  closeShiftModal = signal<boolean>(false);
  cashMovementModal = signal<boolean>(false);

  shiftForm = {
    branchId: '',
    registerId: '',
    openingFloat: 5000,
    notes: 'Morning Opening Float'
  };

  closingCountedCash = 0;
  closeShiftNotes = '';

  // Keyboard wedge rapid barcode buffer
  private barcodeBuffer = '';
  private lastKeyTime = 0;

  ngOnInit(): void {
    this.loadCurrentShift();
    this.loadRegisters();
  }

  ngOnDestroy(): void {}

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Detect hardware barcode scanner (wedge emits rapid sequence terminated by Enter)
    const currentTime = Date.now();
    const diff = currentTime - this.lastKeyTime;
    this.lastKeyTime = currentTime;

    if (event.key === 'Enter') {
      if (this.barcodeBuffer.length >= 4) {
        this.lookupAndAddToCart(this.barcodeBuffer);
        this.barcodeBuffer = '';
        event.preventDefault();
      }
    } else if (event.key.length === 1) {
      if (diff > 50) {
        this.barcodeBuffer = event.key;
      } else {
        this.barcodeBuffer += event.key;
      }
    }
  }

  loadCurrentShift(): void {
    this.api.get<any>('/api/shifts/current').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentShift.set(res.data);
          this.shiftForm.branchId = res.data.branchId;
        } else {
          this.currentShift.set(null);
        }
      }
    });
  }

  loadRegisters(): void {
    this.api.get<any[]>('/api/branches/registers').subscribe({
      next: (res) => {
        if (res.success && res.data.length > 0) {
          this.availableRegisters.set(res.data);
          this.shiftForm.registerId = res.data[0].id;
          this.shiftForm.branchId = res.data[0].branchId;
        }
      }
    });
  }

  onBarcodeEntered(): void {
    if (!this.searchBarcode.trim()) return;
    this.lookupAndAddToCart(this.searchBarcode.trim());
    this.searchBarcode = '';
  }

  lookupAndAddToCart(barcode: string): void {
    this.scannerStatusMessage.set(`Scanning: ${barcode}...`);
    this.api.get<any>(`/api/catalogue/products/barcode/${barcode}`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.addProductToCart(res.data);
          this.scannerStatusMessage.set(`Added: ${res.data.brandName}`);
          setTimeout(() => this.scannerStatusMessage.set(null), 3000);
        }
      },
      error: () => {
        this.scannerStatusMessage.set(`Item not found for barcode: ${barcode}`);
        setTimeout(() => this.scannerStatusMessage.set(null), 3000);
      }
    });
  }

  addProductToCart(product: any): void {
    const existing = this.cartItems().find(i => i.productId === product.id);
    if (existing) {
      existing.quantity += 1;
      this.recalculateCart();
    } else {
      const item: CartItem = {
        productId: product.id,
        sku: product.sku,
        brandName: product.brandName,
        genericName: product.genericName,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discountAmount: 0,
        lineTotal: product.sellingPrice,
        baseUnit: product.baseUnit
      };
      this.cartItems.update(items => [...items, item]);
      this.recalculateCart();
    }
  }

  removeItem(index: number): void {
    this.cartItems.update(items => items.filter((_, i) => i !== index));
    this.recalculateCart();
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.recalculateCart();
  }

  recalculateCart(): void {
    this.cartItems.update(items => {
      return items.map(item => {
        const gross = item.unitPrice * item.quantity;
        const discount = Math.min(gross, item.discountAmount || 0);
        return {
          ...item,
          lineTotal: gross - discount
        };
      });
    });

    if (this.paymentMethod === 'Cash' && (!this.tenderedAmount || this.tenderedAmount < this.cartGrandTotal())) {
      this.tenderedAmount = this.cartGrandTotal();
    }
  }

  cartSubtotal(): number {
    return this.cartItems().reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }

  cartDiscount(): number {
    return this.cartItems().reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  }

  cartTax(): number {
    return 0; // Tax included or snapshot computed
  }

  cartGrandTotal(): number {
    return Math.max(0, this.cartSubtotal() - this.cartDiscount() + this.cartTax());
  }

  changeAmount(): number {
    if (!this.tenderedAmount) return 0;
    return Math.max(0, this.tenderedAmount - this.cartGrandTotal());
  }

  checkout(): void {
    const shift = this.currentShift();
    if (!shift) return;

    this.isCheckingOut.set(true);

    const payload = {
      branchId: shift.branchId,
      registerId: shift.registerId,
      shiftId: shift.id,
      customerName: this.customerName || 'Walk-in Customer',
      paymentMethod: this.paymentMethod,
      tenderedAmount: this.paymentMethod === 'Cash' ? (this.tenderedAmount || this.cartGrandTotal()) : this.cartGrandTotal(),
      idempotencyKey: `POS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      items: this.cartItems().map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount
      }))
    };

    this.api.post<any>('/api/pos/checkout', payload).subscribe({
      next: (res) => {
        this.isCheckingOut.set(false);
        if (res.success) {
          this.lastReceipt.set(res.data);
          this.clearCart();
          this.loadCurrentShift(); // Refresh shift balance
        }
      },
      error: (err) => {
        this.isCheckingOut.set(false);
        alert(err.error?.message || 'Checkout failed.');
      }
    });
  }

  confirmOpenShift(): void {
    const reg = this.availableRegisters().find(r => r.id === this.shiftForm.registerId);
    this.api.post('/api/shifts/open', {
      branchId: reg?.branchId || this.shiftForm.branchId,
      registerId: this.shiftForm.registerId,
      openingFloat: this.shiftForm.openingFloat,
      notes: this.shiftForm.notes
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.openShiftModal.set(false);
          this.loadCurrentShift();
        }
      }
    });
  }

  confirmCloseShift(): void {
    const shift = this.currentShift();
    if (!shift) return;

    this.api.post(`/api/shifts/${shift.id}/close`, {
      closingCountedCash: this.closingCountedCash,
      notes: this.closeShiftNotes
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeShiftModal.set(false);
          this.currentShift.set(null);
          alert('Shift successfully closed and audited.');
        }
      }
    });
  }

  printReceiptWindow(): void {
    window.print();
  }
}
