import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  isSuccess?: boolean;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  private getXsrfToken(): string | null {
    const match = document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const xsrf = this.getXsrfToken();
    if (xsrf) {
      headers = headers.set('X-XSRF-TOKEN', xsrf);
    }
    return headers;
  }

  get<T>(url: string, params?: any): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null) {
          httpParams = httpParams.set(k, params[k].toString());
        }
      });
    }
    return this.http.get<ApiResponse<T>>(url, {
      headers: this.getHeaders(),
      params: httpParams,
      withCredentials: true
    });
  }

  post<T>(url: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(url, body, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  postFormData<T>(url: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(url, formData, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  put<T>(url: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(url, body, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  delete<T>(url: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(url, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }
}
