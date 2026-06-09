import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MockDbService, Entity, KOTOrder, Invoice, Property } from '../../core/services/mock-db.service';
import { AuthService } from '../../core/services/auth.service';

interface StoreMenuItem {
  name: string;
  price: number;
  icon: string;
}

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="storefront-page">
      <!-- Premium guest header navbar -->
      <nav class="guest-nav">
        <div class="logo">Alaya <span class="badge badge-info">Storefront</span></div>
        <div class="nav-right">
          <span class="user-greeting" *ngIf="currentUser()">
            Hello, <strong>{{ currentUser()?.name }}</strong>
          </span>
          <button class="btn btn-sm btn-secondary" (click)="goToAdmin()" *ngIf="currentUser()?.role !== 'guest'">
            Go to Admin
          </button>
          <button class="btn btn-sm" (click)="toggleTheme()" title="Toggle Dark/Light Mode">Theme</button>
          <button class="btn btn-danger btn-sm" (click)="logout()">Sign Out</button>
        </div>
      </nav>

      <!-- Welcome Banner -->
      <div class="hero-section mb-3">
        <h1>Welcome to Alaya Premium Hospitality</h1>
        <p>Book rooms, order in-room dining, call taxi services, or request room cleaning at the click of a button.</p>
      </div>

      <!-- MAIN LAYOUT COLUMNS -->
      <div class="storefront-grid">
        
        <!-- LEFT COLUMN: Operations Menu & Forms -->
        <div class="storefront-main">
          <!-- Navigation Tabs -->
          <div class="store-tabs mb-3">
            <button class="store-tab-btn" [class.active]="activeSection() === 'rooms'" (click)="setSection('rooms')">
              🏨 Room Accommodations
            </button>
            <button class="store-tab-btn" [class.active]="activeSection() === 'dining'" (click)="setSection('dining')" [disabled]="!bookedRoomId()">
              🍛 In-Room Dining
            </button>
            <button class="store-tab-btn" [class.active]="activeSection() === 'services'" (click)="setSection('services')" [disabled]="!bookedRoomId()">
              🚕 Guest Services
            </button>
          </div>

          <!-- SECTION 1: ROOM BOOKING -->
          <div *ngIf="activeSection() === 'rooms'" class="card tab-card">
            <div class="card-header">
              <h3>Book a Room</h3>
            </div>
            <div class="card-body">
              <div *ngIf="bookedRoomId()" class="active-booking-banner alert alert-success">
                <h4>🎉 Active Reservation Confirmed!</h4>
                <p>You have booked <strong>{{ bookedRoomName() }}</strong>. Enjoy your stay!</p>
                <p>Use the Dining or Services tabs above to order directly to your room.</p>
              </div>

              <div *ngIf="!bookedRoomId()">
                <div class="form-group grid grid-2" style="gap: 16px;">
                  <div>
                    <label class="form-label">Check-In Date</label>
                    <input type="date" [(ngModel)]="checkInDate" class="form-control" />
                  </div>
                  <div>
                    <label class="form-label">Check-Out Date</label>
                    <input type="date" [(ngModel)]="checkOutDate" class="form-control" />
                  </div>
                </div>

                <div class="rooms-grid mt-3">
                  <div class="card room-card" *ngFor="let room of availableRooms()">
                    <div class="room-details">
                      <h4>{{ room.name }}</h4>
                      <span class="badge badge-info">{{ room.subtype }}</span>
                      <p class="price mt-2"><strong>\${{ room.price }}</strong> / night</p>
                    </div>
                    <button class="btn btn-primary btn-sm mt-3" (click)="bookRoom(room)">Book Now</button>
                  </div>
                  <div *ngIf="availableRooms().length === 0" class="text-center py-3 w-100" style="color: var(--fg-muted);">
                    All rooms are currently booked or undergoing maintenance.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 2: IN-ROOM DINING -->
          <div *ngIf="activeSection() === 'dining'" class="card tab-card">
            <div class="card-header">
              <h3>Order Food to {{ bookedRoomName() }}</h3>
            </div>
            <div class="card-body">
              <div class="dining-portal">
                <div class="dining-menu">
                  <div class="dining-item-card" *ngFor="let item of menuItems" (click)="addFoodToCart(item)">
                    <span class="icon">{{ item.icon }}</span>
                    <div class="info">
                      <span class="name">{{ item.name }}</span>
                      <span class="price">\${{ item.price }}</span>
                    </div>
                  </div>
                </div>

                <div class="dining-cart mt-3 pt-3" style="border-top: 1px dashed var(--border-color);" *ngIf="foodCart().length > 0">
                  <h4>Your Order Summary</h4>
                  <div class="cart-items mt-2">
                    <div class="cart-item mb-2" *ngFor="let c of foodCart(); let idx = index">
                      <span>{{ c.qty }}x {{ c.name }}</span>
                      <div class="cart-item-actions">
                        <button class="btn btn-sm btn-circle" (click)="adjustFoodQty(idx, -1)">-</button>
                        <button class="btn btn-sm btn-circle" (click)="adjustFoodQty(idx, 1)">+</button>
                        <strong>\${{ c.price * c.qty }}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="justify-between d-flex mt-3 mb-3">
                    <strong>Subtotal:</strong>
                    <strong>\${{ getFoodCartTotal() }}</strong>
                  </div>
                  <button class="btn btn-success w-100" (click)="submitDiningOrder()">
                    Place Order & Charge to Tab
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 3: SERVICES REQUESTS -->
          <div *ngIf="activeSection() === 'services'" class="card tab-card">
            <div class="card-header">
              <h3>Cab Requests & Amenities</h3>
            </div>
            <div class="card-body">
              <div class="services-list grid grid-2">
                
                <!-- Cab Booking Card -->
                <div class="card service-card">
                  <div class="card-header">
                    <h4>Airport Cab Pickup / Transfer</h4>
                  </div>
                  <div class="card-body">
                    <div class="form-group">
                      <label class="form-label">Select Cab Type</label>
                      <select class="form-control form-select" [(ngModel)]="selectedCabId">
                        <option value="" disabled selected>Available Cabs</option>
                        <option *ngFor="let cab of availableCabs()" [value]="cab.id">
                          {{ cab.name }} ({{ cab.subtype }}) - \${{ cab.price }}
                        </option>
                      </select>
                    </div>
                    <button class="btn btn-primary w-100" [disabled]="!selectedCabId" (click)="bookCab()">
                      Request Cab & Charge to Room
                    </button>
                  </div>
                </div>

                <!-- Housekeeping Towel Service -->
                <div class="card service-card">
                  <div class="card-header">
                    <h4>Housekeeping Towels & Cleans</h4>
                  </div>
                  <div class="card-body">
                    <p style="font-size: 13px; color: var(--fg-secondary); margin-bottom: 16px;">
                      Need fresh towels, sheets, or a complete room clean-up? Flag our attendants.
                    </p>
                    <button class="btn btn-warning w-100" (click)="requestHousekeeping()">
                      Request Room Clean / Towels
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Billing & Tab Checkout -->
        <div class="storefront-bill">
          <div class="card bill-card">
            <div class="card-header">
              <h3>My Account Tab Summary</h3>
            </div>
            <div class="card-body">
              <div *ngIf="!bookedRoomId()" class="text-center py-4" style="color: var(--fg-muted);">
                No active room booking. Choose a room to open an account tab.
              </div>

              <div *ngIf="bookedRoomId()">
                <!-- Bill items -->
                <div class="bill-details">
                  <div class="bill-row header">
                    <span>Description</span>
                    <span>Cost</span>
                  </div>
                  <div class="bill-row" *ngFor="let item of activeInvoice()?.items">
                    <span>{{ item.description }}</span>
                    <span>\${{ item.amount }}</span>
                  </div>
                  <div class="bill-row total mt-3 pt-3">
                    <strong>Account Balance:</strong>
                    <strong>\${{ activeInvoice()?.total }}</strong>
                  </div>
                </div>

                <!-- Payment form -->
                <div class="payment-gateway mt-4 pt-3" style="border-top: 1px solid var(--border-color);" *ngIf="activeInvoice()?.total! > 0">
                  <h4>Checkout & Settle Account</h4>
                  <form (ngSubmit)="checkoutAndPay()">
                    <div class="form-group mt-2">
                      <label class="form-label" style="font-size: 11px;">Card Holder Name</label>
                      <input type="text" class="form-control form-control-sm" required placeholder="John Guest" />
                    </div>
                    <div class="form-group">
                      <label class="form-label" style="font-size: 11px;">Credit Card Number</label>
                      <input type="text" class="form-control form-control-sm" required placeholder="4000 1234 5678 9010" />
                    </div>
                    <div class="form-group grid grid-2" style="gap: 8px; margin-bottom: 12px;">
                      <div>
                        <label class="form-label" style="font-size: 11px;">Expiry</label>
                        <input type="text" class="form-control form-control-sm" required placeholder="MM/YY" />
                      </div>
                      <div>
                        <label class="form-label" style="font-size: 11px;">CVV</label>
                        <input type="password" class="form-control form-control-sm" required placeholder="123" />
                      </div>
                    </div>
                    <button type="submit" class="btn btn-success w-100">
                      Settle Balance & Check Out
                    </button>
                  </form>
                </div>
                <div *ngIf="activeInvoice()?.total === 0" class="text-center alert alert-success mt-3">
                  No pending charges. Account is settled!
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .storefront-page {
      padding: 0 16px 40px 16px;
      background-color: var(--bg-secondary);
      min-height: 100vh;
      overflow-y: auto;
    }
    
    .guest-nav {
      height: 60px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      margin: 0 -16px 20px -16px;
      padding: 0 24px;
    }
    
    .guest-nav .logo {
      font-size: 20px;
      font-weight: 700;
      color: var(--fg-primary);
    }
    
    .nav-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .user-greeting {
      font-size: 13px;
      color: var(--fg-secondary);
    }
    
    .hero-section {
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin-bottom: 24px;
    }
    
    .hero-section h1 {
      font-size: 26px;
      color: var(--fg-primary);
      margin-bottom: 8px;
    }
    
    .hero-section p {
      font-size: 14px;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .storefront-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }
    
    @media (max-width: 900px) {
      .storefront-grid {
        grid-template-columns: 1fr;
      }
    }
    
    /* Tabs styling */
    .store-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 4px;
    }
    
    .store-tab-btn {
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-bottom: none;
      color: var(--fg-secondary);
      border-radius: 6px 6px 0 0;
      cursor: pointer;
    }
    
    .store-tab-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .store-tab-btn.active {
      background-color: var(--primary-accent);
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
    
    /* Room Cards */
    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
    }
    
    .room-card {
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .room-card h4 {
      margin-bottom: 4px;
    }
    
    .price {
      font-size: 15px;
    }
    
    /* Dining List */
    .dining-menu {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px;
      max-height: 250px;
      overflow-y: auto;
      padding: 4px;
    }
    
    .dining-item-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    
    .dining-item-card:hover {
      border-color: var(--primary-color);
      background-color: var(--primary-accent);
    }
    
    .dining-item-card .icon {
      font-size: 20px;
    }
    
    .dining-item-card .name {
      display: block;
      font-weight: 600;
      font-size: 11px;
      color: var(--fg-primary);
    }
    
    .dining-item-card .price {
      font-size: 10px;
      color: var(--fg-secondary);
    }
    
    .cart-item-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* Bill View */
    .bill-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .bill-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--fg-secondary);
    }
    
    .bill-row.header {
      font-weight: 600;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 6px;
      color: var(--fg-primary);
    }
    
    .bill-row.total {
      font-size: 15px;
      color: var(--fg-primary);
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class StorefrontComponent implements OnInit {
  private dbService = inject(MockDbService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  currentUser = this.authService.currentUser;
  activeSection = signal<'rooms' | 'dining' | 'services'>('rooms');
  
  // Master lists
  availableRooms = signal<Entity[]>([]);
  availableCabs = signal<Entity[]>([]);
  invoices = signal<Invoice[]>([]);

  // User active booking status
  bookedRoomId = signal<string>('');
  bookedRoomName = signal<string>('');
  activeInvoice = signal<Invoice | null>(null);

  // Form states
  checkInDate = '';
  checkOutDate = '';
  selectedCabId = '';

  // Dining state
  foodCart = signal<Array<StoreMenuItem & { qty: number }>>([]);
  menuItems: StoreMenuItem[] = [
    { name: 'Lobster Thermidor', price: 28, icon: '🦞' },
    { name: 'Butter Chicken Grand', price: 18, icon: '🍛' },
    { name: 'Garlic Butter Naan', price: 4, icon: '🫓' },
    { name: 'Margherita Pizza', price: 14, icon: '🍕' },
    { name: 'Caesar Salad', price: 10, icon: '🥗' },
    { name: 'Chardonnay Wine Glass', price: 12, icon: '🍷' },
    { name: 'Tiramisu Classical', price: 10, icon: '🍮' }
  ];

  ngOnInit() {
    this.loadData();
    this.initializeDates();
    this.restoreGuestBooking();

    // Catch redirects from the public property details page
    this.route.queryParams.subscribe(params => {
      const propId = params['propertyId'];
      const roomId = params['roomId'];
      if (propId && roomId) {
        setTimeout(() => {
          const room = this.availableRooms().find(r => r.id === roomId);
          if (room && room.status === 'available') {
            this.bookRoom(room);
            // Clear query parameters from URL
            this.router.navigate([], { queryParams: {} });
          }
        }, 400);
      }
    });
  }

  private loadData() {
    this.dbService.getEntities().subscribe(list => {
      this.availableRooms.set(list.filter(e => e.type === 'room' && e.status === 'available'));
      this.availableCabs.set(list.filter(e => e.type === 'cab' && e.status === 'available'));
    });
    this.dbService.getInvoices().subscribe(list => {
      this.invoices.set(list);
      this.syncActiveInvoice();
    });
  }

  private initializeDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.checkInDate = today.toISOString().split('T')[0];
    this.checkOutDate = tomorrow.toISOString().split('T')[0];
  }

  private restoreGuestBooking() {
    // Read local cache to see if guest already booked a room in this browser session
    const room = localStorage.getItem('storefront_booked_room');
    if (room) {
      const parsed = JSON.parse(room);
      this.bookedRoomId.set(parsed.id);
      this.bookedRoomName.set(parsed.name);
      this.syncActiveInvoice();
    }
  }

  setSection(sec: 'rooms' | 'dining' | 'services') {
    this.activeSection.set(sec);
  }

  bookRoom(room: Entity) {
    if (this.bookedRoomId()) return;

    // 1. Mark room as occupied in state
    this.dbService.updateEntityStatus(room.id, 'occupied').subscribe();

    // 2. Generate initial invoice tab
    const guestUser = this.currentUser();
    const guestName = guestUser ? guestUser.name : 'Web Guest';
    const guestEmail = guestUser ? guestUser.email : 'guest@alaya.com';

    // Calculate days count
    const d1 = new Date(this.checkInDate);
    const d2 = new Date(this.checkOutDate);
    const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    const roomCharge = room.price * nights;

    const invoiceData = {
      guestName,
      guestEmail,
      entityId: room.id,
      entityName: room.name,
      items: [
        { description: `${room.name} Stay Accommodation (${nights} nights)`, amount: roomCharge }
      ],
      total: roomCharge,
      status: 'unpaid' as const
    };

    this.dbService.createInvoice(invoiceData).subscribe(newInv => {
      this.bookedRoomId.set(room.id);
      this.bookedRoomName.set(room.name);
      
      localStorage.setItem('storefront_booked_room', JSON.stringify({ id: room.id, name: room.name }));
      
      this.loadData();
      alert(`Room ${room.name} booked successfully! Account Tab created.`);
      this.setSection('dining'); // Guide them to dining
    });
  }

  // Dining ordering
  addFoodToCart(item: StoreMenuItem) {
    const existing = this.foodCart().find(f => f.name === item.name);
    if (existing) {
      existing.qty++;
      this.foodCart.update(list => [...list]);
    } else {
      this.foodCart.update(list => [...list, { ...item, qty: 1 }]);
    }
  }

  adjustFoodQty(idx: number, diff: number) {
    const item = this.foodCart()[idx];
    item.qty += diff;
    if (item.qty <= 0) {
      this.foodCart.update(list => list.filter((_, i) => i !== idx));
    } else {
      this.foodCart.update(list => [...list]);
    }
  }

  getFoodCartTotal(): number {
    return this.foodCart().reduce((sum, item) => sum + (item.price * item.qty), 0);
  }

  submitDiningOrder() {
    const inv = this.activeInvoice();
    if (!inv || !this.bookedRoomId()) return;

    // 1. Create a Kitchen Order Ticket (KOT)
    this.dbService.createKOTOrder({
      propertyId: 'prop-2', // Alaya Bistro
      entityId: this.bookedRoomId(),
      entityName: this.bookedRoomName(),
      items: this.foodCart().map(f => ({ name: f.name, qty: f.qty })),
      status: 'pending'
    }).subscribe(() => {
      // 2. Append charges to guest invoice tab
      const foodTotal = this.getFoodCartTotal();
      const newItems = [
        ...inv.items,
        ...this.foodCart().map(f => ({ description: `In-room Dining: ${f.qty}x ${f.name}`, amount: f.price * f.qty }))
      ];

      // Update invoice directly in simulated db (creating a mock update)
      // For demo, we pay/overwrite invoice inside list
      const updatedInvoice = {
        ...inv,
        items: newItems,
        total: inv.total + foodTotal
      };
      
      // Save back to dbService
      // Mock db handles invoices via signals, we can re-create or edit
      const allInvoices = JSON.parse(localStorage.getItem('alaya_pms_invoices') || '[]');
      const index = allInvoices.findIndex((i: any) => i.id === inv.id);
      if (index !== -1) {
        allInvoices[index] = updatedInvoice;
        localStorage.setItem('alaya_pms_invoices', JSON.stringify(allInvoices));
      }

      this.foodCart.set([]);
      this.loadData();
      alert('Your dining order was sent to the kitchen! Charged to your room bill.');
    });
  }

  // Cab Request
  bookCab() {
    const inv = this.activeInvoice();
    const cab = this.availableCabs().find(c => c.id === this.selectedCabId);
    if (!inv || !cab) return;

    // 1. Mark Cab occupied
    this.dbService.updateEntityStatus(cab.id, 'occupied').subscribe();

    // 2. Add cab charge to room invoice
    const updatedInvoice = {
      ...inv,
      items: [...inv.items, { description: `Taxi Transfer Request: ${cab.name} (${cab.subtype})`, amount: cab.price }],
      total: inv.total + cab.price
    };

    const allInvoices = JSON.parse(localStorage.getItem('alaya_pms_invoices') || '[]');
    const index = allInvoices.findIndex((i: any) => i.id === inv.id);
    if (index !== -1) {
      allInvoices[index] = updatedInvoice;
      localStorage.setItem('alaya_pms_invoices', JSON.stringify(allInvoices));
    }

    this.selectedCabId = '';
    this.loadData();
    alert(`Cab request sent! ${cab.name} has been dispatched to pick you up. Charged \$${cab.price} to room.`);
  }

  // Housekeeping Towel request
  requestHousekeeping() {
    if (!this.bookedRoomId()) return;

    // Insert dirty housekeeping task
    this.dbService.createHousekeepingTask(this.bookedRoomId(), this.bookedRoomName()).subscribe(() => {
      alert('Housekeeper service request sent! An attendant will visit shortly.');
    });
  }

  // Checkout Pay Tab
  checkoutAndPay() {
    const inv = this.activeInvoice();
    if (!inv) return;

    this.dbService.payInvoice(inv.id).subscribe(() => {
      // Clear session booking
      this.bookedRoomId.set('');
      this.bookedRoomName.set('');
      localStorage.removeItem('storefront_booked_room');
      
      this.loadData();
      alert('Payment approved! Invoice settled. Thank you for staying at Alaya Grand Plaza!');
      this.setSection('rooms');
    });
  }

  private syncActiveInvoice() {
    if (!this.bookedRoomId()) {
      this.activeInvoice.set(null);
      return;
    }
    const inv = this.invoices().find(i => i.entityId === this.bookedRoomId() && i.status === 'unpaid');
    this.activeInvoice.set(inv || null);
  }

  toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('dark-theme');
    if (isDark) {
      body.classList.remove('dark-theme');
      localStorage.setItem('alaya_pms_theme', 'light');
    } else {
      body.classList.add('dark-theme');
      localStorage.setItem('alaya_pms_theme', 'dark');
    }
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  logout() {
    this.authService.logout().subscribe(() => {
      localStorage.removeItem('storefront_booked_room');
      this.router.navigate(['/login']);
    });
  }
}
