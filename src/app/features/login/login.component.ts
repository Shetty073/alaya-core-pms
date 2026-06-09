import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card card">
        <div class="login-header">
          <div class="logo">Alaya Core <span class="logo-sub">PMS</span></div>
          <p class="subtitle">Property Management & Hospitality ERP</p>
        </div>
        
        <div class="card-body">
          <div *ngIf="errorMsg()" class="alert alert-danger">
            {{ errorMsg() }}
          </div>

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label" for="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                [(ngModel)]="email" 
                class="form-control" 
                placeholder="e.g. admin@alaya.com"
                required />
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                [(ngModel)]="password" 
                class="form-control" 
                placeholder="Enter password"
                required />
            </div>

            <button type="submit" [disabled]="loading()" class="btn btn-primary w-100 mt-2">
              <span *ngIf="loading()">Authenticating...</span>
              <span *ngIf="!loading()">Sign In</span>
            </button>
          </form>

          <!-- Quick Autofill Demo section -->
          <div class="demo-helpers">
            <div class="divider">
              <span>Demo Quick-Fills</span>
            </div>
            <div class="demo-buttons">
              <button type="button" class="btn btn-sm" (click)="fillDemo('admin@alaya.com')">Admin / Owner</button>
              <button type="button" class="btn btn-sm" (click)="fillDemo('chef@alaya.com')">Chef / Kitchen</button>
              <button type="button" class="btn btn-sm" (click)="fillDemo('housekeeper@alaya.com')">Housekeeping</button>
              <button type="button" class="btn btn-sm" (click)="fillDemo('guest@alaya.com')">Guest Storefront</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: var(--bg-secondary);
      padding: 16px;
    }
    
    .login-card {
      width: 100%;
      max-width: 420px;
      background-color: var(--bg-primary);
      padding: 8px;
    }
    
    .login-header {
      padding: 24px 16px 12px 16px;
      text-align: center;
      border-bottom: 1px solid var(--border-muted);
    }
    
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: var(--fg-primary);
    }
    
    .logo-sub {
      color: var(--primary-color);
      font-size: 16px;
      font-weight: 800;
      background: var(--primary-accent);
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 4px;
    }
    
    .subtitle {
      font-size: 13px;
      color: var(--fg-muted);
      margin-top: 6px;
    }
    
    .alert {
      padding: 10px 14px;
      font-size: 13px;
      border-radius: var(--border-radius);
      margin-bottom: 16px;
      border: 1px solid transparent;
    }
    
    .alert-danger {
      color: var(--danger-color);
      background-color: var(--danger-bg);
      border-color: var(--danger-border);
    }
    
    .demo-helpers {
      margin-top: 24px;
    }
    
    .divider {
      position: relative;
      text-align: center;
      margin-bottom: 16px;
    }
    
    .divider::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background-color: var(--border-color);
      z-index: 1;
    }
    
    .divider span {
      position: relative;
      background-color: var(--bg-primary);
      padding: 0 10px;
      z-index: 2;
      font-size: 11px;
      color: var(--fg-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .demo-buttons {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    
    .demo-buttons button {
      font-size: 11px;
      text-align: center;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMsg = signal<string | null>(null);
  loading = signal<boolean>(false);

  fillDemo(email: string) {
    this.email = email;
    this.password = 'password123'; // prefill standard mock password
    this.errorMsg.set(null);
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMsg.set('Please enter both email and password.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.loading.set(false);
        // Redirect based on role
        if (user.role === 'guest') {
          this.router.navigate(['/storefront']);
        } else if (user.role === 'chef') {
          this.router.navigate(['/admin/kot']);
        } else if (user.role === 'housekeeper') {
          this.router.navigate(['/admin/housekeeping']);
        } else {
          this.router.navigate(['/admin']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.message || 'Authentication failed.');
      }
    });
  }
}
