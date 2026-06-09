import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MockDbService, Property } from '../../core/services/mock-db.service';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="landing-page">
      <!-- Public Header Navbar -->
      <nav class="public-nav">
        <div class="logo">Alaya <span class="logo-sub">Hospitality</span></div>
        <div class="nav-links">
          <button class="icon-btn theme-toggle" (click)="toggleTheme()" [title]="isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <svg *ngIf="!isDark()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            <svg *ngIf="isDark()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          </button>
          <a routerLink="/login" class="btn btn-primary">Staff Portal Login</a>
        </div>
      </nav>

      <!-- Welcome Hero Section -->
      <div class="hero-section mb-3">
        <h1>Find Your Next Stay with Alaya</h1>
        <p>Browse our handpicked luxury hotels, coastal dining kitchens, and mountain retreats. Unparalleled comfort meets seamless digital guest services.</p>
      </div>

      <!-- Properties Grid -->
      <div class="properties-container">
        <h2 class="section-title mb-3">Our Featured Branches</h2>
        <div class="grid grid-3">
          <div class="card property-card" *ngFor="let prop of properties()">
            <div class="card-img-holder" *ngIf="prop.imageUrl">
              <img [src]="prop.imageUrl" alt="{{ prop.name }}" class="prop-img" />
              <span class="badge prop-type" [ngClass]="{
                'badge-info': prop.type === 'hotel',
                'badge-success': prop.type === 'restaurant',
                'badge-warning': prop.type === 'resort',
                'badge-danger': prop.type === 'other'
              }">{{ prop.type | uppercase }}</span>
            </div>
            
            <div class="card-body">
              <h3 class="prop-title">{{ prop.name }}</h3>
              <p class="prop-location">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {{ prop.location }}
              </p>
              <p class="prop-desc">{{ prop.description }}</p>
            </div>
            
            <div class="card-footer">
              <button class="btn btn-primary w-100" (click)="viewDetails(prop.id)">
                Explore Rooms & Services
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    .landing-page {
      padding: 0 16px 40px 16px;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
      overflow-y: auto;
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
    
    .hero-section {
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .hero-section h1 {
      font-size: 32px;
      color: var(--fg-primary);
      margin-bottom: 12px;
    }
    
    .hero-section p {
      font-size: 15px;
      max-width: 700px;
      margin: 0 auto;
      line-height: 1.6;
    }
    
    .section-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--fg-primary);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }
    
    .property-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    
    .property-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .card-img-holder {
      position: relative;
      width: 100%;
      height: 180px;
      overflow: hidden;
    }
    
    .prop-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .prop-type {
      position: absolute;
      top: 12px;
      left: 12px;
      font-size: 11px;
      box-shadow: var(--shadow-sm);
    }
    
    .prop-title {
      font-size: 16px;
      margin-bottom: 4px;
      color: var(--fg-primary);
    }
    
    .prop-location {
      font-size: 12px;
      color: var(--fg-muted);
      margin-bottom: 12px;
    }
    
    .prop-desc {
      font-size: 13px;
      color: var(--fg-secondary);
      line-height: 1.5;
    }
    
    .card-footer {
      padding: 16px;
      border-top: 1px solid var(--border-muted);
      background-color: var(--bg-secondary);
    }
  `]
})
export class PublicLandingComponent implements OnInit {
  private dbService = inject(MockDbService);
  private router = inject(Router);

  properties = signal<Property[]>([]);
  isDark = signal<boolean>(false);

  ngOnInit() {
    this.dbService.getProperties().subscribe(list => {
      this.properties.set(list);
    });

    if (typeof window !== 'undefined') {
      const dark = document.body.classList.contains('dark-theme');
      this.isDark.set(dark);
    }
  }

  viewDetails(propertyId: string) {
    this.router.navigate(['/property', propertyId]);
  }

  toggleTheme() {
    this.isDark.update(val => {
      const next = !val;
      if (typeof document !== 'undefined') {
        const body = document.body;
        if (next) {
          body.classList.add('dark-theme');
          localStorage.setItem('alaya_pms_theme', 'dark');
        } else {
          body.classList.remove('dark-theme');
          localStorage.setItem('alaya_pms_theme', 'light');
        }
      }
      return next;
    });
  }
}
