import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MockDbService, Property, Entity } from '../../core/services/mock-db.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="details-page" *ngIf="property()">
      <!-- Public Header Navbar -->
      <nav class="public-nav">
        <div class="logo">
          <a routerLink="/" class="logo-link">Alaya <span class="logo-sub">Hospitality</span></a>
        </div>
        <div class="nav-links">
          <a routerLink="/" class="btn btn-secondary">← Back to Branches</a>
        </div>
      </nav>

      <!-- Property Banner -->
      <div class="property-banner-card card mb-3">
        <div class="banner-img-holder" *ngIf="property()?.imageUrl">
          <img [src]="property()?.imageUrl" alt="{{ property()?.name }}" class="banner-img" />
        </div>
        <div class="card-body banner-info">
          <span class="badge badge-info">{{ property()?.type | uppercase }}</span>
          <h1>{{ property()?.name }}</h1>
          <p class="location-text">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            {{ property()?.location }}
          </p>
          <p class="description-text">{{ property()?.description }}</p>
        </div>
      </div>

      <!-- Accommodation Units Grid -->
      <div class="rooms-container">
        <h2 class="section-title mb-3">Available Accommodations</h2>
        
        <div class="grid grid-3">
          <!-- Room Card -->
          <div class="card room-card" *ngFor="let room of rooms()">
            <div class="room-img-holder" *ngIf="room.imageUrl">
              <img [src]="room.imageUrl" alt="{{ room.name }}" class="room-img" />
            </div>
            
            <div class="card-body">
              <span class="badge badge-info mb-2">{{ room.subtype }}</span>
              <h3>{{ room.name }}</h3>
              <p class="room-pricing mt-2"><strong>\${{ room.price }}</strong> / night</p>
              
              <div class="room-status-row mt-3">
                <span class="status-dot" [ngClass]="{
                  'bg-success': room.status === 'available',
                  'bg-warning': room.status === 'occupied',
                  'bg-danger': room.status === 'dirty',
                  'bg-info': room.status === 'maintenance'
                }"></span>
                <span class="status-label">{{ room.status | titlecase }}</span>
              </div>
            </div>
            
            <div class="card-footer">
              <button 
                class="btn btn-primary w-100" 
                [disabled]="room.status !== 'available'" 
                (click)="onBookClick(room)">
                {{ room.status === 'available' ? 'Book Room' : 'Unavailable' }}
              </button>
            </div>
          </div>
          
          <div *ngIf="rooms().length === 0" class="text-center py-4 w-100" style="color: var(--fg-muted);">
            No room listings registered for this branch yet.
          </div>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    .details-page {
      padding: 0 16px 40px 16px;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
      overflow-y: auto;
    }
    
    .logo-link {
      color: inherit;
    }
    .logo-link:hover {
      text-decoration: none;
    }
    
    .public-nav {
      height: 60px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      margin: 0 -16px 20px -16px;
      padding: 0 24px;
    }
    
    .public-nav .logo {
      font-size: 20px;
      font-weight: 700;
      color: var(--fg-primary);
    }
    
    .logo-sub {
      color: var(--primary-color);
      font-size: 14px;
      font-weight: 800;
      background: var(--primary-accent);
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 4px;
    }
    
    .nav-links {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .property-banner-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .banner-img-holder {
      width: 100%;
      height: 280px;
      overflow: hidden;
    }
    
    .banner-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .banner-info {
      padding: 24px;
    }
    
    .banner-info h1 {
      font-size: 28px;
      margin: 8px 0;
    }
    
    .location-text {
      color: var(--fg-muted);
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 12px;
    }
    
    .description-text {
      font-size: 14px;
      color: var(--fg-secondary);
      line-height: 1.6;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--fg-primary);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
      margin-top: 24px;
    }
    
    .room-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    
    .room-img-holder {
      width: 100%;
      height: 150px;
      overflow: hidden;
    }
    
    .room-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .room-pricing {
      font-size: 16px;
    }
    
    .room-status-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .bg-success { background-color: var(--success-color); }
    .bg-warning { background-color: var(--warning-color); }
    .bg-danger { background-color: var(--danger-color); }
    .bg-info { background-color: var(--info-color); }
    
    .status-label {
      color: var(--fg-secondary);
    }
    
    .card-footer {
      padding: 16px;
      border-top: 1px solid var(--border-muted);
      background-color: var(--bg-secondary);
    }
  `]
})
export class PublicDetailsComponent implements OnInit {
  private dbService = inject(MockDbService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  property = signal<Property | null>(null);
  rooms = signal<Entity[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadPropertyDetails(id);
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  private loadPropertyDetails(propertyId: string) {
    // 1. Fetch property
    this.dbService.getProperties().subscribe(list => {
      const found = list.find(p => p.id === propertyId);
      if (found) {
        this.property.set(found);
      } else {
        this.router.navigate(['/']);
      }
    });

    // 2. Fetch rooms in property
    this.dbService.getEntities().subscribe(list => {
      this.rooms.set(list.filter(e => e.propertyId === propertyId && e.type === 'room'));
    });
  }

  onBookClick(room: Entity) {
    const isAuthed = this.authService.isAuthenticated();
    if (isAuthed) {
      // Direct booking selection on storefront
      this.router.navigate(['/storefront'], {
        queryParams: { propertyId: room.propertyId, roomId: room.id }
      });
    } else {
      // Route to login and pass redirect details
      this.router.navigate(['/login'], {
        queryParams: { 
          redirectUrl: '/storefront',
          propertyId: room.propertyId,
          roomId: room.id
        }
      });
    }
  }
}
