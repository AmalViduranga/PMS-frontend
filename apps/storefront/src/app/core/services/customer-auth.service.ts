import { Injectable, inject, signal } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { Observable, tap, catchError, of } from 'rxjs';

export interface CustomerProfile {
  id?: string;
  identityUserId?: string;
  fullName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  preferredBranchId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerAuthService {
  private api = inject(ApiService);

  currentCustomer = signal<CustomerProfile | null>(null);
  isAuthenticated = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  register(data: { email: string; password: string; fullName: string; phone: string }): Observable<ApiResponse<any>> {
    this.isLoading.set(true);
    return this.api.post<any>('/api/auth/register-customer', data).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        throw err;
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<any>> {
    this.isLoading.set(true);
    return this.api.post<any>('/api/bff/login', credentials).pipe(
      tap(res => {
        this.isLoading.set(false);
        if (res.isSuccess) {
          this.isAuthenticated.set(true);
          this.loadProfile().subscribe();
        }
      }),
      catchError(err => {
        this.isLoading.set(false);
        throw err;
      })
    );
  }

  loadProfile(): Observable<ApiResponse<CustomerProfile> | null> {
    return this.api.get<CustomerProfile>('/api/commerce/profile').pipe(
      tap(res => {
        if (res.isSuccess && res.data) {
          this.currentCustomer.set(res.data);
          this.isAuthenticated.set(true);
        }
      }),
      catchError(() => {
        this.currentCustomer.set(null);
        this.isAuthenticated.set(false);
        return of(null);
      })
    );
  }

  updateProfile(profile: CustomerProfile): Observable<ApiResponse<CustomerProfile>> {
    return this.api.put<CustomerProfile>('/api/commerce/profile', profile).pipe(
      tap(res => {
        if (res.isSuccess && res.data) {
          this.currentCustomer.set(res.data);
        }
      })
    );
  }

  logout(): void {
    this.api.post<boolean>('/api/bff/logout', {}).subscribe({
      next: () => {
        this.currentCustomer.set(null);
        this.isAuthenticated.set(false);
      },
      error: () => {
        this.currentCustomer.set(null);
        this.isAuthenticated.set(false);
      }
    });
  }
}
