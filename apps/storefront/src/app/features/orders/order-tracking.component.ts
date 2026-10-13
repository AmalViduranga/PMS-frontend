import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CustomerAuthService } from '../../core/services/customer-auth.service';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 900px; margin: 0 auto;">
      <div style="margin-bottom: 28px;">
        <h1 style="font-size: 2rem; font-weight: 800; letter-spacing: -0.02em;">My Click-and-Collect Orders</h1>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 4px;">
          Track prescription verification, branch preparation, and collection readiness
        </p>
      </div>

      @if (!auth.isAuthenticated()) {
        <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 48px 24px; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🔒</div>
          <h3 style="font-size: 1.25rem; font-weight: 700;">Sign in to view your orders</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px;">
            Please sign in with your customer account to access your prescription orders.
          </p>
        </div>
      } @else {
        <div style="display: flex; flex-direction: column; gap: 18px;">
          @for (order of orders(); track order.id) {
            <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 22px; box-shadow: var(--shadow);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                <div>
                  <span class="badge badge-info" style="font-family: var(--font-mono); margin-bottom: 6px;">
                    {{ order.orderReference }}
                  </span>
                  <div style="font-size: 0.82rem; color: var(--text-muted);">
                    Placed on {{ order.submittedAtUtc | date:'medium' }}
                  </div>
                </div>

                <div style="text-align: right;">
                  <span class="badge" [ngClass]="{
                    'badge-warning': order.status === 'PendingStaffReview',
                    'badge-info': order.status === 'Verified' || order.status === 'Preparing',
                    'badge-success': order.status === 'ReadyForPickup' || order.status === 'Completed',
                    'badge-rx': order.status === 'Cancelled'
                  }" style="font-size: 0.8rem; padding: 4px 10px;">
                    {{ getStatusLabel(order.status) }}
                  </span>
                  <div style="font-size: 1.2rem; font-weight: 800; color: var(--primary); margin-top: 4px;">
                    LKR {{ order.totalAmount | number:'1.2-2' }}
                  </div>
                </div>
              </div>

              <!-- STATUS STEPPER PROGRESS -->
              <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; position: relative;">
                  <div style="text-align: center; flex: 1;">
                    <div style="font-size: 0.8rem; font-weight: 700;" [style.color]="isStepReached(order.status, 1) ? 'var(--primary)' : 'var(--text-muted)'">
                      1. Placed
                    </div>
                  </div>
                  <div style="text-align: center; flex: 1;">
                    <div style="font-size: 0.8rem; font-weight: 700;" [style.color]="isStepReached(order.status, 2) ? 'var(--primary)' : 'var(--text-muted)'">
                      2. Verified
                    </div>
                  </div>
                  <div style="text-align: center; flex: 1;">
                    <div style="font-size: 0.8rem; font-weight: 700;" [style.color]="isStepReached(order.status, 3) ? 'var(--primary)' : 'var(--text-muted)'">
                      3. Ready for Pickup
                    </div>
                  </div>
                  <div style="text-align: center; flex: 1;">
                    <div style="font-size: 0.8rem; font-weight: 700;" [style.color]="isStepReached(order.status, 4) ? 'var(--primary)' : 'var(--text-muted)'">
                      4. Collected
                    </div>
                  </div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 12px;">
                <div style="font-size: 0.85rem; color: var(--text-muted);">
                  Items: <strong style="color: var(--text-main);">{{ order.itemsCount }} products</strong>
                </div>

                <div style="display: flex; gap: 8px;">
                  @if (order.status === 'PendingStaffReview') {
                    <button (click)="cancelOrder(order.id)" class="btn btn-secondary btn-sm" style="color: var(--danger);">
                      Cancel Order
                    </button>
                  }
                  <button (click)="viewOrderDetails(order.id)" class="btn btn-secondary btn-sm">
                    {{ selectedOrderDetails()?.id === order.id ? 'Hide Details' : 'View Items' }}
                  </button>
                </div>
              </div>

              <!-- EXPANDED ORDER ITEMS -->
              @if (selectedOrderDetails()?.id === order.id) {
                <div style="margin-top: 16px; border-top: 1px dashed var(--border); padding-top: 14px;">
                  <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px;">Order Items Breakdown:</h4>
                  @for (item of selectedOrderDetails().items; track item.id) {
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 0;">
                      <span>{{ item.quantity }}x {{ item.productName }}</span>
                      <span style="font-family: var(--font-mono);">LKR {{ (item.quantity * item.unitPrice) | number:'1.2-2' }}</span>
                    </div>
                  }
                  @if (selectedOrderDetails().notes) {
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px;">
                      Pickup Note: <em>{{ selectedOrderDetails().notes }}</em>
                    </div>
                  }
                </div>
              }
            </div>
          }

          @if (orders().length === 0 && !loading()) {
            <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 48px 24px; text-align: center;">
              <div style="font-size: 2.5rem; margin-bottom: 12px;">📦</div>
              <h3 style="font-size: 1.25rem; font-weight: 700;">No orders placed yet</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px;">
                You haven't submitted any click-and-collect orders yet. Browse our catalogue to get started!
              </p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class OrderTrackingComponent implements OnInit {
  auth = inject(CustomerAuthService);
  private api = inject(ApiService);

  orders = signal<any[]>([]);
  loading = signal(false);
  selectedOrderDetails = signal<any | null>(null);

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.loadOrders();
    }
  }

  loadOrders() {
    this.loading.set(true);
    this.api.get<any[]>('/api/commerce/orders').subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.isSuccess && res.data) {
          this.orders.set(res.data);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  viewOrderDetails(orderId: string) {
    if (this.selectedOrderDetails()?.id === orderId) {
      this.selectedOrderDetails.set(null);
      return;
    }

    this.api.get<any>(`/api/commerce/orders/${orderId}`).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.selectedOrderDetails.set(res.data);
        }
      }
    });
  }

  cancelOrder(orderId: string) {
    const reason = prompt('Reason for cancelling order:') || 'Cancelled by customer';
    this.api.post<boolean>(`/api/commerce/orders/${orderId}/cancel`, reason).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          alert('Order cancelled.');
          this.loadOrders();
        } else {
          alert('Could not cancel order: ' + res.message);
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to cancel order')
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PendingStaffReview': return 'Pending Pharmacist Review';
      case 'Verified': return 'Prescription Verified';
      case 'Preparing': return 'Dispensing in Progress';
      case 'ReadyForPickup': return 'Ready for Branch Pickup';
      case 'Completed': return 'Collected';
      case 'Cancelled': return 'Cancelled';
      default: return status;
    }
  }

  isStepReached(status: string, step: number): boolean {
    const orderSteps: Record<string, number> = {
      'PendingStaffReview': 1,
      'Verified': 2,
      'Preparing': 2,
      'ReadyForPickup': 3,
      'Completed': 4
    };
    return (orderSteps[status] || 0) >= step;
  }
}
