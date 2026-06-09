import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { Staff, MockDbService } from './mock-db.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<Staff | null>(null);
  
  // Expose signals for high-performance reactive template bindings
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly currentRole = computed(() => this.currentUserSignal()?.role || null);

  constructor(private dbService: MockDbService) {
    this.restoreSession();
  }

  private restoreSession() {
    const saved = localStorage.getItem('alaya_pms_auth');
    if (saved) {
      this.currentUserSignal.set(JSON.parse(saved));
    }
  }

  login(email: string, password: string): Observable<Staff> {
    const normalizedEmail = email.toLowerCase().trim();
    
    return this.dbService.getStaff().pipe(
      switchMap(staff => {
        const matchedUser = staff.find(s => s.email === normalizedEmail);
        if (!matchedUser) {
          return throwError(() => new Error('User not found. Try admin@alaya.com, chef@alaya.com, housekeeper@alaya.com, or guest@alaya.com'));
        }

        if (password.length < 4) {
          return throwError(() => new Error('Password must be at least 4 characters long'));
        }

        this.currentUserSignal.set(matchedUser);
        localStorage.setItem('alaya_pms_auth', JSON.stringify(matchedUser));
        return of(matchedUser);
      }),
      delay(250)
    );
  }

  logout(): Observable<boolean> {
    this.currentUserSignal.set(null);
    localStorage.removeItem('alaya_pms_auth');
    return of(true).pipe(delay(100));
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;
    return roles.includes(user.role);
  }

  getCurrentUser(): Observable<Staff | null> {
    return of(this.currentUserSignal());
  }
}
