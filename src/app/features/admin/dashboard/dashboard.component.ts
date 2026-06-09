import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDbService, Property, Entity, KOTOrder, InventoryItem, HousekeepingTask, FinancialRecord } from '../../../core/services/mock-db.service';
import { ChartComponent, ChartDataPoint } from '../../../shared/components/chart/chart.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartComponent, RouterLink],
  template: `
    <div class="dashboard-page">
      <!-- Welcome header banner -->
      <div class="welcome-banner mb-3">
        <h1>Welcome Back, Alaya PMS Console</h1>
        <p>Real-time property operations, reservations, inventory control, and billing ledger.</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-4 mb-3">
        <!-- Stat Card 1: Properties -->
        <div class="card stat-card">
          <div class="stat-icon bg-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Properties</span>
            <h3 class="stat-value">{{ propertiesCount() }} Active</h3>
            <span class="stat-meta">Across all locations</span>
          </div>
        </div>

        <!-- Stat Card 2: Rooms occupancy -->
        <div class="card stat-card">
          <div class="stat-icon bg-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Occupancy Rate</span>
            <h3 class="stat-value">{{ occupancyRate() | number:'1.0-0' }}%</h3>
            <span class="stat-meta">{{ occupiedCount() }} of {{ totalRoomsCount() }} rooms booked</span>
          </div>
        </div>

        <!-- Stat Card 3: Active KOTs -->
        <div class="card stat-card">
          <div class="stat-icon bg-warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Active KOT Tickets</span>
            <h3 class="stat-value">{{ activeKotCount() }} Orders</h3>
            <span class="stat-meta">Pending in kitchen</span>
          </div>
        </div>

        <!-- Stat Card 4: Daily Revenue -->
        <div class="card stat-card">
          <div class="stat-icon bg-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Revenue</span>
            <h3 class="stat-value">\${{ totalRevenue() | number:'1.2-2' }}</h3>
            <span class="stat-meta">Cumulated ledger</span>
          </div>
        </div>
      </div>

      <!-- Main Dash Contents Grid -->
      <div class="dashboard-details">
        
        <!-- Left Side: Charts and KOT Summary -->
        <div class="left-column">
          <!-- Financial Report Card -->
          <div class="card mb-3">
            <div class="card-header">
              <h3>Financial Performance (Revenue vs Expense)</h3>
            </div>
            <div class="card-body">
              <app-chart [data]="financeChartData()" type="bar" valuePrefix="$" [showLegend]="false"></app-chart>
            </div>
          </div>

          <!-- KOT orders tracking list -->
          <div class="card">
            <div class="card-header">
              <h3>Active Kitchen Tickets</h3>
              <a routerLink="/admin/kot" class="btn btn-sm">Manage Kitchen</a>
            </div>
            <div class="card-body table-container" style="border: none;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Source</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let order of activeKotOrders()">
                    <td><strong>{{ order.id }}</strong></td>
                    <td>{{ order.entityName }}</td>
                    <td>
                      <span *ngFor="let item of order.items" class="order-item-badge">
                        {{ item.qty }}x {{ item.name }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'badge-warning': order.status === 'pending',
                        'badge-info': order.status === 'preparing',
                        'badge-success': order.status === 'ready'
                      }">{{ order.status | uppercase }}</span>
                    </td>
                    <td>{{ getMinutesAgo(order.timestamp) }} mins ago</td>
                  </tr>
                  <tr *ngIf="activeKotOrders().length === 0">
                    <td colspan="5" class="text-center">No active kitchen tickets.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Side: Action Alerts & Inventory Status -->
        <div class="right-column">
          
          <!-- Operations Checklists -->
          <div class="card mb-3">
            <div class="card-header">
              <h3>Operations Status</h3>
            </div>
            <div class="card-body progress-box">
              <app-chart [data]="opsMetricsData()" type="progress"></app-chart>
            </div>
          </div>

          <!-- Low Stock Alerts -->
          <div class="card mb-3">
            <div class="card-header">
              <h3>Low Stock Alerts</h3>
              <a routerLink="/admin/inventory" class="btn btn-sm">Restock</a>
            </div>
            <div class="card-body">
              <ul class="alert-list">
                <li *ngFor="let item of lowStockItems()">
                  <div class="alert-item-info">
                    <span class="alert-item-name">{{ item.name }}</span>
                    <span class="alert-item-meta">Category: {{ item.category | titlecase }}</span>
                  </div>
                  <div class="alert-item-values">
                    <span class="badge badge-danger">{{ item.qty }} / {{ item.unit }} left</span>
                    <span class="alert-item-reorder">Reorder at {{ item.reorderLevel }}</span>
                  </div>
                </li>
                <li *ngIf="lowStockItems().length === 0" class="text-center py-2" style="color: var(--fg-muted);">
                  All inventory items are healthy.
                </li>
              </ul>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card">
            <div class="card-header">
              <h3>Quick Operations Menu</h3>
            </div>
            <div class="card-body quick-menu">
              <a routerLink="/admin/properties" class="menu-btn">
                <span class="icon">&#43;</span> Add Property
              </a>
              <a routerLink="/admin/entities" class="menu-btn">
                <span class="icon">&#43;</span> Add Room/Table
              </a>
              <a routerLink="/admin/housekeeping" class="menu-btn">
                <span class="icon">&#9850;</span> Clean Room
              </a>
              <a routerLink="/admin/finance" class="menu-btn">
                <span class="icon">&#36;</span> Create Invoice
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
    }
    
    .welcome-banner {
      background-color: var(--bg-primary);
      padding: 24px;
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }
    
    .welcome-banner h1 {
      margin-bottom: 6px;
    }
    
    .stat-card {
      display: flex;
      align-items: center;
      padding: 16px;
      gap: 16px;
    }
    
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--border-radius);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    body.dark-theme .stat-icon {
      color: #0d1117;
    }
    
    .bg-info { background-color: var(--info-color); }
    .bg-success { background-color: var(--success-color); }
    .bg-warning { background-color: var(--warning-color); }
    .bg-danger { background-color: var(--danger-color); }
    
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    
    .stat-label {
      font-size: 12px;
      color: var(--fg-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-value {
      font-size: 20px;
      font-weight: 700;
      margin: 2px 0;
    }
    
    .stat-meta {
      font-size: 11px;
      color: var(--fg-secondary);
    }
    
    .dashboard-details {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }
    
    @media (max-width: 1024px) {
      .dashboard-details {
        grid-template-columns: 1fr;
      }
    }
    
    .order-item-badge {
      display: inline-block;
      font-size: 11px;
      background-color: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 1px 6px;
      margin-right: 4px;
      margin-bottom: 4px;
      color: var(--fg-primary);
    }
    
    .alert-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .alert-list li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-muted);
    }
    
    .alert-list li:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .alert-item-info {
      display: flex;
      flex-direction: column;
    }
    
    .alert-item-name {
      font-weight: 600;
      color: var(--fg-primary);
    }
    
    .alert-item-meta {
      font-size: 11px;
      color: var(--fg-muted);
    }
    
    .alert-item-values {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    
    .alert-item-reorder {
      font-size: 10px;
      color: var(--fg-muted);
    }
    
    .quick-menu {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .menu-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--border-color);
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius);
      color: var(--fg-primary);
      font-weight: 600;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    
    .menu-btn:hover {
      background-color: var(--primary-accent);
      color: var(--primary-color);
      border-color: var(--primary-color);
      text-decoration: none;
    }
    
    .menu-btn .icon {
      font-size: 16px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dbService = inject(MockDbService);

  // States derived from Mock DB
  propertiesCount = signal<number>(0);
  totalRoomsCount = signal<number>(0);
  occupiedCount = signal<number>(0);
  occupancyRate = signal<number>(0);
  activeKotCount = signal<number>(0);
  totalRevenue = signal<number>(0);

  activeKotOrders = signal<KOTOrder[]>([]);
  lowStockItems = signal<InventoryItem[]>([]);
  
  // Charts signals
  financeChartData = signal<ChartDataPoint[]>([]);
  opsMetricsData = signal<ChartDataPoint[]>([]);

  ngOnInit() {
    this.refreshDashboard();
  }

  private refreshDashboard() {
    // 1. Fetch properties
    this.dbService.getProperties().subscribe(list => {
      this.propertiesCount.set(list.length);
    });

    // 2. Fetch entities (rooms)
    this.dbService.getEntities().subscribe(list => {
      const rooms = list.filter(e => e.type === 'room');
      const occupied = rooms.filter(r => r.status === 'occupied').length;
      this.totalRoomsCount.set(rooms.length);
      this.occupiedCount.set(occupied);
      this.occupancyRate.set(rooms.length > 0 ? (occupied / rooms.length) * 100 : 0);
    });

    // 3. Fetch active KOT orders
    this.dbService.getKOTOrders().subscribe(list => {
      const active = list.filter(o => o.status !== 'served');
      this.activeKotCount.set(active.length);
      this.activeKotOrders.set(active.slice(0, 4)); // Show top 4 active
    });

    // 4. Fetch Inventory low stocks
    this.dbService.getInventory().subscribe(list => {
      const low = list.filter(item => item.qty <= item.reorderLevel);
      this.lowStockItems.set(low.slice(0, 4));
    });

    // 5. Fetch financials & calculate revenue vs expense chart
    this.dbService.getFinancialRecords().subscribe(list => {
      const revenueTotal = list.filter(r => r.type === 'revenue').reduce((s, r) => s + r.amount, 0);
      const expenseTotal = list.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
      this.totalRevenue.set(revenueTotal);

      // Setup Finance Chart Data
      this.financeChartData.set([
        { label: 'Room Revenue', value: list.filter(r => r.type === 'revenue' && r.category === 'Room Bookings').reduce((s, r) => s + r.amount, 0), color: 'var(--success-color)' },
        { label: 'KOT Dining', value: list.filter(r => r.type === 'revenue' && r.category === 'KOT Restaurant').reduce((s, r) => s + r.amount, 0), color: 'var(--primary-color)' },
        { label: 'Operations Cost', value: list.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0), color: 'var(--danger-color)' }
      ]);
    });

    // 6. Setup Ops performance checklist
    this.dbService.getHousekeepingTasks().subscribe(tasks => {
      const cleanRooms = this.totalRoomsCount() - tasks.filter(t => t.status !== 'clean').length;
      
      this.opsMetricsData.set([
        { label: 'Room Cleanliness', value: cleanRooms, color: 'var(--success-color)' },
        { label: 'KOT Efficiency (Completed)', value: 12, color: 'var(--info-color)' }, // Dummy finished stats
        { label: 'Active Staff On-Duty', value: 4, color: 'var(--warning-color)' }
      ]);
    });
  }

  getMinutesAgo(timestamp: number): number {
    const diffMs = Date.now() - timestamp;
    return Math.max(0, Math.floor(diffMs / 60000));
  }
}
