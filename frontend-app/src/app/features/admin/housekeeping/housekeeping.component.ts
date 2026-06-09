import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService, HousekeepingTask, Staff, Entity } from '../../../core/services/mock-db.service';

@Component({
  selector: 'app-housekeeping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="housekeeping-page">
      <div class="page-header justify-between mb-3 d-flex align-items-center">
        <div>
          <h2>Housekeeping Management</h2>
          <p>Assign room cleanup requests, update status, and coordinate housekeeping staff.</p>
        </div>
      </div>

      <!-- Housekeeping stats -->
      <div class="grid grid-3 mb-3">
        <div class="card summary-card border-danger">
          <div class="card-body">
            <h3>{{ dirtyRoomsCount() }} Rooms Dirty</h3>
            <p>Awaiting assignment or preparation.</p>
          </div>
        </div>
        <div class="card summary-card border-info">
          <div class="card-body">
            <h3>{{ cleaningRoomsCount() }} Rooms In-Progress</h3>
            <p>Staff currently cleaning the room.</p>
          </div>
        </div>
        <div class="card summary-card border-success">
          <div class="card-body">
            <h3>{{ cleanRoomsCount() }} Rooms Cleaned</h3>
            <p>Ready for guests check-in.</p>
          </div>
        </div>
      </div>

      <!-- Task board tables -->
      <div class="card">
        <div class="card-header">
          <h3>Room Cleaning Tasks Checklist</h3>
        </div>
        <div class="card-body table-container" style="border: none;">
          <table class="table">
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Assigned Attendant</th>
                <th>Cleaning Status</th>
                <th>Last Updated</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let task of tasks()">
                <td><strong>{{ task.entityName }}</strong></td>
                <td>
                  <div *ngIf="task.housekeeperName" class="attendant-name">
                    {{ task.housekeeperName }}
                  </div>
                  <!-- Dropdown to assign housekeeper -->
                  <div *ngIf="!task.housekeeperName && task.status === 'dirty'" class="assign-attendant">
                    <select class="form-control form-control-sm form-select" (change)="assignStaff(task.id, $event)">
                      <option value="" disabled selected>Assign Staff</option>
                      <option *ngFor="let hk of housekeepers()" [value]="hk.id">{{ hk.name }}</option>
                    </select>
                  </div>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-danger': task.status === 'dirty',
                    'badge-info': task.status === 'cleaning',
                    'badge-success': task.status === 'clean'
                  }">{{ task.status | uppercase }}</span>
                </td>
                <td>{{ task.updatedAt | date:'shortTime' }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" *ngIf="task.status === 'dirty' && task.housekeeperId" (click)="updateStatus(task.id, 'cleaning')">
                      Start Cleaning
                    </button>
                    <button class="btn btn-sm btn-success" *ngIf="task.status === 'cleaning'" (click)="updateStatus(task.id, 'clean')">
                      Mark Clean & Ready
                    </button>
                    <button class="btn btn-sm" *ngIf="task.status === 'clean'" (click)="updateStatus(task.id, 'dirty')">
                      Flag Dirty
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="tasks().length === 0">
                <td colspan="5" class="text-center">No active room cleaning tasks on this list.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .housekeeping-page {
      display: flex;
      flex-direction: column;
    }
    
    .summary-card.border-danger { border-left: 4px solid var(--danger-color); }
    .summary-card.border-info { border-left: 4px solid var(--info-color); }
    .summary-card.border-success { border-left: 4px solid var(--success-color); }
    
    .attendant-name {
      font-weight: 500;
      color: var(--fg-primary);
    }
    
    .assign-attendant {
      max-width: 150px;
    }
    
    .action-buttons {
      display: flex;
      gap: 6px;
    }
  `]
})
export class HousekeepingComponent implements OnInit {
  private dbService = inject(MockDbService);

  tasks = signal<HousekeepingTask[]>([]);
  housekeepers = signal<Staff[]>([]);

  dirtyRoomsCount = signal<number>(0);
  cleaningRoomsCount = signal<number>(0);
  cleanRoomsCount = signal<number>(0);

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    // 1. Fetch active tasks
    this.dbService.getHousekeepingTasks().subscribe(list => {
      this.tasks.set(list);

      // Counts
      this.dirtyRoomsCount.set(list.filter(t => t.status === 'dirty').length);
      this.cleaningRoomsCount.set(list.filter(t => t.status === 'cleaning').length);
      this.cleanRoomsCount.set(list.filter(t => t.status === 'clean').length);
    });

    // 2. Fetch staff members who are housekeepers
    this.dbService.getStaff().subscribe(list => {
      this.housekeepers.set(list.filter(s => s.role === 'housekeeper'));
    });
  }

  assignStaff(taskId: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    const housekeeperId = select.value;
    const housekeeper = this.housekeepers().find(h => h.id === housekeeperId);

    if (housekeeper) {
      this.dbService.assignHousekeeper(taskId, housekeeper.id, housekeeper.name).subscribe(() => {
        this.loadData();
      });
    }
  }

  updateStatus(taskId: string, status: HousekeepingTask['status']) {
    this.dbService.updateHousekeepingStatus(taskId, status).subscribe(() => {
      this.loadData();
    });
  }
}
