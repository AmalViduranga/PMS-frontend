import { Component, OnInit, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (cart.isOpen()) {
      <div class="modal-backdrop" (click)="cart.isOpen.set(false)" style="background: rgba(15, 23, 42, 0.4);">
        <div class="cart-drawer" (click)="$event.stopPropagation()">
          <!-- CART HEADER -->
          <div class="cart-header">
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">Click-and-Collect Cart</h2>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">{{ cart.itemCount() }} items selected</p>
            </div>
            <button (click)="cart.isOpen.set(false)" class="btn btn-secondary btn-sm" style="border-radius: 50%; width: 32px; height: 32px; padding: 0;">&times;</button>
          </div>

          <!-- CART BODY -->
          <div class="cart-body">
            <!-- ITEMS LIST -->
            @for (item of cart.items(); track item.productId) {
              <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                  <div>
                    <div style="font-weight: 700; font-size: 0.95rem;">{{ item.brandName }}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted); font-style: italic;">{{ item.genericName }}</div>
                  </div>
                  @if (item.requiresPrescription) {
                    <span class="badge badge-rx" style="font-size: 0.65rem;">Rx Required</span>
                  }
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button (click)="cart.updateQuantity(item.productId, item.quantity - 1)" class="btn btn-secondary btn-sm" style="padding: 2px 8px;">-</button>
                    <span style="font-weight: 700; font-size: 0.9rem; min-width: 24px; text-align: center;">{{ item.quantity }}</span>
                    <button (click)="cart.updateQuantity(item.productId, item.quantity + 1)" class="btn btn-secondary btn-sm" style="padding: 2px 8px;">+</button>
                  </div>

                  <div style="text-align: right;">
                    <div style="font-weight: 800; font-size: 0.95rem; color: var(--primary);">
                      LKR {{ (item.unitPrice * item.quantity) | number:'1.2-2' }}
                    </div>
                    <button (click)="cart.removeItem(item.productId)" style="background: none; border: none; color: var(--danger); font-size: 0.75rem; cursor: pointer; margin-top: 2px;">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            }

            @if (cart.items().length === 0) {
              <div style="text-align: center; padding: 48px 0; color: var(--text-muted);">
                <div style="font-size: 2.5rem; margin-bottom: 12px;">🛒</div>
                <h4 style="font-weight: 700;">Your cart is empty</h4>
                <p style="font-size: 0.85rem; margin-top: 4px;">Browse medications and add items for pickup.</p>
              </div>
            }

            @if (cart.items().length > 0) {
              <!-- BRANCH SELECTION -->
              <div style="margin-top: 24px; border-top: 1px solid var(--border); padding-top: 18px;">
                <label class="form-label">Select Pickup Pharmacy Branch *</label>
                <select class="form-control" [ngModel]="cart.selectedBranchId()" (ngModelChange)="onBranchChange($event)">
                  <option value="">-- Choose Branch --</option>
                  @for (b of branches(); track b.id) {
                    <option [value]="b.id">{{ b.name }} ({{ b.address }})</option>
                  }
                </select>
              </div>

              <!-- PRESCRIPTION REQUIREMENT UPLOAD -->
              @if (cart.hasRxItems()) {
                <div style="margin-top: 20px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: var(--radius-sm); padding: 16px;">
                  <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 1.2rem;">⚠️</span>
                    <h4 style="font-size: 0.9rem; font-weight: 800; color: #9f1239;">Prescription Document Required</h4>
                  </div>
                  <p style="font-size: 0.8rem; color: #881337; margin-bottom: 12px; line-height: 1.5;">
                    Your cart contains prescription-only medications. Upload a clear doctor prescription (PDF, JPEG, or PNG) with valid medical license.
                  </p>

                  @if (cart.prescriptionDocumentId()) {
                    <div style="background: white; border: 1px solid #fda4af; padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 0.8rem; font-weight: 600; color: #9f1239;">📎 {{ cart.prescriptionFileName() }}</span>
                      <button (click)="cart.setPrescription(null, null)" class="btn btn-secondary btn-sm" style="font-size: 0.7rem; padding: 2px 6px;">Remove</button>
                    </div>
                  } @else {
                    <input type="file" (change)="onPrescriptionFileSelected($event)" accept=".pdf,image/jpeg,image/png" class="form-control" style="font-size: 0.8rem; background: white;" />
                    @if (uploading()) {
                      <div style="font-size: 0.75rem; color: #9f1239; margin-top: 6px;">Verifying header bytes & uploading...</div>
                    }
                  }
                </div>
              }

              <!-- SPECIAL INSTRUCTIONS -->
              <div style="margin-top: 20px;">
                <label class="form-label">Pickup Notes or Instructions</label>
                <input type="text" class="form-control" [ngModel]="cart.notes()" (ngModelChange)="cart.notes.set($event)" placeholder="e.g. Will collect after 5:00 PM" />
              </div>
            }
          </div>

          <!-- CART FOOTER -->
          @if (cart.items().length > 0) {
            <div class="cart-footer">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <span style="font-size: 0.95rem; font-weight: 600; color: var(--text-muted);">Estimated Total</span>
                <span style="font-size: 1.4rem; font-weight: 800; color: var(--primary);">
                  LKR {{ cart.subtotal() | number:'1.2-2' }}
                </span>
              </div>

              <button
                (click)="submitCheckout()"
                class="btn btn-primary"
                style="width: 100%; border-radius: var(--radius-sm); padding: 12px; font-size: 0.95rem;"
                [disabled]="submitting() || !cart.selectedBranchId() || (cart.hasRxItems() && !cart.prescriptionDocumentId())"
              >
                {{ submitting() ? 'Submitting Order Request...' : 'Confirm Click-and-Collect Order' }}
              </button>

              @if (cart.hasRxItems() && !cart.prescriptionDocumentId()) {
                <p style="font-size: 0.75rem; color: var(--danger); text-align: center; margin-top: 8px;">
                  Upload doctor's prescription above to proceed with checkout.
                </p>
              }
            </div>
          }
        </div>
      </div>
    }

    <!-- ORDER CONFIRMATION MODAL -->
    @if (orderConfirmation()) {
      <div class="modal-backdrop">
        <div class="modal-content" style="text-align: center;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #dcfce7; color: #15803d; font-size: 1.8rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
            ✓
          </div>
          <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 6px;">Order Request Received!</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
            Your click-and-collect reservation has been placed. Our pharmacy dispensary staff will review and prepare your package.
          </p>

          <div style="background: #f1f5f9; padding: 16px; border-radius: var(--radius-sm); margin-bottom: 24px;">
            <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Order Reference</div>
            <div style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-mono); color: var(--primary); margin-top: 4px;">
              {{ orderConfirmation().orderReference }}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              Total: LKR {{ orderConfirmation().totalAmount | number:'1.2-2' }}
            </div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: center;">
            <button (click)="viewOrders()" class="btn btn-primary" style="border-radius: var(--radius-sm);">
              Track My Order
            </button>
            <button (click)="closeConfirmation()" class="btn btn-secondary" style="border-radius: var(--radius-sm);">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CartDrawerComponent implements OnInit {
  cart = inject(CartService);
  auth = inject(CustomerAuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  requestAuth = output<void>();

  branches = signal<any[]>([]);
  uploading = signal(false);
  submitting = signal(false);
  orderConfirmation = signal<any>(null);

  ngOnInit() {
    this.loadBranches();
  }

  loadBranches() {
    this.api.get<any[]>('/api/operations/branches').subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.branches.set(res.data);
          if (res.data.length > 0 && !this.cart.selectedBranchId()) {
            this.cart.setBranch(res.data[0].id, res.data[0].name);
          }
        }
      }
    });
  }

  onBranchChange(branchId: string) {
    const b = this.branches().find(x => x.id === branchId);
    if (b) {
      this.cart.setBranch(b.id, b.name);
    }
  }

  onPrescriptionFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!this.cart.selectedBranchId()) {
      alert('Please select a pickup branch before uploading prescription.');
      return;
    }

    this.uploading.set(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', 'Prescription');
    formData.append('branchId', this.cart.selectedBranchId());

    this.api.postFormData<any>('/api/documents/upload', formData).subscribe({
      next: (res) => {
        this.uploading.set(false);
        if (res.isSuccess && res.data?.documentId) {
          this.cart.setPrescription(res.data.documentId, file.name);
          alert('Prescription uploaded and verified successfully.');
        } else {
          alert('Upload failed: ' + res.message);
        }
      },
      error: (err) => {
        this.uploading.set(false);
        alert(err.error?.message || 'File upload failed. Ensure file is a valid PDF, JPEG, or PNG.');
      }
    });
  }

  submitCheckout() {
    if (!this.auth.isAuthenticated()) {
      this.requestAuth.emit();
      return;
    }

    this.submitting.set(true);
    const payload = {
      branchId: this.cart.selectedBranchId(),
      items: this.cart.items().map(i => ({
        productId: i.productId,
        quantity: i.quantity
      })),
      prescriptionDocumentId: this.cart.prescriptionDocumentId(),
      notes: this.cart.notes()
    };

    this.api.post<any>('/api/commerce/orders', payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.isSuccess && res.data) {
          this.orderConfirmation.set(res.data);
          this.cart.clear();
          this.cart.isOpen.set(false);
        } else {
          alert('Order submission failed: ' + res.message);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err.error?.message || 'Failed to submit order request.');
      }
    });
  }

  viewOrders() {
    this.orderConfirmation.set(null);
    this.router.navigate(['/orders']);
  }

  closeConfirmation() {
    this.orderConfirmation.set(null);
  }
}
