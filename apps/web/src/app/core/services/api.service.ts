import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  isSuccess?: boolean;
  data: T;
  message?: string;
  errors?: string[];
  timestampUtc?: string;
}

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  private getCsrfToken(): string | null {
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const csrf = this.getCsrfToken();
    if (csrf) {
      headers = headers.set('X-XSRF-TOKEN', csrf);
    }
    return headers;
  }

  get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<ApiResponse<T>>(endpoint, {
      params: httpParams,
      withCredentials: true,
      headers: this.buildHeaders()
    });
  }

  post<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(endpoint, body, {
      withCredentials: true,
      headers: this.buildHeaders()
    });
  }

  put<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(endpoint, body, {
      withCredentials: true,
      headers: this.buildHeaders()
    });
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(endpoint, {
      withCredentials: true,
      headers: this.buildHeaders()
    });
  }
}
