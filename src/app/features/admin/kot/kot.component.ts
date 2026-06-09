import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService, KOTOrder, KOTItem, Entity, Property } from '../../../core/services/mock-db.service';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  name: string;
  category: string;
  price: number;
  icon: string;
}

@Component({
  selector: 'app-kot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kot-page">
      <!-- Title Bar -->
      <div class="page-header justify-between mb-3 d-flex align-items-center">
        <div>
          <h2>Kitchen Order Ticket (KOT) System</h2>
          <p>Integrated waiter ordering portal and digital kitchen display board.</p>
        </div>
        <!-- Mode Switcher (Waiter vs Kitchen view) -->
        <div class="view-switch">
          <button class="btn" [class.btn-primary]="activeView() === 'kitchen'" (click)="setView('kitchen')">
            Kitchen Monitor
          </button>
          <button class="btn" [class.btn-primary]="activeView() === 'waiter'" (click)="setView('waiter')" *ngIf="userRole() !== 'chef'">
            Waiter Order Entry
          </button>
        </div>
      </div>

      <!-- WAITER ORDER ENTRY PORTAL -->
      <div *ngIf="activeView() === 'waiter'" class="waiter-portal">
        <div class="portal-grid">
          <!-- Left side: Menu items grid -->
          <div class="menu-section">
            <div class="card mb-3">
              <div class="card-header">
                <h3>Menu Items</h3>
                <div class="category-filters">
                  <button class="btn btn-sm" [class.btn-primary]="selectedCategory() === 'all'" (click)="setCategory('all')">All</button>
                  <button class="btn btn-sm" [class.btn-primary]="selectedCategory() === 'food'" (click)="setCategory('food')">Food</button>
                  <button class="btn btn-sm" [class.btn-primary]="selectedCategory() === 'beverage'" (click)="setCategory('beverage')">Beverages</button>
                  <button class="btn btn-sm" [class.btn-primary]="selectedCategory() === 'dessert'" (click)="setCategory('dessert')">Desserts</button>
                </div>
              </div>
              <div class="card-body menu-grid">
                <div class="menu-item-card" *ngFor="let item of filteredMenuItems()" (click)="addToCart(item)">
                  <div class="item-icon">{{ item.icon }}</div>
                  <div class="item-details">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-price">\${{ item.price }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right side: Table Selection and Cart Order -->
          <div class="order-section">
            <div class="card">
              <div class="card-header">
                <h3>Current Order</h3>
              </div>
              <div class="card-body">
                <!-- Select Table / Room -->
                <div class="form-group">
                  <label class="form-label">Dining Table / Guest Room</label>
                  <select class="form-control form-select" [(ngModel)]="orderEntityId">
                    <option value="" disabled selected>Select Target Location</option>
                    <optgroup label="Restaurant Tables">
                      <option *ngFor="let t of tables()" [value]="t.id">{{ t.name }} ({{ t.subtype }})</option>
                    </optgroup>
                    <optgroup label="Guest Rooms">
                      <option *ngFor="let r of rooms()" [value]="r.id">{{ r.name }} ({{ r.subtype }})</option>
                    </optgroup>
                  </select>
                </div>

                <!-- Cart Items List -->
                <div class="cart-items">
                  <div class="cart-item" *ngFor="let c of cart(); let idx = index">
                    <div class="cart-item-name">
                      <strong>{{ c.name }}</strong>
                      <input type="text" placeholder="Add kitchen notes..." class="form-control form-control-sm notes-input" [(ngModel)]="c.notes" />
                    </div>
                    <div class="cart-item-qty">
                      <button class="btn btn-sm btn-circle" (click)="adjustQty(idx, -1)">-</button>
                      <span class="qty-label">{{ c.qty }}</span>
                      <button class="btn btn-sm btn-circle" (click)="adjustQty(idx, 1)">+</button>
                    </div>
                    <div class="cart-item-total">
                      \${{ getCartItemTotal(c) }}
                    </div>
                  </div>
                  <div *ngIf="cart().length === 0" class="text-center py-4" style="color: var(--fg-muted);">
                    Cart is empty. Click menu items to add.
                  </div>
                </div>

                <!-- Total and Action -->
                <div class="cart-totals mt-3 pt-3" *ngIf="cart().length > 0">
                  <div class="justify-between d-flex mb-3">
                    <strong>Total Amount:</strong>
                    <strong>\${{ getCartTotal() }}</strong>
                  </div>
                  <button class="btn btn-success w-100" (click)="submitOrder()">
                    Send Order to Kitchen (KOT)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- KITCHEN MONITOR DISPLAY BOARD -->
      <div *ngIf="activeView() === 'kitchen'" class="kitchen-board">
        <div class="kanban-grid">
          <!-- Columns -->

          <!-- COLUMN 1: PENDING -->
          <div class="kanban-col">
            <div class="column-title">
              <span class="dot bg-warning"></span>
              <h3>Incoming Orders ({{ getOrdersByStatus('pending').length }})</h3>
            </div>
            <div class="order-cards-list">
              <div class="card order-ticket-card border-warning" *ngFor="let order of getOrdersByStatus('pending')">
                <div class="ticket-header">
                  <strong>ID: {{ order.id }}</strong>
                  <span class="time">{{ getMinutesAgo(order.timestamp) }}m ago</span>
                </div>
                <div class="ticket-body">
                  <h4>Destination: {{ order.entityName }}</h4>
                  <ul class="ticket-items">
                    <li *ngFor="let item of order.items">
                      <span class="qty">{{ item.qty }}x</span> {{ item.name }}
                      <div class="notes" *ngIf="item.notes">Note: "{{ item.notes }}"</div>
                    </li>
                  </ul>
                </div>
                <div class="ticket-footer">
                  <button class="btn btn-sm btn-primary w-100" (click)="updateOrderStatus(order.id, 'preparing')">
                    Start Preparing
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- COLUMN 2: PREPARING -->
          <div class="kanban-col">
            <div class="column-title">
              <span class="dot bg-info"></span>
              <h3>In Preparation ({{ getOrdersByStatus('preparing').length }})</h3>
            </div>
            <div class="order-cards-list">
              <div class="card order-ticket-card border-info" *ngFor="let order of getOrdersByStatus('preparing')">
                <div class="ticket-header">
                  <strong>ID: {{ order.id }}</strong>
                  <span class="time">{{ getMinutesAgo(order.timestamp) }}m ago</span>
                </div>
                <div class="ticket-body">
                  <h4>Destination: {{ order.entityName }}</h4>
                  <ul class="ticket-items">
                    <li *ngFor="let item of order.items">
                      <span class="qty">{{ item.qty }}x</span> {{ item.name }}
                      <div class="notes" *ngIf="item.notes">Note: "{{ item.notes }}"</div>
                    </li>
                  </ul>
                </div>
                <div class="ticket-footer">
                  <button class="btn btn-sm btn-success w-100" (click)="updateOrderStatus(order.id, 'ready')">
                    Mark Food Ready
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- COLUMN 3: READY -->
          <div class="kanban-col">
            <div class="column-title">
              <span class="dot bg-success"></span>
              <h3>Ready for Pickup ({{ getOrdersByStatus('ready').length }})</h3>
            </div>
            <div class="order-cards-list">
              <div class="card order-ticket-card border-success" *ngFor="let order of getOrdersByStatus('ready')">
                <div class="ticket-header">
                  <strong>ID: {{ order.id }}</strong>
                  <span class="time">{{ getMinutesAgo(order.timestamp) }}m ago</span>
                </div>
                <div class="ticket-body">
                  <h4>Destination: {{ order.entityName }}</h4>
                  <ul class="ticket-items">
                    <li *ngFor="let item of order.items">
                      <span class="qty">{{ item.qty }}x</span> {{ item.name }}
                    </li>
                  </ul>
                </div>
                <div class="ticket-footer">
                  <button class="btn btn-sm btn-success w-100" (click)="updateOrderStatus(order.id, 'served')">
                    Deliver & Serve
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .kot-page {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .view-switch {
      display: flex;
      gap: 8px;
    }
    
    /* Waiter portal grid layout */
    .waiter-portal {
      animation: fadeIn 0.15s ease-out;
    }
    
    .portal-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 24px;
    }
    
    @media (max-width: 900px) {
      .portal-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .category-filters {
      display: flex;
      gap: 6px;
    }
    
    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 12px;
      max-height: 500px;
      overflow-y: auto;
      padding: 12px;
    }
    
    .menu-item-card {
      border: 1px solid var(--border-color);
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius);
      padding: 12px;
      text-align: center;
      cursor: pointer;
      user-select: none;
      transition: all 0.1s ease;
    }
    
    .menu-item-card:hover {
      border-color: var(--primary-color);
      background-color: var(--primary-accent);
      transform: translateY(-1px);
    }
    
    .item-icon {
      font-size: 24px;
      margin-bottom: 6px;
    }
    
    .item-name {
      display: block;
      font-weight: 600;
      font-size: 12px;
      color: var(--fg-primary);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    
    .item-price {
      font-size: 11px;
      color: var(--fg-secondary);
    }
    
    /* Cart Layout */
    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 320px;
      overflow-y: auto;
      border-bottom: 1px solid var(--border-muted);
      padding-bottom: 16px;
    }
    
    .cart-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    
    .cart-item-name {
      flex: 1;
      font-size: 13px;
    }
    
    .notes-input {
      font-size: 10px;
      margin-top: 4px;
      padding: 2px 6px;
      height: 20px;
    }
    
    .cart-item-qty {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .btn-circle {
      width: 24px;
      height: 24px;
      padding: 0;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .qty-label {
      font-weight: 600;
      min-width: 16px;
      text-align: center;
    }
    
    .cart-item-total {
      font-weight: 600;
      font-size: 13px;
      min-width: 50px;
      text-align: right;
    }
    
    .cart-totals {
      font-size: 14px;
    }
    
    /* Kitchen display board kanban view */
    .kitchen-board {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: fadeIn 0.15s ease-out;
    }
    
    .kanban-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      height: 100%;
      overflow-y: auto;
      padding-bottom: 24px;
    }
    
    @media (max-width: 900px) {
      .kanban-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .kanban-col {
      display: flex;
      flex-direction: column;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      height: 550px;
      overflow: hidden;
    }
    
    .column-title {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: var(--bg-secondary);
    }
    
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .order-cards-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .order-ticket-card {
      border-left: 4px solid var(--border-color);
      padding: 12px;
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius);
    }
    
    .border-warning { border-left-color: var(--warning-color); }
    .border-info { border-left-color: var(--info-color); }
    .border-success { border-left-color: var(--success-color); }
    
    .ticket-header {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--fg-muted);
      border-bottom: 1px dashed var(--border-color);
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    
    .ticket-body h4 {
      font-size: 13px;
      margin-bottom: 8px;
    }
    
    .ticket-items {
      list-style: none;
      font-size: 13px;
      padding-left: 0;
    }
    
    .ticket-items li {
      margin-bottom: 6px;
    }
    
    .qty {
      font-weight: 700;
      color: var(--primary-color);
    }
    
    .notes {
      font-size: 10px;
      color: var(--warning-color);
      font-style: italic;
      margin-top: 2px;
    }
    
    .ticket-footer {
      margin-top: 12px;
    }
  `]
})
export class KotComponent implements OnInit {
  private dbService = inject(MockDbService);
  private authService = inject(AuthService);

  userRole = this.authService.currentRole;
  activeView = signal<'kitchen' | 'waiter'>('kitchen');

  // Waiter view states
  properties = signal<Property[]>([]);
  entities = signal<Entity[]>([]);
  selectedCategory = signal<string>('all');
  
  orderEntityId = '';
  cart = signal<Array<KOTItem & { price: number }>>([]);

  // Kitchen view states
  kotOrders = signal<KOTOrder[]>([]);

  menuItems: MenuItem[] = [
    { name: 'Lobster Thermidor', category: 'food', price: 28, icon: '🦞' },
    { name: 'Butter Chicken Grand', category: 'food', price: 18, icon: '🍛' },
    { name: 'Garlic Butter Naan', category: 'food', price: 4, icon: '🫓' },
    { name: 'Margherita Pizza', category: 'food', price: 14, icon: '🍕' },
    { name: 'Caesar Salad', category: 'food', price: 10, icon: '🥗' },
    { name: 'Chardonnay Wine Glass', category: 'beverage', price: 12, icon: '🍷' },
    { name: 'Craft IPA Beer Bottle', category: 'beverage', price: 8, icon: '🍺' },
    { name: 'Fresh Watermelon Juice', category: 'beverage', price: 6, icon: '🍉' },
    { name: 'Mango Lassi Premium', category: 'beverage', price: 5, icon: '🥛' },
    { name: 'Chocolate Lava Cake', category: 'dessert', price: 9, icon: '🍰' },
    { name: 'Tiramisu Classical', category: 'dessert', price: 10, icon: '🍮' }
  ];

  ngOnInit() {
    this.loadData();
    // Default chef users straight to kitchen view, others can toggle
    if (this.userRole() === 'chef') {
      this.activeView.set('kitchen');
    } else {
      this.activeView.set('waiter');
    }
  }

  loadData() {
    this.dbService.getProperties().subscribe(list => this.properties.set(list));
    this.dbService.getEntities().subscribe(list => this.entities.set(list));
    this.dbService.getKOTOrders().subscribe(list => this.kotOrders.set(list));
  }

  setView(view: 'kitchen' | 'waiter') {
    this.activeView.set(view);
  }

  setCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  filteredMenuItems(): MenuItem[] {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.menuItems;
    return this.menuItems.filter(item => item.category === cat);
  }

  tables(): Entity[] {
    return this.entities().filter(e => e.type === 'table');
  }

  rooms(): Entity[] {
    return this.entities().filter(e => e.type === 'room');
  }

  addToCart(item: MenuItem) {
    const existing = this.cart().find(c => c.name === item.name);
    if (existing) {
      existing.qty++;
      this.cart.update(list => [...list]);
    } else {
      this.cart.update(list => [...list, { name: item.name, qty: 1, price: item.price, notes: '' }]);
    }
  }

  adjustQty(index: number, diff: number) {
    const item = this.cart()[index];
    item.qty += diff;
    if (item.qty <= 0) {
      this.cart.update(list => list.filter((_, i) => i !== index));
    } else {
      this.cart.update(list => [...list]);
    }
  }

  getCartItemTotal(item: any): number {
    return item.qty * item.price;
  }

  getCartTotal(): number {
    return this.cart().reduce((sum, item) => sum + this.getCartItemTotal(item), 0);
  }

  submitOrder() {
    if (!this.orderEntityId) {
      alert('Please select a dining table or room for this order.');
      return;
    }
    if (this.cart().length === 0) {
      return;
    }

    const selectedAsset = this.entities().find(e => e.id === this.orderEntityId);
    const entityName = selectedAsset ? selectedAsset.name : 'Unknown Location';

    const orderData = {
      propertyId: selectedAsset ? selectedAsset.propertyId : 'prop-2',
      entityId: this.orderEntityId,
      entityName,
      items: this.cart().map(c => ({ name: c.name, qty: c.qty, notes: c.notes || undefined })),
      status: 'pending' as const
    };

    this.dbService.createKOTOrder(orderData).subscribe(() => {
      this.cart.set([]);
      this.orderEntityId = '';
      this.loadData();
      alert('Order sent successfully to Kitchen Display!');
      this.setView('kitchen'); // Switch to monitor it
    });
  }

  // Kitchen Display functions
  getOrdersByStatus(status: KOTOrder['status']): KOTOrder[] {
    return this.kotOrders()
      .filter(o => o.status === status)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  updateOrderStatus(id: string, status: KOTOrder['status']) {
    this.dbService.updateKOTStatus(id, status).subscribe(() => {
      this.loadData();
    });
  }

  getMinutesAgo(timestamp: number): number {
    const diffMs = Date.now() - timestamp;
    return Math.max(0, Math.floor(diffMs / 60000));
  }
}
