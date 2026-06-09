import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService, Property } from '../../../core/services/mock-db.service';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="properties-page">
      <div class="page-header justify-between mb-3 d-flex align-items-center">
        <div>
          <h2>Manage Properties</h2>
          <p>Create and monitor hotels, resorts, restaurants, and other business entities.</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">+ Add Property</button>
      </div>

      <!-- Properties Grid -->
      <div class="grid grid-3">
        <div class="card property-card" *ngFor="let prop of properties()">
          <div class="property-header">
            <span class="badge" [ngClass]="{
              'badge-info': prop.type === 'hotel',
              'badge-success': prop.type === 'restaurant',
              'badge-warning': prop.type === 'resort',
              'badge-danger': prop.type === 'other'
            }">{{ prop.type | uppercase }}</span>
          </div>
          <div class="property-image-container" *ngIf="prop.imageUrl">
            <img [src]="prop.imageUrl" alt="Property building" class="property-image" />
          </div>
          <div class="card-body">
            <h3 class="property-title">{{ prop.name }}</h3>
            <p class="property-location">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {{ prop.location }}
            </p>
            <p class="property-desc">{{ prop.description }}</p>
          </div>
          <div class="property-footer">
            <span class="status-indicator active"></span>
            <span class="status-text">Fully Operational</span>
          </div>
        </div>
      </div>

      <!-- Add Property Modal Dialog -->
      <div class="modal-overlay" *ngIf="showAddModal()">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add New Property</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeAddModal()">X</button>
          </div>
          <form (ngSubmit)="saveProperty()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label" for="prop-name">Property Name</label>
                <input type="text" id="prop-name" name="name" [(ngModel)]="newProp.name" class="form-control" required placeholder="e.g. Alaya Sky Lounge" />
              </div>
              <div class="form-group">
                <label class="form-label" for="prop-type">Property Type</label>
                <select id="prop-type" name="type" [(ngModel)]="newProp.type" class="form-control form-select">
                  <option value="hotel">Hotel</option>
                  <option value="resort">Resort / Retreat</option>
                  <option value="restaurant">Restaurant / Bar</option>
                  <option value="other">Other Value Added Service</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="prop-location">Location</label>
                <input type="text" id="prop-location" name="location" [(ngModel)]="newProp.location" class="form-control" required placeholder="e.g. Mumbai, North Terminal" />
              </div>
              <div class="form-group">
                <label class="form-label" for="prop-desc">Description</label>
                <textarea id="prop-desc" name="description" [(ngModel)]="newProp.description" class="form-control" rows="3" placeholder="Brief summary of the business..."></textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="prop-image">Building Image URL</label>
                <input type="text" id="prop-image" name="imageUrl" [(ngModel)]="newProp.imageUrl" class="form-control" placeholder="e.g. https://images.unsplash.com/..." />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn" (click)="closeAddModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Property</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .properties-page {
      display: flex;
      flex-direction: column;
    }
    
    .property-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    
    .property-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .property-header {
      padding: 16px 16px 0 16px;
      display: flex;
      justify-content: flex-start;
    }
    
    .property-image-container {
      width: 100%;
      height: 130px;
      overflow: hidden;
      border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
    }
    
    .property-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .property-title {
      font-size: 16px;
      margin-bottom: 4px;
      color: var(--fg-primary);
    }
    
    .property-location {
      font-size: 12px;
      color: var(--fg-muted);
      margin-bottom: 12px;
    }
    
    .property-desc {
      font-size: 13px;
      color: var(--fg-secondary);
      line-height: 1.4;
    }
    
    .property-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border-muted);
      background-color: var(--bg-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .status-indicator.active {
      background-color: var(--success-color);
    }
    
    .status-text {
      color: var(--fg-secondary);
    }
  `]
})
export class PropertiesComponent implements OnInit {
  private dbService = inject(MockDbService);

  properties = signal<Property[]>([]);
  showAddModal = signal<boolean>(false);

  newProp: Omit<Property, 'id'> = {
    name: '',
    type: 'hotel',
    location: '',
    description: '',
    imageUrl: ''
  };

  ngOnInit() {
    this.loadProperties();
  }

  private loadProperties() {
    this.dbService.getProperties().subscribe(list => {
      this.properties.set(list);
    });
  }

  openAddModal() {
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
    this.resetForm();
  }

  saveProperty() {
    if (!this.newProp.name || !this.newProp.location) return;

    this.dbService.addProperty(this.newProp).subscribe(() => {
      this.loadProperties();
      this.closeAddModal();
    });
  }

  private resetForm() {
    this.newProp = {
      name: '',
      type: 'hotel',
      location: '',
      description: '',
      imageUrl: ''
    };
  }
}
