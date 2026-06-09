import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService, Entity, Property } from '../../../core/services/mock-db.service';

@Component({
  selector: 'app-entities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="entities-page">
      <div class="page-header justify-between mb-3 d-flex align-items-center">
        <div>
          <h2>Manage Assets & Services</h2>
          <p>Configure property rooms, restaurant tables, cabs, and services.</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">+ Add Asset/Service</button>
      </div>

      <!-- Filters Row -->
      <div class="card mb-3 filter-card">
        <div class="card-body filter-row">
          <div class="filter-group">
            <label class="form-label">Filter by Property</label>
            <select class="form-control form-select" [(ngModel)]="selectedPropertyId">
              <option value="">All Properties</option>
              <option *ngFor="let prop of properties()" [value]="prop.id">{{ prop.name }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="form-label">Filter by Asset Type</label>
            <select class="form-control form-select" [(ngModel)]="selectedType">
              <option value="">All Types</option>
              <option value="room">Rooms</option>
              <option value="table">Restaurant Tables</option>
              <option value="cab">Cabs</option>
              <option value="service">Services</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Assets Table/List -->
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Property</th>
              <th>Type / Category</th>
              <th>Pricing Rate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ent of filteredEntities()">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <img *ngIf="ent.type === 'room' && ent.imageUrl" [src]="ent.imageUrl" alt="Room thumbnail" class="room-thumb" />
                  <div>
                    <strong>{{ ent.name }}</strong>
                    <div style="font-size: 11px; color: var(--fg-muted);" *ngIf="ent.subtype">
                      {{ ent.subtype }}
                    </div>
                  </div>
                </div>
              </td>
              <td>{{ getPropertyName(ent.propertyId) }}</td>
              <td>
                <span class="badge badge-info">{{ ent.type | uppercase }}</span>
              </td>
              <td>
                <span *ngIf="ent.price > 0">\${{ ent.price }} / unit</span>
                <span *ngIf="ent.price === 0" style="color: var(--fg-muted);">N/A</span>
              </td>
              <td>
                <span class="badge" [ngClass]="{
                  'badge-success': ent.status === 'available',
                  'badge-warning': ent.status === 'occupied',
                  'badge-danger': ent.status === 'dirty',
                  'badge-info': ent.status === 'maintenance'
                }">{{ ent.status | uppercase }}</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-sm" *ngIf="ent.status === 'dirty'" (click)="cleanAsset(ent.id)">
                    Clean (HK)
                  </button>
                  <button class="btn btn-sm" *ngIf="ent.status === 'available'" (click)="updateStatus(ent.id, 'maintenance')">
                    Maintenance
                  </button>
                  <button class="btn btn-sm" *ngIf="ent.status === 'maintenance'" (click)="updateStatus(ent.id, 'available')">
                    Release
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredEntities().length === 0">
              <td colspan="6" class="text-center">No assets found matching the filter criteria.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Entity Modal -->
      <div class="modal-overlay" *ngIf="showAddModal()">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add Asset / Service</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeAddModal()">X</button>
          </div>
          <form (ngSubmit)="saveEntity()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label" for="ent-property">Parent Property</label>
                <select id="ent-property" name="propertyId" [(ngModel)]="newEnt.propertyId" class="form-control form-select" required>
                  <option value="" disabled selected>Select Property</option>
                  <option *ngFor="let prop of properties()" [value]="prop.id">{{ prop.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="ent-name">Asset Name/Number</label>
                <input type="text" id="ent-name" name="name" [(ngModel)]="newEnt.name" class="form-control" required placeholder="e.g. Room 204 or Table 9" />
              </div>
              <div class="form-group">
                <label class="form-label" for="ent-type">Asset Type</label>
                <select id="ent-type" name="type" [(ngModel)]="newEnt.type" class="form-control form-select">
                  <option value="room">Room</option>
                  <option value="table">Restaurant Table</option>
                  <option value="cab">Cab / Taxi Service</option>
                  <option value="service">Value-Added Service (Spa, Tour, etc.)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="ent-subtype">Subtype / Description</label>
                <input type="text" id="ent-subtype" name="subtype" [(ngModel)]="newEnt.subtype" class="form-control" placeholder="e.g. Deluxe Suite, 4-Seater, SUV" />
              </div>
              <div class="form-group">
                <label class="form-label" for="ent-price">Pricing / Booking Rate ($)</label>
                <input type="number" id="ent-price" name="price" [(ngModel)]="newEnt.price" class="form-control" placeholder="0 if free or restaurant table" />
              </div>
              <div class="form-group">
                <label class="form-label" for="ent-status">Initial Status</label>
                <select id="ent-status" name="status" [(ngModel)]="newEnt.status" class="form-control form-select">
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="dirty">Dirty (Triggers Housekeeping)</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>
              <div class="form-group" *ngIf="newEnt.type === 'room'">
                <label class="form-label" for="ent-image">Room Image URL</label>
                <input type="text" id="ent-image" name="imageUrl" [(ngModel)]="newEnt.imageUrl" class="form-control" placeholder="e.g. https://images.unsplash.com/..." />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn" (click)="closeAddModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Asset</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .entities-page {
      display: flex;
      flex-direction: column;
    }
    
    .filter-card {
      margin-bottom: 20px;
    }
    
    .filter-row {
      display: flex;
      gap: 16px;
      padding: 12px;
    }
    
    .filter-group {
      flex: 1;
    }
    
    .room-thumb {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }
    
    .action-buttons {
      display: flex;
      gap: 6px;
    }
  `]
})
export class EntitiesComponent implements OnInit {
  private dbService = inject(MockDbService);

  entities = signal<Entity[]>([]);
  properties = signal<Property[]>([]);
  showAddModal = signal<boolean>(false);

  selectedPropertyId = '';
  selectedType = '';

  newEnt: Omit<Entity, 'id'> = {
    propertyId: '',
    name: '',
    type: 'room',
    subtype: '',
    price: 0,
    status: 'available',
    imageUrl: ''
  };

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.dbService.getEntities().subscribe(list => {
      this.entities.set(list);
    });
    this.dbService.getProperties().subscribe(list => {
      this.properties.set(list);
    });
  }

  getPropertyName(propertyId: string): string {
    const prop = this.properties().find(p => p.id === propertyId);
    return prop ? prop.name : 'Unknown Property';
  }

  filteredEntities(): Entity[] {
    return this.entities().filter(e => {
      const matchProp = !this.selectedPropertyId || e.propertyId === this.selectedPropertyId;
      const matchType = !this.selectedType || e.type === this.selectedType;
      return matchProp && matchType;
    });
  }

  openAddModal() {
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
    this.resetForm();
  }

  saveEntity() {
    if (!this.newEnt.propertyId || !this.newEnt.name) return;

    this.dbService.addEntity(this.newEnt).subscribe(() => {
      this.loadData();
      this.closeAddModal();
    });
  }

  updateStatus(id: string, status: Entity['status']) {
    this.dbService.updateEntityStatus(id, status).subscribe(() => {
      this.loadData();
    });
  }

  cleanAsset(id: string) {
    // Assign cleaning status (this will also register housekeeping tasks)
    this.dbService.updateEntityStatus(id, 'dirty').subscribe(() => {
      this.loadData();
    });
  }

  private resetForm() {
    this.newEnt = {
      propertyId: '',
      name: '',
      type: 'room',
      subtype: '',
      price: 0,
      status: 'available',
      imageUrl: ''
    };
  }
}
