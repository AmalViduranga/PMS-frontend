import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at top right, #0f172a, #020617); padding: 20px;">
      <div style="width: 100%; max-width: 440px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, #14b8a6, #0d9488); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 0 25px rgba(20, 184, 166, 0.4);">
            💊
          </div>
          <h1 style="color: #ffffff; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px;">PharmaFlow Portal</h1>
          <p style="color: #94a3b8; font-size: 0.88rem;">Staff Administration & Point of Sale System</p>
        </div>

        <!-- Bootstrap Notification Banner -->
        @if (!auth.isBootstrapped()) {
          <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 10px; padding: 14px; margin-bottom: 24px;">
            <div style="color: #fbbf24; font-weight: 700; font-size: 0.88rem; margin-bottom: 4px;">⚠️ Initial Setup Required</div>
            <p style="color: #fef3c7; font-size: 0.8rem; margin-bottom: 10px;">The system is freshly deployed and requires initial SuperAdmin bootstrap.</p>
            <a routerLink="/bootstrap" class="btn btn-sm" style="background: #f59e0b; color: #000; font-weight: 700;">Bootstrap First Admin</a>
          </div>
        }

        <!-- Error Message -->
        @if (errorMessage()) {
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 12px; margin-bottom: 20px; color: #fca5a5; font-size: 0.85rem;">
            {{ errorMessage() }}
          </div>
        }

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" style="color: #cbd5e1;">Staff Email Address</label>
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="form-label" style="color: #cbd5e1; margin-bottom: 0;">Password</label>
              <a routerLink="/forgot-password" style="font-size: 0.8rem; color: #14b8a6; text-decoration: none;">Forgot password?</a>
            </div>
            <input 
              type="password" 
              name="password" 
              [(ngModel)]="password" 
              required 
              placeholder="••••••••••••"
              class="form-control"
              style="background: rgba(30, 41, 59, 0.6); border-color: rgba(255, 255, 255, 0.12); color: #fff;"
            >
          </div>

          <button 
            type="submit" 
            [disabled]="auth.isLoading()" 
            class="btn btn-primary" 
            style="width: 100%; padding: 12px; font-size: 0.95rem; justify-content: center; background: linear-gradient(135deg, #0d9488, #0f766e);"
          >
            @if (auth.isLoading()) {
              <span>Authenticating...</span>
            } @else {
              <span>Sign In to Terminal</span>
            }
          </button>
        </form>

        <div style="margin-top: 24px; text-align: center; font-size: 0.78rem; color: #64748b;">
          Protected by BFF HttpOnly Session & Anti-CSRF Token
        </div>

      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.auth.checkBootstrapStatus().subscribe();
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter both email and password.');
      return;
    }

    this.errorMessage.set(null);
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set(res.message || 'Login failed.');
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Invalid credentials or connection error.');
      }
    });
  }
}
