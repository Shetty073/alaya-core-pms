import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If not authenticated, redirect to login
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Retrieve allowed roles for the route
  const expectedRoles = route.data['roles'] as Array<'admin' | 'receptionist' | 'chef' | 'housekeeper' | 'driver' | 'guest'>;

  // If no specific roles are defined, allow access
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  const userRole = authService.currentRole();
  
  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  // Redirect to their default view if unauthorized
  if (userRole === 'guest') {
    router.navigate(['/storefront']);
  } else if (userRole === 'chef') {
    router.navigate(['/admin/kot']);
  } else if (userRole === 'housekeeper') {
    router.navigate(['/admin/housekeeping']);
  } else {
    router.navigate(['/admin']);
  }

  return false;
};
