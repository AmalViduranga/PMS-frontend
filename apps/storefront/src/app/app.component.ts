import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerAuthService } from './core/services/customer-auth.service';
import { CartService } from './core/services/cart.service';
import { CartDrawerComponent } from './features/cart/cart-drawer.component';
import { CustomerAuthModalComponent } from './features/auth/customer-auth-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, CartDrawerComponent, CustomerAuthModalComponent],
  template: `
    <!-- STOREFRONT STICKY HEADER -->
    <header class="storefront-header">
      <div class="header-container">
        <!-- BRAND -->
        <a routerLink="/" class="brand-logo">
          <div class="brand-icon">PF</div>
          <div>
            <div>PharmaFlow</div>
            <div style="font-size: 0.68rem; font-weight: 500; color: var(--primary); letter-spacing: 0.05em; text-transform: uppercase;">
              Health & Dispensary
            </div>
          </div>
        </a>

        <!-- NAV LINKS -->
        <nav style="display: flex; gap: 20px; align-items: center;">
          <a routerLink="/catalogue" routerLinkActive="active" style="font-weight: 600; font-size: 0.9rem;">
            Medication Catalogue
          </a>
          <a routerLink="/orders" routerLinkActive="active" style="font-weight: 600; font-size: 0.9rem;">
            My Orders
          </a>
        </nav>

        <!-- HEADER ACTIONS -->
        <div class="header-actions">
          <!-- PICKUP BRANCH INDICATOR -->
          @if (cart.selectedBranchName()) {
            <span class="badge badge-info" style="font-size: 0.75rem;">
              📍 Pickup: {{ cart.selectedBranchName() }}
            </span>
          }

          <!-- CART BUTTON -->
          <button (click)="openCart()" class="btn btn-secondary" style="position: relative; border-radius: 9999px; padding: 8px 16px;">
            <span>🛒 Cart</span>
            @if (cart.itemCount() > 0) {
              <span style="background: var(--primary); color: white; border-radius: 9999px; font-size: 0.72rem; font-weight: 800; padding: 2px 7px; margin-left: 6px;">
                {{ cart.itemCount() }}
              </span>
            }
          </button>

          <!-- AUTH / PROFILE BUTTON -->
          @if (auth.isAuthenticated()) {
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.85rem; font-weight: 600;">{{ auth.currentCustomer()?.fullName || 'Customer' }}</span>
              <button (click)="auth.logout()" class="btn btn-secondary btn-sm" style="color: var(--danger);">
                Sign Out
              </button>
            </div>
          } @else {
            <button (click)="showAuthModal.set(true)" class="btn btn-primary btn-sm">
              Sign In / Register
            </button>
          }
        </div>
      </div>
    </header>

    <!-- MAIN PAGE CONTENT -->
    <main class="store-container">
      <router-outlet></router-outlet>
    </main>

    <!-- FOOTER -->
    <footer style="background: #0f172a; color: #94a3b8; padding: 48px 24px 32px 24px; border-top: 1px solid #1e293b; margin-top: 64px;">
      <div style="max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 32px; margin-bottom: 32px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; color: white; font-weight: 800; font-size: 1.15rem; margin-bottom: 12px;">
            <div style="width: 28px; height: 28px; border-radius: 6px; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem;">PF</div>
            PharmaFlow Pharmacy
          </div>
          <p style="font-size: 0.85rem; line-height: 1.6;">
            Enterprise-grade pharmacy dispensary network. Delivering authentic pharmaceuticals, doctor prescription reviews, and swift branch click-and-collect fulfillment.
          </p>
        </div>

        <div>
          <h4 style="color: white; font-size: 0.95rem; font-weight: 700; margin-bottom: 12px;">Clinical Safety Standards</h4>
          <p style="font-size: 0.82rem; line-height: 1.6;">
            All prescription-only medicines are strictly audited and verified by licensed pharmacists before collection. Maximum dispense quantities enforced by law.
          </p>
        </div>

        <div>
          <h4 style="color: white; font-size: 0.95rem; font-weight: 700; margin-bottom: 12px;">Security & Trust</h4>
          <p style="font-size: 0.82rem; line-height: 1.6;">
            Protected by HttpOnly session cookies, anti-CSRF token defense, and magic-byte inspected medical document storage.
          </p>
        </div>
      </div>

      <div style="max-width: 1280px; margin: 0 auto; border-top: 1px solid #1e293b; padding-top: 20px; text-align: center; font-size: 0.8rem;">
        &copy; 2026 PharmaFlow Pharmacy Systems. All rights reserved.
      </div>
    </footer>

    <!-- SLIDE-IN CART DRAWER -->
    <app-cart-drawer (requestAuth)="showAuthModal.set(true)"></app-cart-drawer>

    <!-- CUSTOMER AUTH MODAL -->
    @if (showAuthModal()) {
      <app-customer-auth-modal
        (closeModal)="showAuthModal.set(false)"
        (authSuccess)="showAuthModal.set(false)"
      ></app-customer-auth-modal>
    }
  `
})
export class AppComponent implements OnInit {
  auth = inject(CustomerAuthService);
  cart = inject(CartService);

  showAuthModal = signal(false);

  ngOnInit() {
    this.auth.loadProfile().subscribe();
  }

  openCart() {
    this.cart.isOpen.set(true);
  }
}
