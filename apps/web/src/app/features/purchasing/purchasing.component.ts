import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-purchasing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em;">Suppliers & Purchasing</h1>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">Procurement orders, supplier ledgers, and goods receipt tracking</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button (click)="openCreateSupplierModal()" class="btn btn-secondary btn-sm">+ Supplier</button>
          <button (click)="openCreatePoModal()" class="btn btn-primary btn-sm">+ Purchase Order</button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border); margin-bottom: 20px;">
        <button 
          (click)="activeTab = 'po'; loadOrders()" 
          class="btn btn-sm"
          [style.background]="activeTab === 'po' ? 'var(--primary)' : 'transparent'"
          [style.color]="activeTab === 'po' ? '#fff' : 'var(--text-main)'"
          style="border-radius: 6px 6px 0 0;"
        >
          Purchase Orders
        </button>
        <button 
          (click)="activeTab = 'suppliers'; loadSuppliers()" 
          class="btn btn-sm"
          [style.background]="activeTab === 'suppliers' ? 'var(--primary)' : 'transparent'"
          [style.color]="activeTab === 'suppliers' ? '#fff' : 'var(--text-main)'"
          style="border-radius: 6px 6px 0 0;"
        >
          Suppliers Directory
        </button>
      </div>

      <!-- Purchase Orders View -->
      @if (activeTab === 'po') {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Branch</th>
                <th>Created Date</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (po of purchaseOrders(); track po.id) {
                <tr>
                  <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">{{ po.poNumber }}</td>
                  <td style="font-weight: 700;">{{ po.supplierName }}</td>
                  <td>{{ po.branchName }}</td>
                  <td>{{ po.createdAtUtc | date:'mediumDate' }}</td>
                  <td style="font-family: var(--font-mono); font-weight: 700;">{{ po.totalCost | currency:'LKR':'symbol':'1.2-2' }}</td>
                  <td>
                    <span class="badge" [ngClass]="getPoBadgeClass(po.status)">
                      {{ po.status }}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 8px;">
                      @if (po.status === 'Draft' || po.status === 'Submitted') {
                        <button (click)="approvePo(po.id)" class="btn btn-primary btn-sm">Approve</button>
                      }
                      @if (po.status === 'Approved' || po.status === 'PartiallyReceived') {
                        <button (click)="openReceiveModal(po)" class="btn btn-secondary btn-sm" style="color: var(--primary);">
                          Receive GRN
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 36px;">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Suppliers Directory View -->
      @if (activeTab === 'suppliers') {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Company Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Payment Terms</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (sup of suppliers(); track sup.id) {
                <tr>
                  <td style="font-family: var(--font-mono); font-weight: 700;">{{ sup.code }}</td>
                  <td style="font-weight: 700;">{{ sup.name }}</td>
                  <td>{{ sup.contactPerson }}</td>
                  <td>{{ sup.phone }}</td>
                  <td>{{ sup.email }}</td>
                  <td>{{ sup.paymentTermsDays }} Days</td>
                  <td><span class="badge badge-success">Active</span></td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 36px;">
                    No suppliers added yet.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal: Create Supplier -->
      @if (showSupplierModal()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Register Pharmaceutical Supplier</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">Vendor master profile & payment terms</p>

            <form (ngSubmit)="saveSupplier()">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Supplier Code</label>
                  <input type="text" [(ngModel)]="newSupplier.code" name="code" required placeholder="e.g. SUP-GLAXO" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Company Name</label>
                  <input type="text" [(ngModel)]="newSupplier.name" name="name" required placeholder="GlaxoSmithKline Lanka" class="form-control">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Contact Person</label>
                  <input type="text" [(ngModel)]="newSupplier.contactPerson" name="contactPerson" required placeholder="Kamal Silva" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Phone</label>
                  <input type="text" [(ngModel)]="newSupplier.phone" name="phone" required placeholder="+94 11 456 7890" class="form-control">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" [(ngModel)]="newSupplier.email" name="email" required placeholder="orders@gsk.local" class="form-control">
              </div>

              <div class="form-group">
                <label class="form-label">Office Address</label>
                <input type="text" [(ngModel)]="newSupplier.address" name="address" required placeholder="12 Lotus Road, Colombo" class="form-control">
              </div>

              <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Payment Terms (Days)</label>
                <input type="number" [(ngModel)]="newSupplier.paymentTermsDays" name="terms" class="form-control">
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="showSupplierModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal: Create PO -->
      @if (showPoModal()) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 620px;">
            <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 6px;">Create Purchase Order</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">Order pharmaceuticals from authorized supplier</p>

            <form (ngSubmit)="savePo()">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Supplier</label>
                  <select [(ngModel)]="newPo.supplierId" name="supplierId" required class="form-control">
                    @for (sup of suppliers(); track sup.id) {
                      <option [ngValue]="sup.id">{{ sup.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Destination Branch</label>
                  <select [(ngModel)]="newPo.branchId" name="branchId" required class="form-control">
                    @for (br of branches(); track br.id) {
                      <option [ngValue]="br.id">{{ br.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Item Line Selection -->
              <div class="form-group">
                <label class="form-label">Product to Order</label>
                <select [(ngModel)]="poItem.productId" name="poProductId" class="form-control">
                  @for (prod of availableProducts(); track prod.id) {
                    <option [ngValue]="prod.id">{{ prod.brandName }} ({{ prod.sku }}) - Cost: {{ prod.costPrice }}</option>
                  }
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                <div class="form-group">
                  <label class="form-label">Quantity</label>
                  <input type="number" min="1" [(ngModel)]="poItem.orderedQuantity" name="qty" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Agreed Unit Cost (LKR)</label>
                  <input type="number" step="0.01" [(ngModel)]="poItem.unitCost" name="unitCost" class="form-control">
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="showPoModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Create PO Draft</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal: Receive Goods (GRN) -->
      @if (showReceiveModal()) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 640px;">
            <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 6px;">Goods Receipt (GRN)</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
              Receiving against PO: <strong>{{ targetPoForGrn()?.poNumber }}</strong>
            </p>

            <form (ngSubmit)="saveGrn()">
              <div class="form-group">
                <label class="form-label">Supplier Invoice #</label>
                <input type="text" [(ngModel)]="grnForm.supplierInvoiceNumber" name="inv" required placeholder="e.g. INV-GSK-9921" class="form-control">
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Batch Number</label>
                  <input type="text" [(ngModel)]="grnForm.batchNumber" name="batch" required placeholder="e.g. BATCH-2026-X1" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Expiry Date</label>
                  <input type="date" [(ngModel)]="grnForm.expiryDate" name="exp" required class="form-control">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                <div class="form-group">
                  <label class="form-label">Received Quantity (Units)</label>
                  <input type="number" min="1" [(ngModel)]="grnForm.receivedQuantity" name="rqty" required class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Bonus Quantity (Free Units)</label>
                  <input type="number" min="0" [(ngModel)]="grnForm.bonusQuantity" name="bqty" class="form-control">
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="showReceiveModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Process GRN & Add to Batches</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class PurchasingComponent implements OnInit {
  private api = inject(ApiService);

  activeTab: 'po' | 'suppliers' = 'po';
  purchaseOrders = signal<any[]>([]);
  suppliers = signal<any[]>([]);
  branches = signal<any[]>([]);
  availableProducts = signal<any[]>([]);

  showSupplierModal = signal<boolean>(false);
  showPoModal = signal<boolean>(false);
  showReceiveModal = signal<boolean>(false);

  newSupplier = {
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTermsDays: 30
  };

  newPo: any = {};
  poItem: any = {};

  targetPoForGrn = signal<any>(null);
  grnForm: any = {};

  ngOnInit(): void {
    this.loadOrders();
    this.loadSuppliers();
    this.loadBranches();
    this.loadProducts();
  }

  loadOrders(): void {
    this.api.get<any[]>('/api/purchasing/purchase-orders').subscribe({
      next: (res) => {
        if (res.success) this.purchaseOrders.set(res.data);
      }
    });
  }

  loadSuppliers(): void {
    this.api.get<any[]>('/api/purchasing/suppliers').subscribe({
      next: (res) => {
        if (res.success) this.suppliers.set(res.data);
      }
    });
  }

  loadBranches(): void {
    this.api.get<any[]>('/api/branches').subscribe({
      next: (res) => {
        if (res.success) this.branches.set(res.data);
      }
    });
  }

  loadProducts(): void {
    this.api.get<any>('/api/catalogue/products', { pageSize: 50 }).subscribe({
      next: (res) => {
        if (res.success) this.availableProducts.set(res.data.items);
      }
    });
  }

  getPoBadgeClass(status: string): string {
    switch (status) {
      case 'Draft': return 'badge-info';
      case 'Approved': return 'badge-warning';
      case 'PartiallyReceived': return 'badge-warning';
      case 'Received': return 'badge-success';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-info';
    }
  }

  openCreateSupplierModal(): void {
    this.newSupplier = {
      code: '',
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      paymentTermsDays: 30
    };
    this.showSupplierModal.set(true);
  }

  saveSupplier(): void {
    this.api.post('/api/purchasing/suppliers', this.newSupplier).subscribe({
      next: (res) => {
        if (res.success) {
          this.showSupplierModal.set(false);
          this.loadSuppliers();
        }
      }
    });
  }

  openCreatePoModal(): void {
    this.newPo = {
      supplierId: this.suppliers()[0]?.id || '',
      branchId: this.branches()[0]?.id || ''
    };
    this.poItem = {
      productId: this.availableProducts()[0]?.id || '',
      orderedQuantity: 100,
      unitCost: 8.5,
      taxRate: 0.0
    };
    this.showPoModal.set(true);
  }

  savePo(): void {
    const payload = {
      supplierId: this.newPo.supplierId,
      branchId: this.newPo.branchId,
      items: [this.poItem]
    };

    this.api.post('/api/purchasing/purchase-orders', payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.showPoModal.set(false);
          this.loadOrders();
        }
      }
    });
  }

  approvePo(poId: string): void {
    this.api.post(`/api/purchasing/purchase-orders/${poId}/approve`, {}).subscribe({
      next: (res) => {
        if (res.success) this.loadOrders();
      }
    });
  }

  openReceiveModal(po: any): void {
    this.targetPoForGrn.set(po);
    const item = po.items[0];
    this.grnForm = {
      supplierInvoiceNumber: '',
      purchaseOrderItemId: item?.id || '',
      productId: item?.productId || '',
      batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      receivedQuantity: item ? (item.orderedQuantity - item.receivedQuantity) : 100,
      bonusQuantity: 0,
      multiplierToBaseUnit: 1,
      unitAcquisitionCost: item?.unitCost || 8.5
    };
    this.showReceiveModal.set(true);
  }

  saveGrn(): void {
    const po = this.targetPoForGrn();
    if (!po) return;

    const payload = {
      supplierInvoiceNumber: this.grnForm.supplierInvoiceNumber,
      items: [
        {
          purchaseOrderItemId: this.grnForm.purchaseOrderItemId,
          productId: this.grnForm.productId,
          batchNumber: this.grnForm.batchNumber,
          expiryDate: new Date(this.grnForm.expiryDate).toISOString(),
          receivedQuantity: this.grnForm.receivedQuantity,
          bonusQuantity: this.grnForm.bonusQuantity,
          multiplierToBaseUnit: 1,
          unitAcquisitionCost: this.grnForm.unitAcquisitionCost
        }
      ]
    };

    this.api.post(`/api/purchasing/purchase-orders/${po.id}/receive`, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.showReceiveModal.set(false);
          this.loadOrders();
          alert('Goods received and batch added to inventory!');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Goods receipt failed.');
      }
    });
  }
}
