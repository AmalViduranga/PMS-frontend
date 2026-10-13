import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em;">Pharmacy Branches & Registers</h1>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">Multi-branch organizational hierarchy and POS terminal assignments</p>
        </div>
        <button (click)="openCreateBranchModal()" class="btn btn-primary btn-sm">
          <span>+ Add Branch</span>
        </button>
      </div>

      <!-- Branches Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 32px;">
        @for (branch of branches(); track branch.id) {
          <div class="card" style="margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <span class="badge badge-info" style="font-family: var(--font-mono); margin-bottom: 6px;">{{ branch.code }}</span>
                <h3 style="font-size: 1.15rem; font-weight: 700;">{{ branch.name }}</h3>
              </div>
              <span class="badge" [ngClass]="branch.isActive ? 'badge-success' : 'badge-danger'">
                {{ branch.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
            
            <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px;">
              <div>📍 {{ branch.address }}</div>
              <div>📞 {{ branch.phone }}</div>
              <div>✉️ {{ branch.email }}</div>
              <div>🌐 {{ branch.timezone }} ({{ branch.currency }})</div>
            </div>

            <div style="border-top: 1px solid var(--border); padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
              <button (click)="viewRegisters(branch)" class="btn btn-secondary btn-sm">
                View Registers ({{ getRegisterCount(branch.id) }})
              </button>
              <button (click)="openCreateRegisterModal(branch)" class="btn btn-secondary btn-sm" style="color: var(--primary);">
                + Register
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Selected Branch Registers View -->
      @if (selectedBranch()) {
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <h2 class="card-title">Registers at {{ selectedBranch()?.name }}</h2>
              <p class="card-subtitle" style="margin-bottom: 0;">Configured physical cash counters and hardware terminals</p>
            </div>
            <button (click)="selectedBranch.set(null)" class="btn btn-secondary btn-sm">&times; Close</button>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Register Name</th>
                  <th>Hardware Terminal ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (reg of currentBranchRegisters(); track reg.id) {
                  <tr>
                    <td style="font-weight: 600; font-family: var(--font-mono);">{{ reg.code }}</td>
                    <td>{{ reg.name }}</td>
                    <td style="color: var(--text-muted);">{{ reg.hardwareIdentifier || 'N/A' }}</td>
                    <td>
                      <span class="badge badge-success">Online & Ready</span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">
                      No registers configured for this branch yet.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Modal: Create Branch -->
      @if (showBranchModal()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Register New Pharmacy Branch</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">Configure a distinct physical pharmacy branch</p>
            
            <form (ngSubmit)="saveBranch()">
              <div class="form-group">
                <label class="form-label">Branch Code</label>
                <input type="text" [(ngModel)]="newBranch.code" name="code" required placeholder="e.g. KANDY-01" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Branch Name</label>
                <input type="text" [(ngModel)]="newBranch.name" name="name" required placeholder="e.g. PharmaFlow Kandy City Branch" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Physical Address</label>
                <input type="text" [(ngModel)]="newBranch.address" name="address" required placeholder="123 Peradeniya Road, Kandy" class="form-control">
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Phone</label>
                  <input type="text" [(ngModel)]="newBranch.phone" name="phone" required placeholder="+94 81 222 3333" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input type="email" [(ngModel)]="newBranch.email" name="email" required placeholder="kandy@pharmaflow.local" class="form-control">
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                <div class="form-group">
                  <label class="form-label">Timezone</label>
                  <input type="text" [(ngModel)]="newBranch.timezone" name="timezone" class="form-control" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Currency</label>
                  <input type="text" [(ngModel)]="newBranch.currency" name="currency" class="form-control" readonly>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="showBranchModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal: Create Register -->
      @if (showRegisterModal()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Add POS Register</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
              Creating register at {{ targetBranchForRegister()?.name }}
            </p>

            <form (ngSubmit)="saveRegister()">
              <div class="form-group">
                <label class="form-label">Register Code</label>
                <input type="text" [(ngModel)]="newRegister.code" name="code" required placeholder="e.g. REG-02" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Register Name</label>
                <input type="text" [(ngModel)]="newRegister.name" name="name" required placeholder="Counter Register 2" class="form-control">
              </div>
              <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Hardware Terminal ID</label>
                <input type="text" [(ngModel)]="newRegister.hardwareIdentifier" name="hardwareIdentifier" placeholder="POS-TERMINAL-02" class="form-control">
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="showRegisterModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Register</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class BranchesComponent implements OnInit {
  private api = inject(ApiService);

  branches = signal<any[]>([]);
  allRegisters = signal<any[]>([]);
  selectedBranch = signal<any>(null);
  currentBranchRegisters = signal<any[]>([]);

  showBranchModal = signal<boolean>(false);
  showRegisterModal = signal<boolean>(false);
  targetBranchForRegister = signal<any>(null);

  newBranch = {
    code: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    timezone: 'Asia/Colombo',
    currency: 'LKR'
  };

  newRegister = {
    code: '',
    name: '',
    hardwareIdentifier: ''
  };

  ngOnInit(): void {
    this.loadBranches();
    this.loadRegisters();
  }

  loadBranches(): void {
    this.api.get<any[]>('/api/branches').subscribe({
      next: (res) => {
        if (res.success) this.branches.set(res.data);
      }
    });
  }

  loadRegisters(): void {
    this.api.get<any[]>('/api/branches/registers').subscribe({
      next: (res) => {
        if (res.success) this.allRegisters.set(res.data);
      }
    });
  }

  getRegisterCount(branchId: string): number {
    return this.allRegisters().filter(r => r.branchId === branchId).length;
  }

  viewRegisters(branch: any): void {
    this.selectedBranch.set(branch);
    this.currentBranchRegisters.set(this.allRegisters().filter(r => r.branchId === branch.id));
  }

  openCreateBranchModal(): void {
    this.newBranch = {
      code: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      timezone: 'Asia/Colombo',
      currency: 'LKR'
    };
    this.showBranchModal.set(true);
  }

  saveBranch(): void {
    this.api.post('/api/branches', this.newBranch).subscribe({
      next: (res) => {
        if (res.success) {
          this.showBranchModal.set(false);
          this.loadBranches();
        }
      }
    });
  }

  openCreateRegisterModal(branch: any): void {
    this.targetBranchForRegister.set(branch);
    this.newRegister = { code: '', name: '', hardwareIdentifier: '' };
    this.showRegisterModal.set(true);
  }

  saveRegister(): void {
    const branch = this.targetBranchForRegister();
    if (!branch) return;

    this.api.post('/api/branches/registers', {
      branchId: branch.id,
      code: this.newRegister.code,
      name: this.newRegister.name,
      hardwareIdentifier: this.newRegister.hardwareIdentifier
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showRegisterModal.set(false);
          this.loadRegisters();
          if (this.selectedBranch()?.id === branch.id) {
            this.viewRegisters(branch);
          }
        }
      }
    });
  }
}
