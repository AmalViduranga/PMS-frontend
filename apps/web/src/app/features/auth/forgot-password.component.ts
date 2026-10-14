import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at top right, #0f172a, #020617); padding: 20px;">
      <div style="width: 100%; max-width: 440px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, #14b8a6, #0d9488); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; box-shadow: 0 0 25px rgba(20, 184, 166, 0.4);">
            🔑
          </div>
          <h1 style="color: #ffffff; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px;">Reset Staff Password</h1>
          <p style="color: #94a3b8; font-size: 0.85rem;">Enter your registered staff email address to receive secure recovery instructions.</p>
        </div>

        <!-- Success Feedback -->
        @if (submittedSuccess()) {
          <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <div style="color: #34d399; font-weight: 700; font-size: 0.95rem; margin-bottom: 6px;">✉️ Check Your Inbox</div>
            <p style="color: #d1fae5; font-size: 0.83rem; line-height: 1.5; margin-bottom: 12px;">
              If an active staff account is associated with this email, password recovery instructions and a secure one-time link have been sent.
            </p>
            <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 10px; font-size: 0.78rem; color: #a7f3d0;">
              ℹ️ In local development, check your MailDev inbox at <a href="http://localhost:1080" target="_blank" style="color: #34d399; text-decoration: underline; font-weight: 700;">http://localhost:1080</a>.
            </div>
          </div>
        }

        <!-- Error Feedback -->
        @if (errorMessage()) {
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 12px; margin-bottom: 20px; color: #fca5a5; font-size: 0.85rem;">
            {{ errorMessage() }}
          </div>
        }

        <!-- Form -->
        @if (!submittedSuccess()) {
          <form (ngSubmit)="onSubmit()">
            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label" style="color: #cbd5e1;">Staff Email Address</label>
              <input 
                type="email" 
                name="email" 
                [(ngModel)]="email" 
                required 
                placeholder="staff@pharmaflow.local"
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
                <span>Sending Instructions...</span>
              } @else {
                <span>Send Password Reset Link</span>
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
export class ForgotPasswordComponent {
  private auth = inject(AuthService);

  email = '';
  loading = signal<boolean>(false);
  submittedSuccess = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.email || !this.email.includes('@')) {
      this.errorMessage.set('Please enter a valid staff email address.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.submittedSuccess.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        // Generic or rate limit response
        if (err.status === 429) {
          this.errorMessage.set(err.error?.message || 'Too many password reset attempts. Please wait 2 minutes.');
        } else {
          // If server returns error, display cleanly
          this.submittedSuccess.set(true);
        }
      }
    });
  }
}
