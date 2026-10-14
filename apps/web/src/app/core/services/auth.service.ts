import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, ApiResponse } from './api.service';
import { Observable, tap, catchError, of, map } from 'rxjs';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  actorType: string;
  roles: string[];
  permissions: string[];
  primaryBranchId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  currentUser = signal<UserDto | null>(null);
  isBootstrapped = signal<boolean>(true);
  isLoading = signal<boolean>(false);

  checkBootstrapStatus(): Observable<boolean> {
    return this.api.get<{ isBootstrapped: boolean }>('/api/auth/bootstrap-status').pipe(
      map(res => {
        this.isBootstrapped.set(res.data.isBootstrapped);
        return res.data.isBootstrapped;
      }),
      catchError(() => of(true))
    );
  }

  bootstrapAdmin(payload: { email: string; password: string; fullName: string; bootstrapToken: string }): Observable<ApiResponse<any>> {
    return this.api.post<any>('/api/auth/bootstrap-admin', payload).pipe(
      tap(() => this.isBootstrapped.set(true))
    );
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<any>> {
    this.isLoading.set(true);
    return this.api.post<any>('/api/bff/login', credentials).pipe(
      tap(res => {
        this.isLoading.set(false);
        if (res.success && res.data?.user) {
          this.currentUser.set(res.data.user);
        }
      }),
      catchError(err => {
        this.isLoading.set(false);
        throw err;
      })
    );
  }

  loadCurrentUser(): Observable<UserDto | null> {
    return this.api.get<UserDto>('/api/bff/user').pipe(
      map(res => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
          return res.data;
        }
        this.currentUser.set(null);
        return null;
      }),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      })
    );
  }

  logout(): void {
    this.api.post<boolean>('/api/bff/logout', {}).subscribe({
      next: () => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      }
    });
  }

  forgotPassword(email: string): Observable<ApiResponse<boolean>> {
    return this.api.post<boolean>('/api/auth/forgot-password', { email });
  }

  resetPassword(payload: { email: string; token: string; newPassword: string }): Observable<ApiResponse<boolean>> {
    return this.api.post<boolean>('/api/auth/reset-password', payload);
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.roles?.includes('SuperAdmin')) return true;
    return user.permissions?.includes(permission) ?? false;
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.roles?.includes(role) ?? false;
  }
}
