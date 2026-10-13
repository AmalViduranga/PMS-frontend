import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em;">Prescriptions Review Queue</h1>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">Licensed pharmacist clinical verification and dispensing limits authorization</p>
        </div>
        <button (click)="loadPending()" class="btn btn-secondary btn-sm">🔄 Refresh Queue</button>
      </div>

      <!-- Prescriptions Table -->
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Document ID</th>
              <th>File Name</th>
              <th>Uploaded Date</th>
              <th>File Size</th>
              <th>Scan Status</th>
              <th>Review Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (doc of pendingPrescriptions(); track doc.id) {
              <tr>
                <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--primary);">{{ doc.id.substring(0, 8) }}...</td>
                <td style="font-weight: 700;">{{ doc.originalFileName }}</td>
                <td>{{ doc.uploadedAtUtc | date:'medium' }}</td>
                <td>{{ (doc.fileSizeBytes / 1024) | number:'1.1-1' }} KB</td>
                <td>
                  <span class="badge" [ngClass]="doc.scanStatus === 'Clean' ? 'badge-success' : 'badge-danger'">
                    🛡️ {{ doc.scanStatus }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-warning">{{ doc.reviewStatus }}</span>
                </td>
                <td>
                  <div style="display: flex; gap: 8px;">
                    <a [href]="'/api/documents/' + doc.id + '/download'" target="_blank" class="btn btn-secondary btn-sm">
                      👁️ View File
                    </a>
                    <button (click)="openReviewModal(doc)" class="btn btn-primary btn-sm">
                      Verify & Dispense
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 48px;">
                  No pending prescriptions awaiting review. All prescriptions verified!
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal: Pharmacist Verification -->
      @if (selectedDoc()) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 620px;">
            <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 6px;">Clinical Prescription Verification</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
              Document: <strong>{{ selectedDoc()?.originalFileName }}</strong>
            </p>

            <form (ngSubmit)="submitReview()">
              <div class="form-group">
                <label class="form-label">Pharmacist Decision</label>
                <select [(ngModel)]="reviewDecision" name="decision" class="form-control">
                  <option value="Approved">Approved for Dispensing</option>
                  <option value="ClarificationRequested">Clarification Requested from Prescriber</option>
                  <option value="Rejected">Rejected (Illegible / Invalid)</option>
                </select>
              </div>

              <!-- Approved Medicines and Maximum Dispense Limits -->
              @if (reviewDecision === 'Approved') {
                <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 18px;">
                  <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 12px;">Authorized Medicine & Dispense Limits</h4>
                  
                  <div class="form-group">
                    <label class="form-label">Authorized Product</label>
                    <select [(ngModel)]="selectedProductId" name="productId" class="form-control">
                      @for (p of products(); track p.id) {
                        <option [ngValue]="p.id">{{ p.brandName }} ({{ p.strength }} {{ p.dosageForm }})</option>
                      }
                    </select>
                  </div>

                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Max Allowed Quantity to Dispense (Base Units)</label>
                    <input type="number" min="1" [(ngModel)]="maxAllowedQty" name="maxQty" class="form-control">
                  </div>
                </div>
              }

              <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Pharmacist Clinical Notes</label>
                <textarea [(ngModel)]="pharmacistNotes" name="notes" rows="3" placeholder="Notes on dosage, doctor verification..." class="form-control"></textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="selectedDoc.set(null)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Sign Off & Authorize</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class PrescriptionsComponent implements OnInit {
  private api = inject(ApiService);

  pendingPrescriptions = signal<any[]>([]);
  products = signal<any[]>([]);

  selectedDoc = signal<any>(null);
  reviewDecision = 'Approved';
  selectedProductId: string = '';
  maxAllowedQty: number = 30;
  pharmacistNotes = '';

  ngOnInit(): void {
    this.loadPending();
    this.loadProducts();
  }

  loadPending(): void {
    this.api.get<any[]>('/api/documents/prescriptions/pending').subscribe({
      next: (res) => {
        if (res.success) this.pendingPrescriptions.set(res.data);
      }
    });
  }

  loadProducts(): void {
    this.api.get<any>('/api/catalogue/products', { pageSize: 50 }).subscribe({
      next: (res) => {
        if (res.success && res.data.items.length > 0) {
          this.products.set(res.data.items);
          this.selectedProductId = res.data.items[0].id;
        }
      }
    });
  }

  openReviewModal(doc: any): void {
    this.selectedDoc.set(doc);
    this.reviewDecision = 'Approved';
    this.pharmacistNotes = 'Verified against clinical guidelines.';
  }

  submitReview(): void {
    const doc = this.selectedDoc();
    if (!doc) return;

    const prod = this.products().find(p => p.id === this.selectedProductId);

    const payload = {
      status: this.reviewDecision,
      notes: this.pharmacistNotes,
      approvedItems: this.reviewDecision === 'Approved' ? [
        {
          productId: this.selectedProductId,
          productName: prod?.brandName || 'Medicine',
          maxDispenseQuantity: this.maxAllowedQty
        }
      ] : []
    };

    this.api.post(`/api/documents/${doc.id}/review`, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedDoc.set(null);
          this.loadPending();
          alert(`Prescription marked as ${this.reviewDecision}!`);
        }
      }
    });
  }
}
