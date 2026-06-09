import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe, UpperCasePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService, Staff, RoleMaster, ModuleMaster, PermissionMaster, TransactionalLog } from '../../../core/services/mock-db.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  template: `
    <div class="user-mgmt-page">
      <!-- Page Header -->
      <div class="page-header justify-between mb-3 d-flex align-items-center flex-wrap gap-3">
        <div>
          <h2>User Management Dashboard</h2>
          <p>Configure system users, control access modules & permissions, and audit user activity logs.</p>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs-container mb-3">
        <button class="tab-btn" [class.active]="activeTab() === 'users'" (click)="setTab('users')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Users Directory
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'roles'" (click)="setTab('roles')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Roles & Permissions Master
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'logs'" (click)="setTab('logs')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Transactional Audit Logs
        </button>
      </div>

      <!-- Content Area -->
      <div class="tab-content">
        
        <!-- ================= TAB 1: USERS CRUD ================= -->
        <div *ngIf="activeTab() === 'users'" class="users-tab-layout animate-fade">
          <div class="main-pane">
            <div class="card mb-3">
              <div class="card-header flex-wrap gap-2">
                <div class="search-box">
                  <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" class="form-control search-input" placeholder="Search employees by name, email, role or code..." [(ngModel)]="userSearchQuery" (input)="resetPagination()" />
                </div>
                <button class="btn btn-primary" (click)="openAddUserModal()">+ Add New User</button>
              </div>
              
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Emp Code</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Join Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let staff of paginatedStaff()" (click)="selectUser(staff)" [class.selected]="selectedUser()?.id === staff.id" class="clickable-row">
                      <td><code>{{ staff.employeeCode || 'N/A' }}</code></td>
                      <td class="font-semibold">{{ staff.name }}</td>
                      <td>{{ staff.email }}</td>
                      <td>
                        <span class="role-badge">{{ getRoleName(staff.role) }}</span>
                      </td>
                      <td>{{ staff.joinDate | date:'mediumDate' }}</td>
                      <td>
                        <span class="badge" [class.badge-success]="staff.status === 'active'" [class.badge-danger]="staff.status === 'suspended'">
                          {{ staff.status || 'active' | uppercase }}
                        </span>
                      </td>
                    </tr>
                    <tr *ngIf="filteredStaff().length === 0">
                      <td colspan="6" class="text-center text-muted py-4">No users found matching the search criteria.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination Footer -->
              <div class="card-footer d-flex justify-between align-items-center mt-2 px-3 py-2 border-top">
                <div class="pagination-info">
                  Showing {{ paginationStart() }} to {{ paginationEnd() }} of {{ filteredStaff().length }} users
                </div>
                <div class="pagination-controls d-flex gap-2">
                  <button class="btn btn-sm" [disabled]="currentPage() === 1" (click)="prevPage()">Prev</button>
                  <span class="page-number-label align-items-center d-flex">Page {{ currentPage() }} of {{ totalPages() || 1 }}</span>
                  <button class="btn btn-sm" [disabled]="currentPage() === totalPages() || totalPages() === 0" (click)="nextPage()">Next</button>
                </div>
              </div>
            </div>
          </div>

          <!-- User Details / Edit Side Drawer Pane -->
          <div class="side-pane">
            <div class="card detail-card" *ngIf="selectedUser() as user">
              <div class="card-header justify-between">
                <h3>Employee Profile Details</h3>
                <button class="btn btn-sm" (click)="closeDetails()">X</button>
              </div>
              <div class="card-body">
                <!-- READ-ONLY MODE -->
                <div *ngIf="!editMode()" class="profile-view">
                  <div class="profile-header-large mb-3">
                    <div class="avatar-large">{{ getInitials(user.name) }}</div>
                    <div class="profile-meta">
                      <h3>{{ user.name }}</h3>
                      <span class="badge" [class.badge-success]="user.status === 'active'" [class.badge-danger]="user.status === 'suspended'">
                        {{ user.status || 'active' | uppercase }}
                      </span>
                    </div>
                  </div>

                  <div class="info-list">
                    <div class="info-item">
                      <span class="info-label">Employee Code</span>
                      <span class="info-value"><code>{{ user.employeeCode || 'N/A' }}</code></span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Email Address</span>
                      <span class="info-value">{{ user.email }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Phone Number</span>
                      <span class="info-value">{{ user.phone || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Designated Role</span>
                      <span class="info-value font-semibold">{{ getRoleName(user.role) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Joining Date</span>
                      <span class="info-value">{{ user.joinDate | date:'longDate' }}</span>
                    </div>
                  </div>

                  <!-- ID Proofs Read Only -->
                  <div class="proofs-section mt-3">
                    <h4 class="mb-2">Attached ID Proof Documents</h4>
                    <div class="proofs-grid" *ngIf="user.idProofs && user.idProofs.length > 0; else noProofs">
                      <div class="proof-card" *ngFor="let proof of user.idProofs">
                        <div class="proof-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <div class="proof-info">
                          <span class="proof-name">{{ proof }}</span>
                          <span class="proof-preview-badge">Verified Scan</span>
                        </div>
                      </div>
                    </div>
                    <ng-template #noProofs>
                      <div class="alert alert-info py-2" style="font-size:12px;">No ID proof documents uploaded for this user.</div>
                    </ng-template>
                  </div>

                  <div class="action-buttons-row mt-3 border-top pt-3 d-flex justify-between">
                    <button class="btn btn-primary" (click)="toggleEditMode()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      Edit Employee
                    </button>
                    <button class="btn btn-danger btn-sm" (click)="deleteUser(user.id)">Delete User</button>
                  </div>
                </div>

                <!-- EDITABLE MODE -->
                <form *ngIf="editMode()" (ngSubmit)="saveUserEdit()" class="profile-edit animate-fade">
                  <div class="form-group">
                    <label class="form-label" for="edit-name">Full Name</label>
                    <input type="text" id="edit-name" name="name" [(ngModel)]="editStaffData.name" class="form-control" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="edit-email">Email Address</label>
                    <input type="email" id="edit-email" name="email" [(ngModel)]="editStaffData.email" class="form-control" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="edit-phone">Phone Number</label>
                    <input type="text" id="edit-phone" name="phone" [(ngModel)]="editStaffData.phone" class="form-control" />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="edit-code">Employee Code</label>
                    <input type="text" id="edit-code" name="employeeCode" [(ngModel)]="editStaffData.employeeCode" class="form-control" />
                  </div>
                  <div class="grid grid-2">
                    <div class="form-group">
                      <label class="form-label" for="edit-role">Designated Role</label>
                      <select id="edit-role" name="role" [(ngModel)]="editStaffData.role" class="form-control form-select">
                        <option *ngFor="let r of roles()" [value]="r.id">{{ r.name }}</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label" for="edit-status">Status</label>
                      <select id="edit-status" name="status" [(ngModel)]="editStaffData.status" class="form-control form-select">
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="edit-joindate">Joining Date</label>
                    <input type="date" id="edit-joindate" name="joinDate" [(ngModel)]="editStaffData.joinDate" class="form-control" />
                  </div>

                  <!-- Edit ID Proofs -->
                  <div class="form-group">
                    <label class="form-label">Scanned ID Proofs</label>
                    <div class="proofs-edit-list mb-2">
                      <div class="edit-proof-item justify-between d-flex align-items-center" *ngFor="let proof of editStaffData.idProofs; let i = index">
                        <span class="proof-filename" style="display: inline-flex; align-items: center; gap: 4px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                          {{ proof }}
                        </span>
                        <button type="button" class="btn btn-sm btn-danger py-1 px-2" (click)="removeEditProof(i)">Remove</button>
                      </div>
                    </div>
                    <div class="upload-zone p-2 border border-dashed rounded text-center">
                      <input type="file" id="edit-proof-upload" class="d-none" (change)="onEditProofUpload($event)" multiple />
                      <label for="edit-proof-upload" class="clickable-label m-0 font-semibold text-primary cursor-pointer" style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                        Click to upload simulated ID files
                      </label>
                    </div>
                  </div>

                  <div class="action-buttons-row mt-3 border-top pt-3 d-flex justify-between">
                    <button type="button" class="btn" (click)="cancelEdit()">Cancel</button>
                    <button type="submit" class="btn btn-success">Save Profile</button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Empty Detail State -->
            <div class="card detail-placeholder" *ngIf="!selectedUser()">
              <div class="card-body text-center py-5">
                <svg class="placeholder-icon mb-3" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <h4>No User Selected</h4>
                <p class="text-muted">Click on any user row in the directory list to display employee details, edit profiles, or manage credentials.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= TAB 2: ROLES & PERMISSIONS MASTER ================= -->
        <div *ngIf="activeTab() === 'roles'" class="roles-tab-layout animate-fade">
          <div class="grid grid-3">
            <!-- Modules Column -->
            <div class="card">
              <div class="card-header">
                <h3>Modules Master</h3>
              </div>
              <div class="card-body">
                <p class="text-muted mb-2" style="font-size:12px;">Add or remove core modules which represent different PMS sections.</p>
                <div class="master-list mb-3">
                  <div class="master-item justify-between d-flex align-items-center" *ngFor="let mod of modules()">
                    <span class="font-semibold">{{ mod.name }} <code style="font-size:11px;">({{ mod.id }})</code></span>
                    <button class="btn btn-sm btn-danger py-1 px-2" (click)="deleteModule(mod.id)">Delete</button>
                  </div>
                </div>
                <form (ngSubmit)="addNewModule()" class="inline-add border-top pt-3">
                  <div class="form-group mb-2">
                    <label class="form-label mb-1" style="font-size:12px;">Add Platform Module</label>
                    <input type="text" name="newModuleName" [(ngModel)]="newModuleName" class="form-control" placeholder="e.g. Housekeeping" required />
                  </div>
                  <button type="submit" class="btn btn-sm btn-primary w-100">Add Module</button>
                </form>
              </div>
            </div>

            <!-- Permissions Column -->
            <div class="card">
              <div class="card-header">
                <h3>Permissions Master</h3>
              </div>
              <div class="card-body">
                <p class="text-muted mb-2" style="font-size:12px;">Manage action scopes that can be granted across platform modules.</p>
                <div class="master-list mb-3">
                  <div class="master-item justify-between d-flex align-items-center" *ngFor="let perm of permissions()">
                    <span class="font-semibold">{{ perm.name }} <code style="font-size:11px;">({{ perm.id }})</code></span>
                    <button class="btn btn-sm btn-danger py-1 px-2" (click)="deletePermission(perm.id)">Delete</button>
                  </div>
                </div>
                <form (ngSubmit)="addNewPermission()" class="inline-add border-top pt-3">
                  <div class="form-group mb-2">
                    <label class="form-label mb-1" style="font-size:12px;">Add System Permission</label>
                    <input type="text" name="newPermissionName" [(ngModel)]="newPermissionName" class="form-control" placeholder="e.g. Settle Payments" required />
                  </div>
                  <button type="submit" class="btn btn-sm btn-primary w-100">Add Permission</button>
                </form>
              </div>
            </div>

            <!-- Roles List Column -->
            <div class="card">
              <div class="card-header">
                <h3>Operational Roles</h3>
              </div>
              <div class="card-body">
                <p class="text-muted mb-2" style="font-size:12px;">Create roles to map custom permission sets across assigned modules.</p>
                <div class="master-list mb-3">
                  <div class="master-item clickable-master-item justify-between d-flex align-items-center" *ngFor="let r of roles()" (click)="selectRole(r)" [class.selected]="selectedRole()?.id === r.id">
                    <span class="font-semibold">{{ r.name }}</span>
                    <button class="btn btn-sm btn-danger py-1 px-2" (click)="deleteRole(r.id); $event.stopPropagation()">Delete</button>
                  </div>
                </div>
                <form (ngSubmit)="addNewRole()" class="inline-add border-top pt-3">
                  <div class="form-group mb-2">
                    <label class="form-label mb-1" style="font-size:12px;">Create User Role</label>
                    <input type="text" name="newRoleName" [(ngModel)]="newRoleName" class="form-control" placeholder="e.g. Shift Manager" required />
                  </div>
                  <button type="submit" class="btn btn-sm btn-primary w-100">Create Role</button>
                </form>
              </div>
            </div>
          </div>

          <!-- Permissions Mapping Matrix (Shows when a role is selected) -->
          <div class="card mt-3 animate-fade" *ngIf="selectedRole() as role">
            <div class="card-header justify-between">
              <div>
                <h3>Permissions Matrix: {{ role.name }}</h3>
                <p class="m-0 text-muted" style="font-size: 12px;">Grant or revoke permission permissions on each module for this role.</p>
              </div>
              <button class="btn btn-success" (click)="savePermissionsMatrix()">Save Matrix Permissions</button>
            </div>
            <div class="table-container">
              <table class="table matrix-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th *ngFor="let perm of permissions()" class="text-center">{{ perm.name }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let mod of modules()">
                    <td class="font-semibold">{{ mod.name }} <code style="font-size: 11px;">({{ mod.id }})</code></td>
                    <td *ngFor="let perm of permissions()" class="text-center">
                      <input type="checkbox" class="matrix-checkbox" [checked]="hasPermissionChecked(role.id, mod.id, perm.id)" (change)="togglePermissionMapping(mod.id, perm.id)" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="alert alert-info mt-3" style="display: inline-flex; align-items: center; gap: 8px;" *ngIf="!selectedRole()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A7.5 7.5 0 0 0 3 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"></path><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line></svg>
            <span>Select an operational role from the <b>Operational Roles</b> list to configure its permissions matrix mapping.</span>
          </div>
        </div>

        <!-- ================= TAB 3: TRANSACTIONAL LOGS ================= -->
        <div *ngIf="activeTab() === 'logs'" class="logs-tab-layout animate-fade">
          <div class="card mb-3">
            <div class="card-header justify-between flex-wrap gap-2">
              <div class="filter-controls d-flex align-items-center gap-2">
                <label class="form-label m-0" for="log-user-filter">Filter by User:</label>
                <select id="log-user-filter" class="form-control form-select" style="min-width: 250px;" [(ngModel)]="selectedLogUser" (change)="resetLogsPagination()">
                  <option value="">All Users</option>
                  <option *ngFor="let user of staffList()" [value]="user.id">{{ user.name }} ({{ user.email }})</option>
                </select>
              </div>
              <div class="log-search-box search-box">
                <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" class="form-control search-input" placeholder="Search logs by action or module..." [(ngModel)]="logSearchQuery" (input)="resetLogsPagination()" />
              </div>
            </div>

            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let log of paginatedLogs()">
                    <td><code>{{ log.timestamp | date:'medium' }}</code></td>
                    <td>
                      <div class="font-semibold">{{ log.userName }}</div>
                      <div class="text-muted" style="font-size: 11px;">{{ log.userEmail }}</div>
                    </td>
                    <td>
                      <span class="badge badge-info font-semibold">{{ log.action }}</span>
                    </td>
                    <td>
                      <span class="role-badge">{{ log.module }}</span>
                    </td>
                    <td>{{ log.details || 'N/A' }}</td>
                  </tr>
                  <tr *ngIf="filteredLogs().length === 0">
                    <td colspan="5" class="text-center text-muted py-4">No audit logs found.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Logs Pagination Footer -->
            <div class="card-footer d-flex justify-between align-items-center mt-2 px-3 py-2 border-top">
              <div class="pagination-info">
                Showing {{ logsPaginationStart() }} to {{ logsPaginationEnd() }} of {{ filteredLogs().length }} audit logs
              </div>
              <div class="pagination-controls d-flex gap-2">
                <button class="btn btn-sm" [disabled]="currentLogsPage() === 1" (click)="prevLogsPage()">Prev</button>
                <span class="page-number-label align-items-center d-flex">Page {{ currentLogsPage() }} of {{ totalLogsPages() || 1 }}</span>
                <button class="btn btn-sm" [disabled]="currentLogsPage() === totalLogsPages() || totalLogsPages() === 0" (click)="nextLogsPage()">Next</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Add User Modal Dialog -->
      <div class="modal-overlay" *ngIf="showAddUserModal()">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add New User Account</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeAddUserModal()">X</button>
          </div>
          <form (ngSubmit)="saveNewUser()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label" for="add-name">Full Name</label>
                <input type="text" id="add-name" name="name" [(ngModel)]="newUser.name" class="form-control" required placeholder="e.g. Richard Hendricks" />
              </div>
              <div class="form-group">
                <label class="form-label" for="add-email">Email Address</label>
                <input type="email" id="add-email" name="email" [(ngModel)]="newUser.email" class="form-control" required placeholder="e.g. richard@alaya.com" />
              </div>
              <div class="form-group">
                <label class="form-label" for="add-phone">Phone Number</label>
                <input type="text" id="add-phone" name="phone" [(ngModel)]="newUser.phone" class="form-control" placeholder="e.g. +91 98765 43210" />
              </div>
              <div class="form-group">
                <label class="form-label" for="add-code">Employee Code</label>
                <input type="text" id="add-code" name="employeeCode" [(ngModel)]="newUser.employeeCode" class="form-control" placeholder="e.g. EMP-009" />
              </div>
              
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label" for="add-role">Designated Role</label>
                  <select id="add-role" name="role" [(ngModel)]="newUser.role" class="form-control form-select">
                    <option *ngFor="let r of roles()" [value]="r.id">{{ r.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="add-status">Status</label>
                  <select id="add-status" name="status" [(ngModel)]="newUser.status" class="form-control form-select">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="add-joindate">Joining Date</label>
                <input type="date" id="add-joindate" name="joinDate" [(ngModel)]="newUser.joinDate" class="form-control" />
              </div>

              <!-- Proof uploads mock -->
              <div class="form-group">
                <label class="form-label">Attach Scanned ID Proofs</label>
                <div class="uploaded-previews mb-2" *ngIf="newUser.idProofs && newUser.idProofs.length > 0">
                  <div class="preview-item d-flex justify-between align-items-center" *ngFor="let proof of newUser.idProofs; let i = index">
                    <span style="display: inline-flex; align-items: center; gap: 4px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                      {{ proof }}
                    </span>
                    <button type="button" class="btn btn-sm btn-danger py-1" (click)="removeNewUserProof(i)">Remove</button>
                  </div>
                </div>
                <div class="upload-zone p-3 border border-dashed rounded text-center">
                  <input type="file" id="modal-proof-upload" class="d-none" (change)="onModalProofUpload($event)" multiple />
                  <label for="modal-proof-upload" class="clickable-label m-0 font-semibold text-primary cursor-pointer" style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    Click to select file scans for ID proofs
                  </label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn" (click)="closeAddUserModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Create User Account</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-mgmt-page {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* Tabs UI */
    .tabs-container {
      display: flex;
      border-bottom: 1px solid var(--border-color);
      gap: 4px;
    }

    .tab-btn {
      background: none;
      border: 1px solid transparent;
      border-bottom: none;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--fg-secondary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-top-left-radius: var(--border-radius);
      border-top-right-radius: var(--border-radius);
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      background-color: var(--bg-tertiary);
      color: var(--fg-primary);
    }

    .tab-btn.active {
      background-color: var(--bg-primary);
      border-color: var(--border-color);
      color: var(--fg-primary);
      font-weight: 600;
      margin-bottom: -1px;
      border-bottom: 1px solid var(--bg-primary);
      position: relative;
      z-index: 2;
    }

    /* Tab Layouts */
    .tab-content {
      flex: 1;
      min-height: 0;
    }

    /* Tab 1 layout */
    .users-tab-layout {
      display: grid;
      grid-template-columns: 2.2fr 1.3fr;
      gap: 20px;
      height: 100%;
    }

    .main-pane {
      overflow-y: auto;
      height: 100%;
    }

    .side-pane {
      overflow-y: auto;
      height: 100%;
    }

    @media (max-width: 992px) {
      .users-tab-layout {
        grid-template-columns: 1fr;
      }
    }

    /* Row Hover */
    .clickable-row {
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .clickable-row:hover {
      background-color: var(--bg-secondary);
    }

    .clickable-row.selected {
      background-color: var(--primary-accent) !important;
    }
    
    .font-semibold {
      font-weight: 600;
    }

    /* Roles layout */
    .roles-tab-layout {
      overflow-y: auto;
      height: 100%;
      padding-bottom: 30px;
    }

    /* List group style for masters */
    .master-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 240px;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 8px;
      background-color: var(--bg-secondary);
    }

    .master-item {
      padding: 6px 12px;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-muted);
      border-radius: 4px;
      font-size: 13px;
    }

    .clickable-master-item {
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .clickable-master-item:hover {
      background-color: var(--primary-accent);
      border-color: var(--border-color);
    }

    .clickable-master-item.selected {
      background-color: var(--primary-color) !important;
      color: #ffffff !important;
      border-color: var(--primary-color);
    }

    body.dark-theme .clickable-master-item.selected {
      color: #0d1117 !important;
    }

    /* Matrix checklist style */
    .matrix-table th, .matrix-table td {
      padding: 10px 14px;
      font-size: 13px;
    }

    .matrix-checkbox {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    /* Log tab layout */
    .logs-tab-layout {
      height: 100%;
      overflow-y: auto;
    }

    /* Details Drawer/Panel Profile View */
    .profile-header-large {
      display: flex;
      gap: 16px;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .avatar-large {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background-color: var(--primary-accent);
      color: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 24px;
      border: 2px solid var(--border-color);
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 12px;
      color: var(--fg-muted);
      font-weight: 600;
    }

    .info-value {
      font-size: 14px;
      color: var(--fg-primary);
    }

    /* Proof Cards */
    .proofs-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .proof-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border: 1px solid var(--border-muted);
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius);
    }

    .proof-icon {
      color: var(--primary-color);
      display: flex;
      align-items: center;
    }

    .proof-info {
      display: flex;
      flex-direction: column;
    }

    .proof-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--fg-primary);
    }

    .proof-preview-badge {
      font-size: 10px;
      color: var(--success-color);
      font-weight: 600;
    }

    /* Edit Form lists */
    .proofs-edit-list {
      max-height: 120px;
      overflow-y: auto;
      border: 1px solid var(--border-muted);
      border-radius: 4px;
      padding: 4px;
      background-color: var(--bg-secondary);
    }

    .edit-proof-item {
      padding: 4px 8px;
      background: var(--bg-primary);
      border: 1px solid var(--border-muted);
      border-radius: 4px;
      margin-bottom: 4px;
      font-size: 12px;
    }

    .edit-proof-item:last-child {
      margin-bottom: 0;
    }

    .upload-zone {
      background-color: var(--bg-secondary);
      border-color: var(--border-color);
      transition: background-color 0.15s ease;
    }

    .upload-zone:hover {
      background-color: var(--bg-tertiary);
    }

    /* Search and widgets styling */
    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;
      max-width: 450px;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--fg-muted);
      pointer-events: none;
    }

    .search-input {
      padding-left: 32px !important;
    }

    .role-badge {
      background-color: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      color: var(--fg-secondary);
      padding: 2px 6px;
      font-size: 11px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* Modal file list */
    .uploaded-previews {
      max-height: 100px;
      overflow-y: auto;
      background-color: var(--bg-secondary);
      padding: 4px;
      border: 1px solid var(--border-muted);
      border-radius: 4px;
    }

    .preview-item {
      padding: 4px 8px;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-muted);
      border-radius: 4px;
      margin-bottom: 4px;
      font-size: 12px;
    }

    .preview-item:last-child {
      margin-bottom: 0;
    }

    /* Animation effects */
    .animate-fade {
      animation: fadeIn 0.2s ease-out;
    }

    .cursor-pointer {
      cursor: pointer;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  private dbService = inject(MockDbService);

  // General State
  activeTab = signal<'users' | 'roles' | 'logs'>('users');
  
  // Data State Signals
  staffList = signal<Staff[]>([]);
  roles = signal<RoleMaster[]>([]);
  modules = signal<ModuleMaster[]>([]);
  permissions = signal<PermissionMaster[]>([]);
  transactionalLogs = signal<TransactionalLog[]>([]);

  // User Directory State (Tab 1)
  userSearchQuery = '';
  currentPage = signal<number>(1);
  pageSize = 5;
  selectedUser = signal<Staff | null>(null);
  editMode = signal<boolean>(false);
  
  // Add User Modal state
  showAddUserModal = signal<boolean>(false);
  newUser: Omit<Staff, 'id'> = {
    name: '',
    email: '',
    role: 'receptionist',
    accessModules: [],
    phone: '',
    employeeCode: '',
    joinDate: new Date().toISOString().substring(0, 10),
    status: 'active',
    idProofs: []
  };

  // Edit Staff Form Temporary Data
  editStaffData: Staff = {
    id: '',
    name: '',
    email: '',
    role: '',
    accessModules: [],
    phone: '',
    employeeCode: '',
    joinDate: '',
    status: 'active',
    idProofs: []
  };

  // Masters Master Config (Tab 2)
  selectedRole = signal<RoleMaster | null>(null);
  
  newModuleName = '';
  newPermissionName = '';
  newRoleName = '';

  // Audit Logs State (Tab 3)
  selectedLogUser = '';
  logSearchQuery = '';
  currentLogsPage = signal<number>(1);
  logsPageSize = 8;

  ngOnInit() {
    this.loadAllData();
  }

  // Set the current navigation tab
  setTab(tab: 'users' | 'roles' | 'logs') {
    this.activeTab.set(tab);
    // Reload database instances just in case edits were made
    this.loadAllData();
    this.closeDetails();
  }

  // Load state from DB service
  private loadAllData() {
    this.dbService.getStaff().subscribe(res => this.staffList.set(res));
    this.dbService.getRoles().subscribe(res => this.roles.set(res));
    this.dbService.getModules().subscribe(res => this.modules.set(res));
    this.dbService.getPermissions().subscribe(res => this.permissions.set(res));
    this.dbService.getLogs().subscribe(res => this.transactionalLogs.set(res));
  }

  // ================= TAB 1: USERS CRUD =================

  // Filtered Users Computed List
  filteredStaff = computed(() => {
    const list = this.staffList();
    const query = this.userSearchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const emailMatch = item.email.toLowerCase().includes(query);
      const codeMatch = (item.employeeCode || '').toLowerCase().includes(query);
      
      const roleName = this.getRoleName(item.role).toLowerCase();
      const roleMatch = roleName.includes(query);
      
      return nameMatch || emailMatch || codeMatch || roleMatch;
    });
  });

  // Paginated Users Computed List
  paginatedStaff = computed(() => {
    const list = this.filteredStaff();
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredStaff().length / this.pageSize));

  paginationStart = computed(() => {
    if (this.filteredStaff().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  });

  paginationEnd = computed(() => {
    const total = this.filteredStaff().length;
    const currentEnd = this.currentPage() * this.pageSize;
    return currentEnd > total ? total : currentEnd;
  });

  resetPagination() {
    this.currentPage.set(1);
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  getRoleName(roleId: string): string {
    const role = this.roles().find(r => r.id === roleId);
    return role ? role.name : roleId;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  // Row selection triggers details view
  selectUser(user: Staff) {
    this.selectedUser.set(user);
    this.editMode.set(false);
  }

  closeDetails() {
    this.selectedUser.set(null);
    this.editMode.set(false);
  }

  // Edit Mode Toggle
  toggleEditMode() {
    const user = this.selectedUser();
    if (!user) return;
    
    // Copy current details into editing object
    this.editStaffData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessModules: [...(user.accessModules || [])],
      phone: user.phone || '',
      employeeCode: user.employeeCode || '',
      joinDate: user.joinDate || '',
      status: user.status || 'active',
      idProofs: [...(user.idProofs || [])]
    };
    
    this.editMode.set(true);
  }

  cancelEdit() {
    this.editMode.set(false);
  }

  // Mock Upload Handlers
  onEditProofUpload(event: any) {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!this.editStaffData.idProofs) {
          this.editStaffData.idProofs = [];
        }
        this.editStaffData.idProofs.push(file.name);
      }
    }
  }

  removeEditProof(index: number) {
    if (this.editStaffData.idProofs) {
      this.editStaffData.idProofs.splice(index, 1);
    }
  }

  // Save User Edit Changes
  saveUserEdit() {
    if (!this.editStaffData.name || !this.editStaffData.email) {
      alert('Name and Email are required.');
      return;
    }

    // Lookup selected role modules for authorization access permissions
    const selectedRoleObj = this.roles().find(r => r.id === this.editStaffData.role);
    this.editStaffData.accessModules = selectedRoleObj ? Object.keys(selectedRoleObj.permissions) : [];

    this.dbService.updateStaff(this.editStaffData).subscribe(updated => {
      this.loadAllData();
      
      // Update selected profile view with updated object
      this.selectedUser.set(updated);
      this.editMode.set(false);
    });
  }

  deleteUser(id: string) {
    if (confirm('Are you sure you want to permanently delete this user account?')) {
      this.dbService.deleteStaff(id).subscribe(() => {
        this.loadAllData();
        this.closeDetails();
      });
    }
  }

  // Create User Handlers
  openAddUserModal() {
    this.newUser = {
      name: '',
      email: '',
      role: this.roles().length > 0 ? this.roles()[0].id : 'receptionist',
      accessModules: [],
      phone: '',
      employeeCode: `EMP-0${this.staffList().length + 2}`,
      joinDate: new Date().toISOString().substring(0, 10),
      status: 'active',
      idProofs: []
    };
    this.showAddUserModal.set(true);
  }

  closeAddUserModal() {
    this.showAddUserModal.set(false);
  }

  onModalProofUpload(event: any) {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!this.newUser.idProofs) {
          this.newUser.idProofs = [];
        }
        this.newUser.idProofs.push(file.name);
      }
    }
  }

  removeNewUserProof(index: number) {
    if (this.newUser.idProofs) {
      this.newUser.idProofs.splice(index, 1);
    }
  }

  saveNewUser() {
    if (!this.newUser.name || !this.newUser.email) {
      alert('Name and Email are required.');
      return;
    }

    // Lookup selected role modules for authorization access permissions
    const selectedRoleObj = this.roles().find(r => r.id === this.newUser.role);
    this.newUser.accessModules = selectedRoleObj ? Object.keys(selectedRoleObj.permissions) : [];

    this.dbService.addStaff(this.newUser).subscribe(() => {
      this.loadAllData();
      this.closeAddUserModal();
    });
  }


  // ================= TAB 2: ROLES & PERMISSIONS MASTER =================

  selectRole(role: RoleMaster) {
    this.selectedRole.set(role);
  }

  addNewModule() {
    if (!this.newModuleName.trim()) return;
    
    // Auto generate ID
    const modId = this.newModuleName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    
    this.dbService.addModule({ name: this.newModuleName }).subscribe(() => {
      this.loadAllData();
      this.newModuleName = '';
    });
  }

  deleteModule(id: string) {
    if (confirm('Are you sure you want to delete this module? This removes it from all role definitions.')) {
      this.dbService.deleteModule(id).subscribe(() => {
        this.loadAllData();
        // Clear selected role if configuration updates
        this.selectedRole.set(null);
      });
    }
  }

  addNewPermission() {
    if (!this.newPermissionName.trim()) return;
    
    this.dbService.addPermission({ name: this.newPermissionName }).subscribe(() => {
      this.loadAllData();
      this.newPermissionName = '';
    });
  }

  deletePermission(id: string) {
    if (confirm('Are you sure you want to delete this permission? This revokes it from all modules across roles.')) {
      this.dbService.deletePermission(id).subscribe(() => {
        this.loadAllData();
        // Clear selected role if configuration updates
        this.selectedRole.set(null);
      });
    }
  }

  addNewRole() {
    if (!this.newRoleName.trim()) return;
    
    const roleId = this.newRoleName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    const newRole: RoleMaster = {
      id: roleId,
      name: this.newRoleName,
      permissions: {}
    };

    // Use addRole from db service. Note that mock-db handles generating the unique id,
    // so we call dbService.addRole and let it return.
    this.dbService.addRole({ name: this.newRoleName, permissions: {} }).subscribe(createdRole => {
      this.loadAllData();
      this.selectedRole.set(createdRole);
      this.newRoleName = '';
    });
  }

  deleteRole(id: string) {
    if (id === 'admin') {
      alert('The primary Administrator role cannot be deleted.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this role configuration? Users mapped to this role may lose access.')) {
      this.dbService.deleteRole(id).subscribe(() => {
        this.loadAllData();
        if (this.selectedRole()?.id === id) {
          this.selectedRole.set(null);
        }
      });
    }
  }

  // Permissions Mapping Matrix Helper Methods
  hasPermissionChecked(roleId: string, moduleId: string, permissionId: string): boolean {
    const roleObj = this.roles().find(r => r.id === roleId);
    if (!roleObj || !roleObj.permissions) return false;
    
    const modulePermissions = roleObj.permissions[moduleId];
    return modulePermissions ? modulePermissions.includes(permissionId) : false;
  }

  togglePermissionMapping(moduleId: string, permissionId: string) {
    const role = this.selectedRole();
    if (!role) return;

    // Deep copy to prevent side effects
    const updatedPermissions = JSON.parse(JSON.stringify(role.permissions)) as Record<string, string[]>;
    
    if (!updatedPermissions[moduleId]) {
      updatedPermissions[moduleId] = [];
    }

    const currentScope = updatedPermissions[moduleId];
    if (currentScope.includes(permissionId)) {
      updatedPermissions[moduleId] = currentScope.filter(p => p !== permissionId);
      // Remove key if no permissions remaining on module
      if (updatedPermissions[moduleId].length === 0) {
        delete updatedPermissions[moduleId];
      }
    } else {
      updatedPermissions[moduleId].push(permissionId);
    }

    // Set updated permissions on local selected object
    role.permissions = updatedPermissions;
  }

  savePermissionsMatrix() {
    const role = this.selectedRole();
    if (!role) return;

    this.dbService.updateRole(role).subscribe(updatedRole => {
      this.loadAllData();
      this.selectedRole.set(updatedRole);
      alert(`Permissions matrix successfully saved and updated for role "${role.name}"!`);
    });
  }


  // ================= TAB 3: TRANSACTIONAL LOGS =================

  // Filtered Logs Computed List
  filteredLogs = computed(() => {
    let list = this.transactionalLogs();
    
    // Sort descending by default (newest first)
    list = [...list].sort((a, b) => b.timestamp - a.timestamp);

    const userFilter = this.selectedLogUser;
    const query = this.logSearchQuery.trim().toLowerCase();

    // Apply User Filter
    if (userFilter) {
      list = list.filter(l => l.userId === userFilter);
    }

    // Apply Text Query Filter
    if (query) {
      list = list.filter(l => 
        l.action.toLowerCase().includes(query) ||
        l.module.toLowerCase().includes(query) ||
        (l.details || '').toLowerCase().includes(query) ||
        l.userName.toLowerCase().includes(query) ||
        l.userEmail.toLowerCase().includes(query)
      );
    }

    return list;
  });

  // Paginated Logs Computed List
  paginatedLogs = computed(() => {
    const list = this.filteredLogs();
    const startIndex = (this.currentLogsPage() - 1) * this.logsPageSize;
    return list.slice(startIndex, startIndex + this.logsPageSize);
  });

  totalLogsPages = computed(() => Math.ceil(this.filteredLogs().length / this.logsPageSize));

  logsPaginationStart = computed(() => {
    if (this.filteredLogs().length === 0) return 0;
    return (this.currentLogsPage() - 1) * this.logsPageSize + 1;
  });

  logsPaginationEnd = computed(() => {
    const total = this.filteredLogs().length;
    const currentEnd = this.currentLogsPage() * this.logsPageSize;
    return currentEnd > total ? total : currentEnd;
  });

  resetLogsPagination() {
    this.currentLogsPage.set(1);
  }

  prevLogsPage() {
    if (this.currentLogsPage() > 1) {
      this.currentLogsPage.update(p => p - 1);
    }
  }

  nextLogsPage() {
    if (this.currentLogsPage() < this.totalLogsPages()) {
      this.currentLogsPage.update(p => p + 1);
    }
  }
}
