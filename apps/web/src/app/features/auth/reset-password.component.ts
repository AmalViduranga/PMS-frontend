import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at top right, #0f172a, #020617); padding: 20px;">
      <div style="width: 100%; max-width: 440px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, #14b8a6, #0d9488); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; box-shadow: 0 0 25px rgba(20, 184, 166, 0.4);">
            🔒
          </div>
          <h1 style="color: #ffffff; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px;">Set New Password</h1>
          <p style="color: #94a3b8; font-size: 0.85rem;">Create a strong, secure password for your staff account.</p>
        </div>

        <!-- Success Feedback -->
        @if (resetSuccess()) {
          <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center;">
            <div style="color: #34d399; font-weight: 700; font-size: 1rem; margin-bottom: 6px;">🎉 Password Successfully Updated!</div>
            <p style="color: #d1fae5; font-size: 0.85rem; margin-bottom: 16px;">
              Your staff credentials have been updated and existing sessions invalidated. You can now sign in with your new password.
            </p>
            <a routerLink="/login" class="btn btn-primary" style="display: inline-block; padding: 10px 24px; text-decoration: none; font-weight: 700;">
              Proceed to Sign In
            </a>
          </div>
        }

        <!-- Error Feedback -->
        @if (errorMessage()) {
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 12px; margin-bottom: 20px; color: #fca5a5; font-size: 0.85rem;">
            {{ errorMessage() }}
          </div>
        }

        <!-- Form -->
        @if (!resetSuccess()) {
          <form (ngSubmit)="onSubmit()">
            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label" style="color: #cbd5e1;">Staff Email Address</label>
              <input 
                type="email" 
                name="email" 
                [(ngModel)]="email" 
                required 
                class="form-control"
                style="background: rgba(30, 41, 59, 0.6); border-color: rgba(255, 255, 255, 0.12); color: #fff;"
              >
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label" style="color: #cbd5e1;">One-Time Security Token</label>
              <input 
                type="text" 
                name="token" 
                [(ngModel)]="token" 
                required 
                placeholder="Paste token from recovery email"
                class="form-control"
                style="background: rgba(30, 41, 59, 0.6); border-color: rgba(255, 255, 255, 0.12); color: #fff; font-family: monospace;"
              >
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label" style="color: #cbd5e1;">New Password</label>
              <input 
                type="password" 
                name="newPassword" 
                [(ngModel)]="newPassword" 
                required 
                placeholder="At least 8 chars, 1 uppercase, 1 digit"
                class="form-control"
                style="background: rgba(30, 41, 59, 0.6); border-color: rgba(255, 255, 255, 0.12); color: #fff;"
              >
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label" style="color: #cbd5e1;">Confirm New Password</label>
              <input 
                type="password" 
                name="confirmPassword" 
                [(ngModel)]="confirmPassword" 
                required 
                placeholder="Repeat new password"
                class="form-control"
                style="background: rgba(30, 41, 59, 0.6); border-color: rgba(255, 255, 255, 0.12); color: #fff;"
              >
            </div>

            <button 
              type="submit" 
              [disabled]="loading()" 
              class="btn btn-primary" 
              style="width: 100%; padding: 12px; font-size: 0.95rem; justify-content: center; background: linear-gradient(135deg, #0d9488, #0f766e);"
            >
              @if (loading()) {
                <span>Verifying and Updating...</span>
              } @else {
                <span>Update Password & Invalidate Sessions</span>
              }
            </button>
          </form>
        }

        <div style="margin-top: 24px; text-align: center;">
          <a routerLink="/login" style="color: #14b8a6; font-size: 0.85rem; text-decoration: none; font-weight: 600;">
            ← Return to Sign In
          </a>
        </div>

      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  email = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = signal<boolean>(false);
  resetSuccess = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['email']) this.email = params['email'];
      if (params['token']) this.token = params['token'];
    });
  }

  onSubmit(): void {
    if (!this.email || !this.token || !this.newPassword) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(this.newPassword) || !/[a-z]/.test(this.newPassword) || !/[0-9]/.test(this.newPassword)) {
      this.errorMessage.set('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.resetPassword({
      email: this.email.trim(),
      token: this.token.trim(),
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.resetSuccess.set(true);
        } else {
          this.errorMessage.set(res.message || 'Password reset failed.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid or expired password reset token.');
      }
    });
  }
}
