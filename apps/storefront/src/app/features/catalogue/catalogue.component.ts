import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- HERO BANNER -->
      <section style="background: linear-gradient(135deg, #0d9488 0%, #1e40af 100%); color: white; border-radius: 20px; padding: 48px 36px; margin-bottom: 36px; box-shadow: 0 10px 25px -5px rgba(13, 148, 136, 0.3);">
        <div style="max-width: 640px;">
          <span class="badge" style="background: rgba(255, 255, 255, 0.2); color: white; margin-bottom: 12px;">Verified Pharmacy Dispensary</span>
          <h1 style="font-size: 2.5rem; font-weight: 800; line-height: 1.15; margin-bottom: 14px; letter-spacing: -0.03em;">
            Order Medications & Reserve Branch Pickup
          </h1>
          <p style="font-size: 1.05rem; opacity: 0.9; margin-bottom: 24px; line-height: 1.6;">
            Access authentic healthcare pharmaceuticals and wellness products. Seamlessly upload doctor prescriptions and collect your order at your nearest branch.
          </p>

          <div style="position: relative; max-width: 480px;">
            <input
              type="text"
              class="form-control"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              placeholder="Search by brand name or generic formula (e.g. Paracetamol, Amoxicillin)..."
              style="padding-left: 40px; height: 48px; border-radius: 9999px; border: none; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
            />
            <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: #64748b;">🔍</span>
          </div>
        </div>
      </section>

      <!-- FILTER CONTROLS & STATUS -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">Filter:</span>
          <button (click)="filterRx.set('all')" class="btn btn-sm" [ngClass]="filterRx() === 'all' ? 'btn-primary' : 'btn-secondary'">All Products</button>
          <button (click)="filterRx.set('otc')" class="btn btn-sm" [ngClass]="filterRx() === 'otc' ? 'btn-primary' : 'btn-secondary'">OTC Only</button>
          <button (click)="filterRx.set('rx')" class="btn btn-sm" [ngClass]="filterRx() === 'rx' ? 'btn-primary' : 'btn-secondary'">Prescription Required</button>
        </div>

        <div style="font-size: 0.85rem; color: var(--text-muted);">
          Showing {{ filteredProducts().length }} available medications
        </div>
      </div>

      <!-- PRODUCT CARDS GRID -->
      <div class="product-grid">
        @for (product of filteredProducts(); track product.id) {
          <div class="product-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <span class="badge" [ngClass]="product.requiresPrescription ? 'badge-rx' : 'badge-otc'">
                  {{ product.requiresPrescription ? 'Rx Required' : 'OTC Approved' }}
                </span>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
                  {{ product.dosageForm || 'Tablet' }}
                </span>
              </div>

              <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; color: var(--text-main);">
                {{ product.brandName }}
              </h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; font-style: italic;">
                {{ product.genericName }}
              </p>

              @if (product.strength) {
                <div style="font-size: 0.8rem; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-bottom: 16px;">
                  Strength: {{ product.strength }}
                </div>
              }
            </div>

            <div style="border-top: 1px solid var(--border); padding-top: 14px; margin-top: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Retail Price</span>
                <span style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">
                  LKR {{ product.sellingPrice | number:'1.2-2' }}
                </span>
              </div>

              <button
                (click)="addToCart(product)"
                class="btn btn-primary"
                style="width: 100%; border-radius: var(--radius-sm);"
              >
                + Add to Pickup Cart
              </button>
            </div>
          </div>
        }
      </div>

      @if (filteredProducts().length === 0 && !loading()) {
        <div style="text-align: center; padding: 64px 24px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">💊</div>
          <h3 style="font-size: 1.2rem; font-weight: 700;">No medications found</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
            Try refining your search term or selecting "All Products"
          </p>
        </div>
      }
    </div>
  `
})
export class CatalogueComponent implements OnInit {
  private api = inject(ApiService);
  private cart = inject(CartService);

  products = signal<any[]>([]);
  filteredProducts = signal<any[]>([]);
  loading = signal(false);

  searchQuery = '';
  filterRx = signal<'all' | 'otc' | 'rx'>('all');

  ngOnInit() {
    this.loadCatalogue();
  }

  loadCatalogue() {
    this.loading.set(true);
    let url = '/api/commerce/catalogue?pageIndex=0&pageSize=100';
    if (this.searchQuery) {
      url += `&search=${encodeURIComponent(this.searchQuery)}`;
    }

    this.api.get<any>(url).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.isSuccess && res.data?.items) {
          this.products.set(res.data.items);
          this.applyFilters();
        }
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchChange() {
    this.loadCatalogue();
  }

  applyFilters() {
    let list = this.products();
    const filter = this.filterRx();
    if (filter === 'otc') {
      list = list.filter(p => !p.requiresPrescription);
    } else if (filter === 'rx') {
      list = list.filter(p => p.requiresPrescription);
    }
    this.filteredProducts.set(list);
  }

  addToCart(product: any) {
    this.cart.addItem(product);
  }
}
