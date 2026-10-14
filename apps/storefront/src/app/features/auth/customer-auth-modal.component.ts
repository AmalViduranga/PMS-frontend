import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerAuthService } from '../../core/services/customer-auth.service';

@Component({
  selector: 'app-customer-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--text-main);">
              {{ isRegister() ? 'Create Customer Account' : 'Customer Sign In' }}
            </h2>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">
              {{ isRegister() ? 'Register for prescription ordering & branch pickups' : 'Sign in to access your pharmacy orders' }}
            </p>
          </div>
          <button (click)="close()" class="btn btn-secondary btn-sm" style="border-radius: 50%; width: 32px; height: 32px; padding: 0;">&times;</button>
        </div>

        <div style="display: flex; border-bottom: 1px solid var(--border); margin-bottom: 20px;">
          <button
            (click)="isRegister.set(false)"
            style="flex: 1; padding: 10px; background: none; border: none; font-weight: 700; font-size: 0.88rem; cursor: pointer; border-bottom: 2px solid transparent;"
            [style.border-bottom-color]="!isRegister() ? 'var(--primary)' : 'transparent'"
            [style.color]="!isRegister() ? 'var(--primary)' : 'var(--text-muted)'"
          >
            Sign In
          </button>
          <button
            (click)="isRegister.set(true)"
            style="flex: 1; padding: 10px; background: none; border: none; font-weight: 700; font-size: 0.88rem; cursor: pointer; border-bottom: 2px solid transparent;"
            [style.border-bottom-color]="isRegister() ? 'var(--primary)' : 'transparent'"
            [style.color]="isRegister() ? 'var(--primary)' : 'var(--text-muted)'"
          >
            Register
          </button>
        </div>

        @if (!isRegister()) {
          <!-- SIGN IN FORM -->
          <form (ngSubmit)="submitLogin()">
            <div style="margin-bottom: 14px;">
              <label class="form-label">Email Address *</label>
              <input type="email" class="form-control" [(ngModel)]="loginEmail" name="email" required placeholder="you@domain.com" />
            </div>

            <div style="margin-bottom: 18px;">
              <label class="form-label">Password *</label>
              <input type="password" class="form-control" [(ngModel)]="loginPassword" name="password" required />
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; border-radius: var(--radius-sm);" [disabled]="auth.isLoading()">
              {{ auth.isLoading() ? 'Signing in...' : 'Sign In with BFF Session' }}
            </button>
          </form>
        } @else {
          <!-- REGISTER FORM -->
          <form (ngSubmit)="submitRegister()">
            <div style="margin-bottom: 12px;">
              <label class="form-label">Full Name *</label>
              <input type="text" class="form-control" [(ngModel)]="registerData.fullName" name="fullName" required placeholder="John Doe" />
            </div>

            <div style="margin-bottom: 12px;">
              <label class="form-label">Email Address *</label>
              <input type="email" class="form-control" [(ngModel)]="registerData.email" name="email" required placeholder="you@domain.com" />
            </div>

            <div style="margin-bottom: 12px;">
              <label class="form-label">Phone Number *</label>
              <input type="tel" class="form-control" [(ngModel)]="registerData.phone" name="phone" required placeholder="0771234567" />
            </div>

            <div style="margin-bottom: 18px;">
              <label class="form-label">Password *</label>
              <input type="password" class="form-control" [(ngModel)]="registerData.password" name="password" required placeholder="Minimum 8 characters" />
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; border-radius: var(--radius-sm);" [disabled]="auth.isLoading()">
              {{ auth.isLoading() ? 'Creating account...' : 'Create Customer Account' }}
            </button>
          </form>
        }
      </div>
    </div>
  `
})
export class CustomerAuthModalComponent {
  auth = inject(CustomerAuthService);

  closeModal = output<void>();
  authSuccess = output<void>();

  isRegister = signal(false);

  loginEmail = '';
  loginPassword = '';

  registerData = {
    fullName: '',
    email: '',
    phone: '',
    password: ''
  };

  submitLogin() {
    this.auth.login({
      email: this.loginEmail,
      password: this.loginPassword
    }).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.authSuccess.emit();
          this.close();
        } else {
          alert('Login failed: ' + res.message);
        }
      },
      error: (err) => alert(err.error?.message || 'Login failed. Verify email and password.')
    });
  }

  submitRegister() {
    this.auth.register(this.registerData).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          alert('Registration successful! Logging you in...');
          this.auth.login({
            email: this.registerData.email,
            password: this.registerData.password
          }).subscribe({
            next: () => {
              this.authSuccess.emit();
              this.close();
            }
          });
        } else {
          alert('Registration failed: ' + res.message);
        }
      },
      error: (err) => alert(err.error?.message || 'Registration failed')
    });
  }

  close() {
    this.closeModal.emit();
  }
}
