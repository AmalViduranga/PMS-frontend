import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-workforce',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em;">Workforce & Shift Management</h1>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">Employee roster, cross-branch scheduling, attendance audit logs, and compliance leave ledger</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button (click)="activeTab.set('employees')" class="btn" [ngClass]="activeTab() === 'employees' ? 'btn-primary' : 'btn-secondary'">Employees</button>
          <button (click)="activeTab.set('attendance')" class="btn" [ngClass]="activeTab() === 'attendance' ? 'btn-primary' : 'btn-secondary'">Attendance & Clocks</button>
          <button (click)="activeTab.set('schedules')" class="btn" [ngClass]="activeTab() === 'schedules' ? 'btn-primary' : 'btn-secondary'">Roster Schedules</button>
          <button (click)="activeTab.set('leaves')" class="btn" [ngClass]="activeTab() === 'leaves' ? 'btn-primary' : 'btn-secondary'">Leave Approvals</button>
        </div>
      </div>

      <!-- TAB 1: EMPLOYEES -->
      @if (activeTab() === 'employees') {
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="display: flex; gap: 12px; align-items: center;">
              <input type="text" class="form-control" [(ngModel)]="searchQuery" (ngModelChange)="filterEmployees()" placeholder="Search employee by name or code..." style="width: 320px;" />
              <select class="form-control" [(ngModel)]="selectedBranchFilter" (ngModelChange)="loadEmployees()" style="width: 220px;">
                <option value="">All Branches</option>
                @for (b of branches(); track b.id) {
                  <option [value]="b.id">{{ b.name }}</option>
                }
              </select>
            </div>
            <button (click)="openCreateEmployeeModal()" class="btn btn-primary btn-sm">+ Add Employee</button>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Designation / Dept</th>
                  <th>Branch</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (emp of filteredEmployees(); track emp.id) {
                  <tr>
                    <td><span class="badge badge-info" style="font-family: var(--font-mono);">{{ emp.employeeCode }}</span></td>
                    <td style="font-weight: 600;">{{ emp.firstName }} {{ emp.lastName }}</td>
                    <td>
                      <div>{{ emp.designation }}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">{{ emp.department }}</div>
                    </td>
                    <td>{{ getBranchName(emp.primaryBranchId) }}</td>
                    <td>
                      <div style="font-size: 0.85rem;">{{ emp.contactNumber }}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">{{ emp.email }}</div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="emp.employmentStatus === 'Active' ? 'badge-success' : 'badge-danger'">
                        {{ emp.employmentStatus }}
                      </span>
                    </td>
                    <td>
                      <button (click)="selectEmployeeForLeave(emp)" class="btn btn-secondary btn-sm" style="margin-right: 6px;">Balances</button>
                      <button (click)="clockInEmployee(emp)" class="btn btn-secondary btn-sm" style="color: var(--primary);">Clock In</button>
                    </td>
                  </tr>
                }
                @if (filteredEmployees().length === 0) {
                  <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No employees matching criteria</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: ATTENDANCE & CLOCKS -->
      @if (activeTab() === 'attendance') {
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h2 class="card-title">Daily Attendance & Time Tracking</h2>
              <p class="card-subtitle" style="margin-bottom: 0;">Clock-in/out records with manager audit trail for corrections</p>
            </div>
            <div style="display: flex; gap: 12px;">
              <select class="form-control" [(ngModel)]="clockTargetEmployeeId" style="width: 240px;">
                <option value="">Select Employee to Clock</option>
                @for (emp of employees(); track emp.id) {
                  <option [value]="emp.id">{{ emp.firstName }} {{ emp.lastName }} ({{ emp.employeeCode }})</option>
                }
              </select>
              <button (click)="submitClockIn()" class="btn btn-primary btn-sm" [disabled]="!clockTargetEmployeeId">Clock In</button>
              <button (click)="submitClockOut()" class="btn btn-secondary btn-sm" [disabled]="!clockTargetEmployeeId">Clock Out</button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Status</th>
                  <th>Manager Audited</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (att of attendanceList(); track att.id) {
                  <tr>
                    <td style="font-weight: 600;">{{ getEmployeeName(att.employeeId) }}</td>
                    <td>{{ att.date | date:'mediumDate' }}</td>
                    <td>{{ att.clockInUtc | date:'shortTime' }}</td>
                    <td>{{ att.clockOutUtc ? (att.clockOutUtc | date:'shortTime') : '-- Active --' }}</td>
                    <td>
                      <span class="badge" [ngClass]="att.status === 'Present' ? 'badge-success' : 'badge-warning'">
                        {{ att.status }}
                      </span>
                    </td>
                    <td>
                      @if (att.managerCorrectionReason) {
                        <div style="color: var(--danger); font-size: 0.8rem; font-weight: 600;">Audited Correction</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">{{ att.managerCorrectionReason }}</div>
                      } @else {
                        <span style="color: var(--text-muted); font-size: 0.8rem;">Direct Scan</span>
                      }
                    </td>
                    <td>
                      <button (click)="openCorrectionModal(att)" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">
                        Manager Correct
                      </button>
                    </td>
                  </tr>
                }
                @if (attendanceList().length === 0) {
                  <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No attendance records registered today</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 3: SCHEDULES & ROSTER -->
      @if (activeTab() === 'schedules') {
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h2 class="card-title">Cross-Branch Shift Roster</h2>
              <p class="card-subtitle" style="margin-bottom: 0;">Multi-branch shift allocations with automatic cross-branch overlap prevention</p>
            </div>
            <div style="display: flex; gap: 12px;">
              <input type="date" class="form-control" [(ngModel)]="scheduleDateFilter" (ngModelChange)="loadSchedules()" style="width: 180px;" />
              <button (click)="openCreateScheduleModal()" class="btn btn-primary btn-sm">+ Schedule Shift</button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Branch Assigned</th>
                  <th>Shift Hours</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                @for (sch of schedules(); track sch.id) {
                  <tr>
                    <td>{{ sch.shiftDate | date:'mediumDate' }}</td>
                    <td style="font-weight: 600;">{{ sch.employee ? sch.employee.firstName + ' ' + sch.employee.lastName : getEmployeeName(sch.employeeId) }}</td>
                    <td><span class="badge badge-info">{{ getBranchName(sch.branchId) }}</span></td>
                    <td style="font-family: var(--font-mono); font-size: 0.85rem;">{{ sch.startTime }} - {{ sch.endTime }}</td>
                    <td style="color: var(--text-muted); font-size: 0.85rem;">{{ sch.notes || 'Standard shift' }}</td>
                  </tr>
                }
                @if (schedules().length === 0) {
                  <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">No shifts scheduled for this date</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 4: LEAVE REQUESTS & COMPLIANCE -->
      @if (activeTab() === 'leaves') {
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h2 class="card-title">Leave Ledger & Compliance Review</h2>
              <p class="card-subtitle" style="margin-bottom: 0;">Leave request verification with strict self-approval prevention rule</p>
            </div>
            <button (click)="openSubmitLeaveModal()" class="btn btn-primary btn-sm">+ Submit Leave Request</button>
          </div>

          @if (selectedEmployeeBalances()) {
            <div style="background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: var(--radius); padding: 16px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--primary);">
                  Leave Balance Ledger for {{ selectedEmployeeForBalancesName }} ({{ currentYear }})
                </h3>
                <button (click)="selectedEmployeeBalances.set(null)" class="btn btn-secondary btn-sm">&times; Close</button>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                @for (bal of selectedEmployeeBalances(); track bal.id) {
                  <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius); border: 1px solid var(--border);">
                    <div style="font-weight: 600; font-size: 0.9rem;">{{ bal.leaveType?.name || 'Leave' }}</div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary); margin: 6px 0;">
                      {{ bal.remainingDays }} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400;">days left</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between;">
                      <span>Alloc: {{ bal.totalAllocated }}</span>
                      <span>Used: {{ bal.usedDays }}</span>
                      <span>Pending: {{ bal.pendingDays }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Dates Requested</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (req of leaveRequests(); track req.id) {
                  <tr>
                    <td style="font-weight: 600;">{{ getEmployeeName(req.employeeId) }}</td>
                    <td>{{ req.startDate | date:'mediumDate' }} - {{ req.endDate | date:'mediumDate' }}</td>
                    <td><span class="badge badge-info">{{ req.totalDays }} days</span></td>
                    <td style="font-size: 0.85rem; max-width: 250px;">{{ req.reason }}</td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'badge-warning': req.status === 'Pending',
                        'badge-success': req.status === 'Approved',
                        'badge-danger': req.status === 'Rejected'
                      }">
                        {{ req.status }}
                      </span>
                    </td>
                    <td>
                      @if (req.status === 'Pending') {
                        <div style="display: flex; gap: 6px;">
                          <button (click)="reviewLeave(req, true)" class="btn btn-primary btn-sm" style="font-size: 0.75rem; background: var(--success); border-color: var(--success);">
                            Approve
                          </button>
                          <button (click)="reviewLeave(req, false)" class="btn btn-danger btn-sm" style="font-size: 0.75rem;">
                            Reject
                          </button>
                        </div>
                      } @else {
                        <span style="font-size: 0.75rem; color: var(--text-muted);">Reviewed</span>
                      }
                    </td>
                  </tr>
                }
                @if (leaveRequests().length === 0) {
                  <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No leave requests logged</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL: CREATE EMPLOYEE -->
      @if (showCreateEmployeeModal()) {
        <div class="modal-backdrop" (click)="showCreateEmployeeModal.set(false)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px;">Add New Employee</h2>
            <form (ngSubmit)="submitCreateEmployee()">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
                <div>
                  <label class="form-label">Employee Code *</label>
                  <input type="text" class="form-control" [(ngModel)]="newEmployee.employeeCode" name="employeeCode" required placeholder="EMP-001" />
                </div>
                <div>
                  <label class="form-label">Primary Branch *</label>
                  <select class="form-control" [(ngModel)]="newEmployee.primaryBranchId" name="primaryBranchId" required>
                    <option value="">Select Branch</option>
                    @for (b of branches(); track b.id) {
                      <option [value]="b.id">{{ b.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
                <div>
                  <label class="form-label">First Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="newEmployee.firstName" name="firstName" required />
                </div>
                <div>
                  <label class="form-label">Last Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="newEmployee.lastName" name="lastName" required />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
                <div>
                  <label class="form-label">Designation *</label>
                  <input type="text" class="form-control" [(ngModel)]="newEmployee.designation" name="designation" required placeholder="Pharmacist / Cashier / Manager" />
                </div>
                <div>
                  <label class="form-label">Department *</label>
                  <input type="text" class="form-control" [(ngModel)]="newEmployee.department" name="department" required placeholder="Pharmacy / Retail / Admin" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                  <label class="form-label">Contact Number *</label>
                  <input type="text" class="form-control" [(ngModel)]="newEmployee.contactNumber" name="contactNumber" required />
                </div>
                <div>
                  <label class="form-label">Email *</label>
                  <input type="email" class="form-control" [(ngModel)]="newEmployee.email" name="email" required />
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" (click)="showCreateEmployeeModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">Create Employee</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: SCHEDULE SHIFT (OVERLAP PROTECTED) -->
      @if (showCreateScheduleModal()) {
        <div class="modal-backdrop" (click)="showCreateScheduleModal.set(false)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">Schedule Employee Shift</h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">System prevents cross-branch double-booking across the enterprise roster.</p>
            <form (ngSubmit)="submitCreateSchedule()">
              <div style="margin-bottom: 14px;">
                <label class="form-label">Employee *</label>
                <select class="form-control" [(ngModel)]="newSchedule.employeeId" name="employeeId" required>
                  <option value="">Select Employee</option>
                  @for (emp of employees(); track emp.id) {
                    <option [value]="emp.id">{{ emp.firstName }} {{ emp.lastName }} ({{ emp.designation }})</option>
                  }
                </select>
              </div>

              <div style="margin-bottom: 14px;">
                <label class="form-label">Branch *</label>
                <select class="form-control" [(ngModel)]="newSchedule.branchId" name="branchId" required>
                  <option value="">Select Branch</option>
                  @for (b of branches(); track b.id) {
                    <option [value]="b.id">{{ b.name }}</option>
                  }
                </select>
              </div>

              <div style="margin-bottom: 14px;">
                <label class="form-label">Shift Date *</label>
                <input type="date" class="form-control" [(ngModel)]="newSchedule.shiftDate" name="shiftDate" required />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
                <div>
                  <label class="form-label">Start Time *</label>
                  <input type="time" class="form-control" [(ngModel)]="newSchedule.startTime" name="startTime" required />
                </div>
                <div>
                  <label class="form-label">End Time *</label>
                  <input type="time" class="form-control" [(ngModel)]="newSchedule.endTime" name="endTime" required />
                </div>
              </div>

              <div style="margin-bottom: 16px;">
                <label class="form-label">Notes</label>
                <input type="text" class="form-control" [(ngModel)]="newSchedule.notes" name="notes" placeholder="e.g. Lead morning dispensary" />
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" (click)="showCreateScheduleModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">Schedule Shift</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: ATTENDANCE CORRECTION (AUDIT LOGGED) -->
      @if (showCorrectionModal()) {
        <div class="modal-backdrop" (click)="showCorrectionModal.set(false)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">Manager Attendance Correction</h2>
            <p style="font-size: 0.85rem; color: var(--danger); margin-bottom: 16px;">Mandatory compliance audit trail: You must state the operational justification.</p>
            <form (ngSubmit)="submitCorrection()">
              <div style="margin-bottom: 14px;">
                <label class="form-label">Clock In Time (UTC) *</label>
                <input type="datetime-local" class="form-control" [(ngModel)]="correctionData.clockInUtc" name="clockInUtc" required />
              </div>
              <div style="margin-bottom: 14px;">
                <label class="form-label">Clock Out Time (UTC) *</label>
                <input type="datetime-local" class="form-control" [(ngModel)]="correctionData.clockOutUtc" name="clockOutUtc" required />
              </div>
              <div style="margin-bottom: 14px;">
                <label class="form-label">Status *</label>
                <select class="form-control" [(ngModel)]="correctionData.status" name="status" required>
                  <option value="Present">Present</option>
                  <option value="HalfDay">Half Day</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              <div style="margin-bottom: 16px;">
                <label class="form-label">Justification Reason *</label>
                <textarea class="form-control" [(ngModel)]="correctionData.reason" name="reason" required rows="3" placeholder="e.g. Employee card reader malfunctioning at Branch A"></textarea>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" (click)="showCorrectionModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting() || !correctionData.reason">Save & Log Audit</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: SUBMIT LEAVE REQUEST -->
      @if (showSubmitLeaveModal()) {
        <div class="modal-backdrop" (click)="showSubmitLeaveModal.set(false)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px;">Submit Leave Request</h2>
            <form (ngSubmit)="submitLeave()">
              <div style="margin-bottom: 14px;">
                <label class="form-label">Employee *</label>
                <select class="form-control" [(ngModel)]="newLeave.employeeId" name="employeeId" required>
                  <option value="">Select Employee</option>
                  @for (emp of employees(); track emp.id) {
                    <option [value]="emp.id">{{ emp.firstName }} {{ emp.lastName }} ({{ emp.employeeCode }})</option>
                  }
                </select>
              </div>

              <div style="margin-bottom: 14px;">
                <label class="form-label">Leave Type *</label>
                <select class="form-control" [(ngModel)]="newLeave.leaveTypeId" name="leaveTypeId" required>
                  <option value="">Select Leave Type</option>
                  @for (lt of leaveTypes(); track lt.id) {
                    <option [value]="lt.id">{{ lt.name }} ({{ lt.annualAllowanceDays }} days/yr)</option>
                  }
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
                <div>
                  <label class="form-label">Start Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="newLeave.startDate" name="startDate" required />
                </div>
                <div>
                  <label class="form-label">End Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="newLeave.endDate" name="endDate" required />
                </div>
              </div>

              <div style="margin-bottom: 16px;">
                <label class="form-label">Reason *</label>
                <textarea class="form-control" [(ngModel)]="newLeave.reason" name="reason" required rows="3" placeholder="Reason for leave request"></textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" (click)="showSubmitLeaveModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class WorkforceComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  activeTab = signal<'employees' | 'attendance' | 'schedules' | 'leaves'>('employees');

  employees = signal<any[]>([]);
  filteredEmployees = signal<any[]>([]);
  branches = signal<any[]>([]);
  attendanceList = signal<any[]>([]);
  schedules = signal<any[]>([]);
  leaveRequests = signal<any[]>([]);
  leaveTypes = signal<any[]>([]);
  selectedEmployeeBalances = signal<any[] | null>(null);

  searchQuery = '';
  selectedBranchFilter = '';
  scheduleDateFilter = new Date().toISOString().split('T')[0];
  clockTargetEmployeeId = '';
  selectedEmployeeForBalancesName = '';
  currentYear = new Date().getFullYear();

  showCreateEmployeeModal = signal(false);
  showCreateScheduleModal = signal(false);
  showCorrectionModal = signal(false);
  showSubmitLeaveModal = signal(false);
  submitting = signal(false);

  newEmployee = {
    employeeCode: '',
    firstName: '',
    lastName: '',
    designation: '',
    department: '',
    primaryBranchId: '',
    contactNumber: '',
    email: '',
    emergencyContact: ''
  };

  newSchedule = {
    employeeId: '',
    branchId: '',
    shiftDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
    notes: ''
  };

  selectedAttendanceForCorrection: any = null;
  correctionData = {
    clockInUtc: '',
    clockOutUtc: '',
    status: 'Present',
    reason: ''
  };

  newLeave = {
    employeeId: '',
    leaveTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  };

  ngOnInit() {
    this.loadBranches();
    this.loadEmployees();
    this.loadSchedules();
  }

  loadBranches() {
    this.api.get<any[]>('/api/branches').subscribe({
      next: (res) => {
        if ((res.success || res.isSuccess) && res.data) {
          this.branches.set(res.data);
        }
      }
    });
  }

  loadEmployees() {
    let url = '/api/workforce/employees';
    if (this.selectedBranchFilter) {
      url += `?branchId=${this.selectedBranchFilter}`;
    }
    this.api.get<any[]>(url).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.employees.set(res.data);
          this.filterEmployees();
        }
      }
    });
  }

  filterEmployees() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredEmployees.set(this.employees());
    } else {
      this.filteredEmployees.set(
        this.employees().filter(e =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q)
        )
      );
    }
  }

  loadSchedules() {
    let url = `/api/workforce/schedules?date=${this.scheduleDateFilter}`;
    this.api.get<any[]>(url).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.schedules.set(res.data);
        }
      }
    });
  }

  openCreateEmployeeModal() {
    this.newEmployee = {
      employeeCode: 'EMP-' + Math.floor(1000 + Math.random() * 9000),
      firstName: '',
      lastName: '',
      designation: 'Pharmacist',
      department: 'Pharmacy Dispensary',
      primaryBranchId: this.branches()[0]?.id || '',
      contactNumber: '',
      email: '',
      emergencyContact: ''
    };
    this.showCreateEmployeeModal.set(true);
  }

  submitCreateEmployee() {
    this.submitting.set(true);
    this.api.post<string>('/api/workforce/employees', this.newEmployee).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.isSuccess) {
          this.showCreateEmployeeModal.set(false);
          this.loadEmployees();
          alert('Employee created successfully with annual leave allowances.');
        } else {
          alert('Error: ' + res.message);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err.error?.message || 'Failed to create employee');
      }
    });
  }

  clockInEmployee(emp: any) {
    this.clockTargetEmployeeId = emp.id;
    this.submitClockIn();
  }

  submitClockIn() {
    if (!this.clockTargetEmployeeId) return;
    const branchId = this.branches()[0]?.id;
    if (!branchId) return;

    this.api.post<string>('/api/workforce/attendance/clock-in', {
      employeeId: this.clockTargetEmployeeId,
      branchId: branchId
    }).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          alert('Clock-in recorded successfully.');
          this.activeTab.set('attendance');
        } else {
          alert(res.message);
        }
      },
      error: (err) => alert(err.error?.message || 'Clock-in failed')
    });
  }

  submitClockOut() {
    if (!this.clockTargetEmployeeId) return;
    const branchId = this.branches()[0]?.id;
    if (!branchId) return;

    this.api.post<boolean>('/api/workforce/attendance/clock-out', {
      employeeId: this.clockTargetEmployeeId,
      branchId: branchId
    }).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          alert('Clock-out recorded successfully.');
        } else {
          alert(res.message);
        }
      },
      error: (err) => alert(err.error?.message || 'Clock-out failed')
    });
  }

  openCorrectionModal(att: any) {
    this.selectedAttendanceForCorrection = att;
    this.correctionData = {
      clockInUtc: att.clockInUtc ? new Date(att.clockInUtc).toISOString().slice(0, 16) : '',
      clockOutUtc: att.clockOutUtc ? new Date(att.clockOutUtc).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      status: att.status || 'Present',
      reason: ''
    };
    this.showCorrectionModal.set(true);
  }

  submitCorrection() {
    if (!this.selectedAttendanceForCorrection) return;
    this.submitting.set(true);
    this.api.post<boolean>(`/api/workforce/attendance/${this.selectedAttendanceForCorrection.id}/correct`, {
      clockInUtc: new Date(this.correctionData.clockInUtc).toISOString(),
      clockOutUtc: new Date(this.correctionData.clockOutUtc).toISOString(),
      status: this.correctionData.status,
      reason: this.correctionData.reason
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.isSuccess) {
          this.showCorrectionModal.set(false);
          alert('Attendance corrected and compliance audit entry stored.');
        } else {
          alert(res.message);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err.error?.message || 'Failed to correct attendance');
      }
    });
  }

  openCreateScheduleModal() {
    this.newSchedule = {
      employeeId: this.employees()[0]?.id || '',
      branchId: this.branches()[0]?.id || '',
      shiftDate: this.scheduleDateFilter,
      startTime: '08:00',
      endTime: '16:00',
      notes: ''
    };
    this.showCreateScheduleModal.set(true);
  }

  submitCreateSchedule() {
    this.submitting.set(true);
    this.api.post<string>('/api/workforce/schedules', {
      employeeId: this.newSchedule.employeeId,
      branchId: this.newSchedule.branchId,
      shiftDate: new Date(this.newSchedule.shiftDate).toISOString(),
      startTime: this.newSchedule.startTime + ':00',
      endTime: this.newSchedule.endTime + ':00',
      notes: this.newSchedule.notes
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.isSuccess) {
          this.showCreateScheduleModal.set(false);
          this.loadSchedules();
          alert('Shift scheduled successfully.');
        } else {
          alert('Scheduling rejected: ' + res.message);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err.error?.message || 'Cannot schedule shift: Cross-branch overlap conflict');
      }
    });
  }

  selectEmployeeForLeave(emp: any) {
    this.selectedEmployeeForBalancesName = emp.firstName + ' ' + emp.lastName;
    this.api.get<any[]>(`/api/workforce/leaves/balances?employeeId=${emp.id}`).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.selectedEmployeeBalances.set(res.data);
          this.activeTab.set('leaves');
        }
      }
    });
  }

  openSubmitLeaveModal() {
    this.newLeave = {
      employeeId: this.employees()[0]?.id || '',
      leaveTypeId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: ''
    };
    this.showSubmitLeaveModal.set(true);
  }

  submitLeave() {
    this.submitting.set(true);
    this.api.post<string>('/api/workforce/leaves/request', {
      employeeId: this.newLeave.employeeId,
      leaveTypeId: this.newLeave.leaveTypeId,
      startDate: new Date(this.newLeave.startDate).toISOString(),
      endDate: new Date(this.newLeave.endDate).toISOString(),
      reason: this.newLeave.reason
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.isSuccess) {
          this.showSubmitLeaveModal.set(false);
          alert('Leave request submitted into approval workflow.');
        } else {
          alert('Error: ' + res.message);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err.error?.message || 'Failed to submit leave request');
      }
    });
  }

  reviewLeave(req: any, approved: boolean) {
    const reason = approved ? null : prompt('Enter rejection reason:');
    if (!approved && !reason) return;

    this.api.post<boolean>(`/api/workforce/leaves/${req.id}/review`, {
      approved: approved,
      rejectionReason: reason
    }).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          alert(`Leave request ${approved ? 'approved' : 'rejected'}.`);
        } else {
          alert(res.message);
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Action rejected by compliance: Self-approval prohibited');
      }
    });
  }

  getBranchName(branchId: string): string {
    const b = this.branches().find(x => x.id === branchId);
    return b ? b.name : 'Unknown Branch';
  }

  getEmployeeName(employeeId: string): string {
    const e = this.employees().find(x => x.id === employeeId);
    return e ? `${e.firstName} ${e.lastName}` : 'Employee';
  }
}
