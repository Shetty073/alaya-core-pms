import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService, Staff } from '../../../core/services/mock-db.service';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="staff-page">
      <div class="page-header justify-between mb-3 d-flex align-items-center">
        <div>
          <h2>Staff Management</h2>
          <p>Add employees, assign operations roles, and manage module access rules.</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">+ Add Staff Member</button>
      </div>

      <!-- Staff Grid -->
      <div class="grid grid-3">
        <div class="card staff-card" *ngFor="let staff of staffList()">
          <div class="card-body">
            <div class="profile-header">
              <div class="profile-avatar">{{ getInitials(staff.name) }}</div>
              <div class="profile-meta">
                <h3>{{ staff.name }}</h3>
                <span class="badge" [ngClass]="{
                  'badge-success': staff.role === 'admin',
                  'badge-info': staff.role === 'receptionist',
                  'badge-warning': staff.role === 'chef',
                  'badge-danger': staff.role === 'housekeeper',
                  'badge-secondary': staff.role === 'guest'
                }">{{ staff.role | uppercase }}</span>
              </div>
            </div>

            <div class="profile-details mt-3">
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ staff.email }}</span>
              </div>
              <div class="detail-row" *ngIf="staff.role !== 'guest'">
                <span class="detail-label">Access modules:</span>
                <div class="modules-tags mt-2">
                  <span *ngFor="let mod of staff.accessModules" class="module-tag">
                    {{ mod | titlecase }}
                  </span>
                  <span *ngIf="staff.accessModules.length === 0" style="color: var(--fg-muted); font-size: 11px;">
                    No operational access
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Staff Modal -->
      <div class="modal-overlay" *ngIf="showAddModal()">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add Staff Member</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeAddModal()">X</button>
          </div>
          <form (ngSubmit)="saveStaff()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label" for="staff-name">Full Name</label>
                <input type="text" id="staff-name" name="name" [(ngModel)]="newStaff.name" class="form-control" required placeholder="e.g. Richard Hendricks" />
              </div>
              <div class="form-group">
                <label class="form-label" for="staff-email">Email Address</label>
                <input type="email" id="staff-email" name="email" [(ngModel)]="newStaff.email" class="form-control" required placeholder="e.g. richard@alaya.com" />
              </div>
              <div class="form-group">
                <label class="form-label" for="staff-role">Role</label>
                <select id="staff-role" name="role" [(ngModel)]="newStaff.role" class="form-control form-select" (change)="onRoleChange()">
                  <option value="admin">Administrator / Owner</option>
                  <option value="receptionist">Receptionist / Cashier</option>
                  <option value="chef">Chef / KOT Operator</option>
                  <option value="housekeeper">Housekeeping Staff</option>
                  <option value="driver">Cab Driver</option>
                </select>
              </div>

              <!-- Module access checkboxes -->
              <div class="form-group" *ngIf="newStaff.role !== 'guest'">
                <label class="form-label">Assign Module Access Permissions</label>
                <div class="modules-checkboxes">
                  <label *ngFor="let mod of availableModules" class="checkbox-label">
                    <input type="checkbox" [checked]="hasAccess(mod)" (change)="toggleModule(mod)" />
                    {{ mod | titlecase }}
                  </label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn" (click)="closeAddModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Member</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .staff-page {
      display: flex;
      flex-direction: column;
    }
    
    .profile-header {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    
    .profile-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: var(--primary-accent);
      color: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      border: 1px solid var(--border-color);
    }
    
    .profile-meta h3 {
      font-size: 15px;
      margin-bottom: 2px;
    }
    
    .detail-row {
      margin-bottom: 8px;
      font-size: 13px;
    }
    
    .detail-label {
      color: var(--fg-muted);
      font-weight: 600;
      margin-right: 6px;
    }
    
    .modules-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .module-tag {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--fg-secondary);
      padding: 2px 6px;
      font-size: 11px;
      border-radius: 4px;
      font-weight: 500;
    }
    
    .modules-checkboxes {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: 8px;
    }
    
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      cursor: pointer;
    }
  `]
})
export class StaffComponent implements OnInit {
  private dbService = inject(MockDbService);

  staffList = signal<Staff[]>([]);
  showAddModal = signal<boolean>(false);

  availableModules = [
    'dashboard', 'properties', 'entities', 'kot', 'inventory', 'staff', 'housekeeping', 'finance'
  ];

  newStaff: Omit<Staff, 'id'> = {
    name: '',
    email: '',
    role: 'receptionist',
    accessModules: ['dashboard', 'entities']
  };

  ngOnInit() {
    this.loadStaff();
  }

  private loadStaff() {
    this.dbService.getStaff().subscribe(list => {
      this.staffList.set(list);
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  openAddModal() {
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
    this.resetForm();
  }

  onRoleChange() {
    // Prefill default module access rules based on selected role
    const role = this.newStaff.role;
    if (role === 'admin') {
      this.newStaff.accessModules = [...this.availableModules];
    } else if (role === 'chef') {
      this.newStaff.accessModules = ['dashboard', 'kot', 'inventory'];
    } else if (role === 'housekeeper') {
      this.newStaff.accessModules = ['housekeeping'];
    } else if (role === 'receptionist') {
      this.newStaff.accessModules = ['dashboard', 'entities', 'kot', 'housekeeping'];
    } else {
      this.newStaff.accessModules = [];
    }
  }

  hasAccess(mod: string): boolean {
    return this.newStaff.accessModules.includes(mod);
  }

  toggleModule(mod: string) {
    const active = this.newStaff.accessModules;
    if (active.includes(mod)) {
      this.newStaff.accessModules = active.filter(m => m !== mod);
    } else {
      this.newStaff.accessModules = [...active, mod];
    }
  }

  saveStaff() {
    if (!this.newStaff.name || !this.newStaff.email) return;

    this.dbService.addStaff(this.newStaff).subscribe(() => {
      this.loadStaff();
      this.closeAddModal();
    });
  }

  private resetForm() {
    this.newStaff = {
      name: '',
      email: '',
      role: 'receptionist',
      accessModules: ['dashboard', 'entities']
    };
  }
}
