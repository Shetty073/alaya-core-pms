import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { PropertiesComponent } from './features/admin/properties/properties.component';
import { EntitiesComponent } from './features/admin/entities/entities.component';
import { KotComponent } from './features/admin/kot/kot.component';
import { InventoryComponent } from './features/admin/inventory/inventory.component';
import { StaffComponent } from './features/admin/staff/staff.component';
import { HousekeepingComponent } from './features/admin/housekeeping/housekeeping.component';
import { FinanceComponent } from './features/admin/finance/finance.component';
import { StorefrontComponent } from './features/storefront/storefront.component';
import { PublicLandingComponent } from './features/public-landing/public-landing.component';
import { PublicDetailsComponent } from './features/public-details/public-details.component';
import { CheckInOutComponent } from './features/admin/check-in-out/check-in-out.component';
import { RestaurantBillingComponent } from './features/admin/restaurant-billing/restaurant-billing.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: PublicLandingComponent },
  { path: 'property/:id', component: PublicDetailsComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        component: DashboardComponent,
        canActivate: [authGuard],
        data: { roles: ['admin', 'receptionist'] }
      },
      { 
        path: 'check-in-out', 
        component: CheckInOutComponent,
        canActivate: [authGuard],
        data: { roles: ['admin', 'receptionist'] }
      },
      { 
        path: 'restaurant-billing', 
        component: RestaurantBillingComponent,
        canActivate: [authGuard],
        data: { roles: ['admin', 'biller'] }
      },
      { 
        path: 'properties', 
        component: PropertiesComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] }
      },
      { 
        path: 'entities', 
        component: EntitiesComponent,
        canActivate: [authGuard],
        data: { roles: ['admin', 'receptionist'] }
      },
      { 
        path: 'kot', 
        component: KotComponent,
        canActivate: [authGuard],
        data: { roles: ['admin', 'chef', 'captain', 'biller'] }
      },
      { 
        path: 'inventory', 
        component: InventoryComponent,
        canActivate: [authGuard],
        data: { roles: ['admin', 'chef'] }
      },
      { 
        path: 'staff', 
        component: StaffComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] }
      },
      { 
        path: 'housekeeping', 
        component: HousekeepingComponent,
        canActivate: [authGuard],
        data: { roles: ['admin', 'housekeeper'] }
      },
      { 
        path: 'finance', 
        component: FinanceComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] }
      }
    ]
  },
  { 
    path: 'storefront', 
    component: StorefrontComponent,
    canActivate: [authGuard],
    data: { roles: ['guest', 'admin', 'receptionist'] }
  },
  { path: '**', redirectTo: '' }
];
