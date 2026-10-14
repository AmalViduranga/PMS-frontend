import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PagedResult } from '../../core/services/api.service';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em;">Medicine & Product Catalogue</h1>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">Pharmaceutical master directory, barcodes, and pricing configurations</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button (click)="openCreateCategoryModal()" class="btn btn-secondary btn-sm">+ Category</button>
          <button (click)="openCreateProductModal()" class="btn btn-primary btn-sm">+ Add Medicine</button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="card" style="padding: 16px; margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 240px auto; gap: 14px; align-items: center;">
          <div style="position: relative;">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (keyup.enter)="loadProducts()" 
              placeholder="Search by brand name, generic name, SKU, or barcode..." 
              class="form-control"
              style="padding-left: 36px;"
            >
            <span style="position: absolute; left: 12px; top: 11px; color: var(--text-muted);">🔍</span>
          </div>

          <select [(ngModel)]="selectedCategoryId" (change)="loadProducts()" class="form-control">
            <option [ngValue]="null">All Categories</option>
            @for (cat of categories(); track cat.id) {
              <option [ngValue]="cat.id">{{ cat.name }}</option>
            }
          </select>

          <button (click)="loadProducts()" class="btn btn-primary btn-sm">Filter</button>
        </div>
      </div>

      <!-- Products Table -->
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Brand / Generic Name</th>
              <th>Strength & Form</th>
              <th>Category</th>
              <th>Base Unit</th>
              <th>Selling Price</th>
              <th>Storage</th>
              <th>Rx</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (prod of products(); track prod.id) {
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">{{ prod.sku }}</td>
                <td>
                  <div style="font-weight: 700;">{{ prod.brandName }}</div>
                  <div style="color: var(--text-muted); font-size: 0.78rem;">{{ prod.genericName }}</div>
                </td>
                <td>{{ prod.strength }} • {{ prod.dosageForm }}</td>
                <td>{{ prod.categoryName }}</td>
                <td>{{ prod.baseUnit }}</td>
                <td style="font-weight: 700; font-family: var(--font-mono);">
                  {{ prod.sellingPrice | currency:'LKR':'symbol':'1.2-2' }}
                </td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">{{ prod.storageCondition }}</td>
                <td>
                  @if (prod.isPrescriptionRequired) {
                    <span class="badge badge-warning">Rx Required</span>
                  } @else {
                    <span class="badge badge-info">OTC</span>
                  }
                </td>
                <td>
                  <span class="badge" [ngClass]="prod.isActive ? 'badge-success' : 'badge-danger'">
                    {{ prod.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <button (click)="openEditProductModal(prod)" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">
                    Edit
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 36px;">
                  No products found matching your search.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal: Create Medicine Product -->
      @if (showProductModal()) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 680px;">
            <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 6px;">
              {{ isEditing ? 'Edit Medicine Product' : 'Add New Medicine Product' }}
            </h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
              {{ isEditing ? 'Update pharmaceutical pricing, barcodes, and availability' : 'Complete pharmaceutical profile & price schedule' }}
            </p>

            <form (ngSubmit)="saveProduct()">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">SKU</label>
                  <input type="text" [(ngModel)]="newProduct.sku" name="sku" [readonly]="isEditing" required placeholder="e.g. PARA-500MG" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Brand Name</label>
                  <input type="text" [(ngModel)]="newProduct.brandName" name="brandName" required placeholder="e.g. Panadol" class="form-control">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Generic / Active Ingredient</label>
                  <input type="text" [(ngModel)]="newProduct.genericName" name="genericName" required placeholder="e.g. Paracetamol" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select [(ngModel)]="newProduct.categoryId" name="categoryId" required class="form-control">
                    @for (cat of categories(); track cat.id) {
                      <option [ngValue]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Strength</label>
                  <input type="text" [(ngModel)]="newProduct.strength" name="strength" required placeholder="500mg" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Dosage Form</label>
                  <input type="text" [(ngModel)]="newProduct.dosageForm" name="dosageForm" required placeholder="Tablet" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Base Unit</label>
                  <input type="text" [(ngModel)]="newProduct.baseUnit" name="baseUnit" required placeholder="Tablet" class="form-control">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Cost Price (LKR)</label>
                  <input type="number" step="0.01" [(ngModel)]="newProduct.costPrice" name="costPrice" required class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Selling Price (LKR)</label>
                  <input type="number" step="0.01" [(ngModel)]="newProduct.sellingPrice" name="sellingPrice" required class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Tax Rate (%)</label>
                  <input type="number" step="0.1" [(ngModel)]="newProduct.taxRatePercentage" name="taxRatePercentage" class="form-control">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Storage Condition</label>
                  <select [(ngModel)]="newProduct.storageCondition" name="storageCondition" class="form-control">
                    <option value="RoomTemperature">Room Temperature (15-25°C)</option>
                    <option value="Refrigerated2to8C">Refrigerated (2-8°C)</option>
                    <option value="Frozen">Frozen (&lt; 0°C)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Barcodes (Comma-separated for multiple barcodes)</label>
                  <input type="text" [(ngModel)]="barcodeInput" name="barcode" placeholder="e.g. 4792019283710, 4792019283711" class="form-control">
                </div>
              </div>

              <div style="display: flex; flex-wrap: wrap; gap: 24px; margin: 12px 0 24px;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.88rem; cursor: pointer;">
                  <input type="checkbox" [(ngModel)]="newProduct.isPrescriptionRequired" name="isPrescriptionRequired">
                  <span>Prescription Required (Rx)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.88rem; cursor: pointer;">
                  <input type="checkbox" [(ngModel)]="newProduct.isPublishedOnline" name="isPublishedOnline">
                  <span>Publish to Customer Storefront</span>
                </label>
                @if (isEditing) {
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 0.88rem; cursor: pointer;">
                    <input type="checkbox" [(ngModel)]="newProduct.isActive" name="isActive">
                    <span>Product Is Active</span>
                  </label>
                }
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="showProductModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal: Create Category -->
      @if (showCategoryModal()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Add Product Category</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">Organize pharmaceuticals by therapeutic class</p>

            <form (ngSubmit)="saveCategory()">
              <div class="form-group">
                <label class="form-label">Category Name</label>
                <input type="text" [(ngModel)]="newCategory.name" name="name" required placeholder="e.g. Analgesics & Antipyretics" class="form-control">
              </div>
              <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Description</label>
                <textarea [(ngModel)]="newCategory.description" name="description" rows="3" class="form-control" placeholder="Therapeutic classification notes..."></textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="showCategoryModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class CatalogueComponent implements OnInit {
  private api = inject(ApiService);

  products = signal<any[]>([]);
  categories = signal<any[]>([]);

  searchQuery = '';
  selectedCategoryId: string | null = null;

  showProductModal = signal<boolean>(false);
  showCategoryModal = signal<boolean>(false);

  barcodeInput = '';
  newProduct: any = {};
  newCategory = { name: '', description: '' };

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.api.get<any[]>('/api/catalogue/categories').subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.set(res.data);
          if (res.data.length > 0 && !this.newProduct.categoryId) {
            this.newProduct.categoryId = res.data[0].id;
          }
        }
      }
    });
  }

  loadProducts(): void {
    const params: any = { pageIndex: 0, pageSize: 50 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedCategoryId) params.categoryId = this.selectedCategoryId;

    this.api.get<PagedResult<any>>('/api/catalogue/products', params).subscribe({
      next: (res) => {
        if (res.success) this.products.set(res.data.items);
      }
    });
  }

  isEditing = false;
  editingProductId: string | null = null;

  openCreateProductModal(): void {
    this.isEditing = false;
    this.editingProductId = null;
    this.newProduct = {
      sku: '',
      brandName: '',
      genericName: '',
      strength: '',
      dosageForm: 'Tablet',
      categoryId: this.categories()[0]?.id || '',
      storageCondition: 'RoomTemperature',
      isPrescriptionRequired: false,
      isPublishedOnline: true,
      isOrderEligible: true,
      baseUnit: 'Tablet',
      sellingPrice: 15.0,
      costPrice: 8.5,
      taxRatePercentage: 0.0,
      reorderThreshold: 50,
      isActive: true
    };
    this.barcodeInput = '';
    this.showProductModal.set(true);
  }

  openEditProductModal(prod: any): void {
    this.isEditing = true;
    this.editingProductId = prod.id;
    this.newProduct = {
      brandName: prod.brandName,
      genericName: prod.genericName,
      strength: prod.strength,
      dosageForm: prod.dosageForm,
      categoryId: prod.categoryId,
      storageCondition: prod.storageCondition,
      isPrescriptionRequired: prod.isPrescriptionRequired,
      isPublishedOnline: prod.isPublishedOnline,
      isOrderEligible: prod.isOrderEligible,
      baseUnit: prod.baseUnit,
      sellingPrice: prod.sellingPrice,
      costPrice: prod.costPrice || 0,
      taxRatePercentage: prod.taxRatePercentage || 0,
      reorderThreshold: prod.reorderThreshold || 0,
      isActive: prod.isActive
    };
    this.barcodeInput = (prod.barcodes || []).join(', ');
    this.showProductModal.set(true);
  }

  saveProduct(): void {
    const barcodesList = this.barcodeInput
      ? this.barcodeInput.split(',').map(b => b.trim()).filter(b => b.length > 0)
      : [];

    const payload = {
      ...this.newProduct,
      barcodes: barcodesList
    };

    const request$ = this.isEditing
      ? this.api.put(`/api/catalogue/products/${this.editingProductId}`, payload)
      : this.api.post('/api/catalogue/products', payload);

    request$.subscribe({
      next: (res) => {
        if (res.success) {
          this.showProductModal.set(false);
          this.loadProducts();
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to save product. Please check for duplicate SKU or Barcode.');
      }
    });
  }

  openCreateCategoryModal(): void {
    this.newCategory = { name: '', description: '' };
    this.showCategoryModal.set(true);
  }

  saveCategory(): void {
    this.api.post('/api/catalogue/categories', this.newCategory).subscribe({
      next: (res) => {
        if (res.success) {
          this.showCategoryModal.set(false);
          this.loadCategories();
        }
      }
    });
  }
}
