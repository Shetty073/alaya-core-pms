import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService, KOTOrder, Entity, Invoice, Property } from '../../../core/services/mock-db.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-restaurant-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="billing-container">
      <!-- Top Navigation Tabs -->
      <div class="tab-header">
        <button class="tab-btn" [class.active]="activeTab() === 'billing'" (click)="setTab('billing')">
          Pending Billings
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'tables'" (click)="setTab('tables')">
          Table Master Management
        </button>
      </div>

      <!-- PENDING BILLINGS TAB -->
      <div *ngIf="activeTab() === 'billing'" class="tab-content">
        <div class="grid-layout">
          <!-- Left side: List of Served/Ready KOT Orders -->
          <div class="list-section">
            <div class="card">
              <div class="card-header justify-between">
                <h3>KOT Billings Queue</h3>
                <span class="badge badge-info">{{ pendingOrders().length }} Orders Pending Bill</span>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Location</th>
                        <th>Placed</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let order of pendingOrders()" 
                          [class.selected-row]="selectedOrder()?.id === order.id"
                          (click)="selectOrder(order)">
                        <td><strong>{{ order.id }}</strong></td>
                        <td>
                          <span class="badge" [class.badge-secondary]="order.entityId.startsWith('ent-t')" [class.badge-warning]="!order.entityId.startsWith('ent-t')">
                            {{ order.entityName }}
                          </span>
                        </td>
                        <td>{{ getMinutesAgo(order.timestamp) }}m ago</td>
                        <td>
                          <div style="font-size: 12px; color: var(--fg-secondary);">
                            {{ getItemsSummary(order) }}
                          </div>
                        </td>
                        <td><strong>\${{ getOrderTotal(order) }}</strong></td>
                        <td>
                          <button class="btn btn-sm btn-primary" (click)="selectOrder(order); $event.stopPropagation()">
                            Details & Pay
                          </button>
                        </td>
                      </tr>
                      <tr *ngIf="pendingOrders().length === 0">
                        <td colspan="6" class="text-center py-4" style="color: var(--fg-muted);">
                          No pending orders found.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Right side: Settle & Payment Panel -->
          <div class="details-section">
            <div class="card" *ngIf="selectedOrder() as order; else noSelection">
              <div class="card-header justify-between">
                <h3>Settle Order {{ order.id }}</h3>
                <button class="btn-close" (click)="clearSelection()">&times;</button>
              </div>
              <div class="card-body">
                <div class="order-details mb-3">
                  <div class="detail-row">
                    <span>Location:</span>
                    <strong>{{ order.entityName }}</strong>
                  </div>
                  <div class="detail-row" *ngIf="order.deliveryTime">
                    <span>Delivery Time:</span>
                    <strong style="color: var(--warning-color);">🕒 {{ order.deliveryTime }}</strong>
                  </div>
                  <div class="detail-row">
                    <span>Order Date:</span>
                    <span>{{ order.timestamp | date:'shortTime' }}</span>
                  </div>
                </div>

                <!-- Items list -->
                <div class="bill-invoice">
                  <div class="invoice-header">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                  <div class="invoice-items">
                    <div class="invoice-item" *ngFor="let item of order.items">
                      <span class="item-name">{{ item.name }}</span>
                      <span>{{ item.qty }}</span>
                      <span>\${{ getItemPrice(item.name) }}</span>
                      <strong>\${{ getItemPrice(item.name) * item.qty }}</strong>
                    </div>
                  </div>
                  <div class="invoice-footer">
                    <span>Total Amount:</span>
                    <h2>\${{ getOrderTotal(order) }}</h2>
                  </div>
                </div>

                <!-- Settlement actions -->
                <div class="settlement-actions mt-3">
                  <h4>Choose Payment Option</h4>
                  
                  <div class="payment-method-box">
                    <h5>Option A: Settle Directly</h5>
                    <div class="btn-group">
                      <button class="btn btn-success flex-1" (click)="settleDirect(order.id)">
                        💵 Settle Cash / Card
                      </button>
                    </div>
                  </div>

                  <div class="payment-method-box mt-3">
                    <h5>Option B: Charge to checked-in Hotel Guest</h5>
                    <div class="form-group">
                      <label class="form-label">Select Checked-In Guest Suite</label>
                      <select class="form-control form-select" [(ngModel)]="selectedInvoiceId">
                        <option value="" disabled selected>-- Choose Suite / Room --</option>
                        <option *ngFor="let guest of checkedInGuests()" [value]="guest.id">
                          {{ guest.entityName }} - {{ guest.guestName }}
                        </option>
                      </select>
                    </div>
                    <button class="btn btn-primary w-100 mt-2" 
                            [disabled]="!selectedInvoiceId"
                            (click)="settleToRoom(order.id)">
                      🏨 Charge to Suite Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noSelection>
              <div class="card text-center py-5" style="color: var(--fg-muted);">
                <div class="card-body">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 16px; display: block; opacity: 0.5;">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                    <line x1="12" y1="4" x2="12" y2="20"></line>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                  </svg>
                  <h4>No Order Selected</h4>
                  <p>Please click "Details & Pay" on a pending order from the list to begin the settlement process.</p>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>

      <!-- TABLE MASTER MANAGEMENT TAB -->
      <div *ngIf="activeTab() === 'tables'" class="tab-content">
        <div class="grid-layout">
          <!-- Left side: Tables catalog -->
          <div class="list-section">
            <div class="card">
              <div class="card-header">
                <h3>Restaurant Tables Master Registry</h3>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Table ID</th>
                        <th>Table Name/Number</th>
                        <th>Seating Capacity / Subtype</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let t of tables()">
                        <td>{{ t.id }}</td>
                        <td><strong>{{ t.name }}</strong></td>
                        <td>{{ t.subtype }}</td>
                        <td>
                          <span class="status-badge" [class.badge-success]="t.status === 'available'" [class.badge-warning]="t.status === 'occupied'">
                            {{ t.status | titlecase }}
                          </span>
                        </td>
                        <td>
                          <button class="btn btn-sm btn-danger" (click)="removeTable(t.id)">
                            Remove
                          </button>
                        </td>
                      </tr>
                      <tr *ngIf="tables().length === 0">
                        <td colspan="5" class="text-center py-4" style="color: var(--fg-muted);">
                          No tables configured in the database.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Right side: Add Table Form -->
          <div class="details-section">
            <div class="card">
              <div class="card-header">
                <h3>Add New Table</h3>
              </div>
              <div class="card-body">
                <form (submit)="onCreateTable($event)">
                  <div class="form-group mb-3">
                    <label class="form-label">Table Name / Number</label>
                    <input type="text" class="form-control" name="tableName" [(ngModel)]="newTableName" required placeholder="e.g. Table 8" />
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label">Seating Subtype</label>
                    <select class="form-control form-select" name="tableSubtype" [(ngModel)]="newTableSubtype" required>
                      <option value="2-Seater">2-Seater</option>
                      <option value="4-Seater">4-Seater</option>
                      <option value="6-Seater">6-Seater</option>
                      <option value="8-Seater Lounge">8-Seater Lounge</option>
                      <option value="12-Seater VIP">12-Seater VIP Room</option>
                    </select>
                  </div>
                  <button type="submit" class="btn btn-success w-100">
                    ➕ Save Table configuration
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .billing-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: fadeIn 0.15s ease-out;
    }

    .tab-header {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }

    .tab-btn {
      background: none;
      border: 1px solid transparent;
      padding: 8px 16px;
      font-weight: 500;
      color: var(--fg-secondary);
      cursor: pointer;
      border-radius: var(--border-radius);
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      background-color: var(--bg-primary);
      color: var(--fg-primary);
    }

    .tab-btn.active {
      background-color: var(--primary-accent);
      color: var(--primary-color);
      font-weight: 600;
    }

    .grid-layout {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 20px;
    }

    @media (max-width: 992px) {
      .grid-layout {
        grid-template-columns: 1fr;
      }
    }

    .list-section, .details-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .selected-row {
      background-color: var(--primary-accent) !important;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: var(--fg-muted);
    }

    .btn-close:hover {
      color: var(--fg-primary);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-muted);
      font-size: 13px;
    }

    /* Bill Invoice layout */
    .bill-invoice {
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background-color: var(--bg-secondary);
      padding: 12px;
    }

    .invoice-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      font-size: 11px;
      font-weight: 600;
      color: var(--fg-muted);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 6px;
      text-transform: uppercase;
    }

    .invoice-items {
      display: flex;
      flex-direction: column;
      padding: 8px 0;
      gap: 6px;
      max-height: 180px;
      overflow-y: auto;
    }

    .invoice-item {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      font-size: 12px;
      color: var(--fg-primary);
    }

    .item-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .invoice-footer {
      border-top: 1px dashed var(--border-color);
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .invoice-footer h2 {
      font-size: 20px;
      color: var(--primary-color);
      margin: 0;
    }

    .payment-method-box {
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 12px;
      background-color: var(--bg-primary);
    }

    .payment-method-box h5 {
      margin-bottom: 8px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--fg-muted);
    }

    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
  `]
})
export class RestaurantBillingComponent implements OnInit {
  private dbService = inject(MockDbService);
  private router = inject(Router);

  activeTab = signal<'billing' | 'tables'>('billing');
  
  // Billings list
  kotOrders = signal<KOTOrder[]>([]);
  checkedInGuests = signal<Invoice[]>([]);
  
  // Selection
  selectedOrder = signal<KOTOrder | null>(null);
  selectedInvoiceId = '';

  // Tables list
  entities = signal<Entity[]>([]);

  // Add Table Form values
  newTableName = '';
  newTableSubtype = '2-Seater';

  private mockPrices: Record<string, number> = {
    'Lobster Thermidor': 28,
    'Butter Chicken Grand': 18,
    'Garlic Butter Naan': 4,
    'Margherita Pizza': 14,
    'Caesar Salad': 10,
    'Chardonnay Wine Glass': 12,
    'Craft IPA Beer Bottle': 8,
    'Fresh Watermelon Juice': 6,
    'Mango Lassi Premium': 5,
    'Chocolate Lava Cake': 9,
    'Tiramisu Classical': 10
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dbService.getKOTOrders().subscribe(list => this.kotOrders.set(list));
    this.dbService.getCheckedInGuests().subscribe(list => this.checkedInGuests.set(list));
    this.dbService.getEntities().subscribe(list => this.entities.set(list));
  }

  setTab(tab: 'billing' | 'tables') {
    this.activeTab.set(tab);
    this.clearSelection();
  }

  pendingOrders(): KOTOrder[] {
    // Orders that are either Served or Ready and have a pending billing status
    return this.kotOrders().filter(o => 
      (o.status === 'served' || o.status === 'ready') && 
      (!o.billingStatus || o.billingStatus === 'pending')
    );
  }

  tables(): Entity[] {
    return this.entities().filter(e => e.type === 'table');
  }

  selectOrder(order: KOTOrder) {
    this.selectedOrder.set(order);
    this.selectedInvoiceId = '';
  }

  clearSelection() {
    this.selectedOrder.set(null);
    this.selectedInvoiceId = '';
  }

  getMinutesAgo(timestamp: number): number {
    const diffMs = Date.now() - timestamp;
    return Math.max(0, Math.floor(diffMs / 60000));
  }

  getItemPrice(name: string): number {
    return this.mockPrices[name] || 15;
  }

  getOrderTotal(order: KOTOrder): number {
    return order.items.reduce((sum, item) => sum + (item.qty * this.getItemPrice(item.name)), 0);
  }

  getItemsSummary(order: KOTOrder): string {
    return order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
  }

  settleDirect(orderId: string) {
    if (confirm('Settle this order bill directly using Cash/Card?')) {
      this.dbService.settleKOTDirect(orderId).subscribe(() => {
        alert('Order settled successfully! Direct payment logged.');
        this.clearSelection();
        this.loadData();
      });
    }
  }

  settleToRoom(orderId: string) {
    if (!this.selectedInvoiceId) return;
    const selectedInv = this.checkedInGuests().find(g => g.id === this.selectedInvoiceId);
    if (!selectedInv) return;

    if (confirm(`Charge this restaurant bill to ${selectedInv.guestName}'s room tab (${selectedInv.entityName})?`)) {
      this.dbService.chargeOrderToRoom(orderId, this.selectedInvoiceId).subscribe(() => {
        alert('Restaurant charge added to room account successfully!');
        this.clearSelection();
        this.loadData();
      });
    }
  }

  onCreateTable(event: Event) {
    event.preventDefault();
    if (!this.newTableName || !this.newTableSubtype) return;

    // Use Bistro propertyId if available, else standard fallback
    const bistroProp = this.entities().find(e => e.propertyId === 'prop-2');
    const propertyId = bistroProp ? bistroProp.propertyId : 'prop-2';

    this.dbService.addTable({
      name: this.newTableName,
      subtype: this.newTableSubtype,
      propertyId
    }).subscribe(() => {
      alert('New dining table added successfully!');
      this.newTableName = '';
      this.newTableSubtype = '2-Seater';
      this.loadData();
    });
  }

  removeTable(id: string) {
    if (confirm('Are you sure you want to remove this dining table? It will no longer appear on Captains/Waiters lists.')) {
      this.dbService.deleteTable(id).subscribe(() => {
        alert('Table configuration removed.');
        this.loadData();
      });
    }
  }
}
