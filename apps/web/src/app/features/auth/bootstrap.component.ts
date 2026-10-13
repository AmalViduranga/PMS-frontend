import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-bootstrap',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at top right, #0f172a, #020617); padding: 20px;">
      <div style="width: 100%; max-width: 520px; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 0 25px rgba(245, 158, 11, 0.4);">
            🛡️
          </div>
          <h1 style="color: #ffffff; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px;">Initial Admin Bootstrap</h1>
          <p style="color: #94a3b8; font-size: 0.88rem;">Initialize first SuperAdmin account with zero static default passwords.</p>
        </div>

        @if (errorMessage()) {
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 12px; margin-bottom: 20px; color: #fca5a5; font-size: 0.85rem;">
            {{ errorMessage() }}
          </div>
        }

        @if (successMessage()) {
          <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 10px; padding: 16px; margin-bottom: 20px; color: #a7f3d0; font-size: 0.9rem;">
            {{ successMessage() }}
            <div style="margin-top: 12px;">
              <a routerLink="/login" class="btn btn-primary btn-sm">Proceed to Sign In</a>
            </div>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label" style="color: #cbd5e1;">Master Bootstrap Token</label>
              <input 
                type="password" 
                name="token" 
                [(ngModel)]="bootstrapToken" 
                required 
                placeholder="Configured token or generated token"
                class="form-control"
                style="background: rgba(30, 41, 59, 0.6); border-color: rgba(255, 255, 255, 0.12); color: #fff;"
              >
              <small style="color: #64748b; font-size: 0.75rem; display: block; margin-top: 4px;">
                Enter the master token configured in appsettings.json or printed on startup.
              </small>
            </div>

            <div class="form-group">
              <label class="form-label" style="color: #cbd5e1;">SuperAdmin Full Name</label>
              <input 
                type="text" 
                name="fullName" 
                [(ngModel)]="fullName" 
                required 
                placeholder="Dr. Samantha Perera"
                class="form-control"
                style="background: rgba(30, 41, 59, 0.6); border-color: rgba(255, 255, 255, 0.12); color: #fff;"
              >
            </div>

            <div class="form-group">
              <label class="form-label" style="color: #cbd5e1;">SuperAdmin Email</label>
              <input 
                type="email" 
                name="email" 
                [(ngModel)]="email" 
                required 
                placeholder="admin@pharmaflow.local"
                class="form-control"
                style="background: rgba(30, 41, 59, 0.6); border-color: rgba(255, 255, 255, 0.12); color: #fff;"
              >
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label" style="color: #cbd5e1;">Strong Password</label>
              <input 
                type="password" 
                name="password" 
                [(ngModel)]="password" 
                required 
                placeholder="Min 12 chars (Upper, lower, digit, symbol)"
                class="form-control"
                style="background: rgba(30, 41, 59, 0.6); border-color: rgba(255, 255, 255, 0.12); color: #fff;"
              >
            </div>

            <button 
              type="submit" 
              [disabled]="isSubmitting()" 
              class="btn btn-primary" 
              style="width: 100%; padding: 12px; font-size: 0.95rem; justify-content: center; background: linear-gradient(135deg, #f59e0b, #d97706);"
            >
              @if (isSubmitting()) {
                <span>Bootstrapping System...</span>
              } @else {
                <span>Complete Admin Bootstrap</span>
              }
            </button>
          </form>
        }

        <div style="margin-top: 24px; text-align: center;">
          <a routerLink="/login" style="color: #94a3b8; font-size: 0.85rem; text-decoration: none;">&larr; Return to Sign In</a>
        </div>

      </div>
    </div>
  `
})
export class BootstrapComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  bootstrapToken = 'PharmaFlowBootstrapKey2026!';
  fullName = 'Lead Pharmacist & System Administrator';
  email = 'admin@pharmaflow.local';
  password = '';

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.bootstrapToken || !this.email || !this.password || !this.fullName) {
      this.errorMessage.set('All fields are required.');
      return;
    }

    if (this.password.length < 12) {
      this.errorMessage.set('Password must be at least 12 characters.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.auth.bootstrapAdmin({
      email: this.email,
      fullName: this.fullName,
      password: this.password,
      bootstrapToken: this.bootstrapToken
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.successMessage.set(res.message || 'SuperAdmin successfully created. System bootstrap is permanently closed.');
        } else {
          this.errorMessage.set(res.message || 'Bootstrap failed.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Bootstrap verification failed.');
      }
    });
  }
}
