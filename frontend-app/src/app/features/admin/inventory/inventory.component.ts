import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService, InventoryItem } from '../../../core/services/mock-db.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inventory-page">
      <div class="page-header justify-between mb-3 d-flex align-items-center">
        <div>
          <h2>Inventory Management</h2>
          <p>Track food/beverage stocks, cleaning chemicals, room linens, and amenities.</p>
        </div>
        <div class="action-buttons">
          <button class="btn btn-primary" (click)="openAddModal()">+ Add Stock Item</button>
        </div>
      </div>

      <!-- Inventory status summaries -->
      <div class="grid grid-3 mb-3">
        <div class="card summary-card border-warning">
          <div class="card-body">
            <h3>{{ lowStockCount() }} Low Stock Alerts</h3>
            <p>Items currently at or below safety reorder threshold.</p>
          </div>
        </div>
        <div class="card summary-card">
          <div class="card-body">
            <h3>{{ totalItemsCount() }} Total Categories</h3>
            <p>Individual tracked item types across properties.</p>
          </div>
        </div>
        <div class="card summary-card">
          <div class="card-body">
            <h3>\${{ totalInventoryValue() | number:'1.2-2' }}</h3>
            <p>Estimated capital tied in current stock assets.</p>
          </div>
        </div>
      </div>

      <!-- Main inventory table list -->
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Available Qty</th>
              <th>Unit Cost</th>
              <th>Total Asset Value</th>
              <th>Supplier</th>
              <th>Quick Adjust / Reorder</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of inventory()" [class.row-alert]="item.qty <= item.reorderLevel">
              <td>
                <strong>{{ item.name }}</strong>
                <div *ngIf="item.qty <= item.reorderLevel" class="alert-tag">Low Stock</div>
              </td>
              <td>
                <span class="badge" [ngClass]="{
                  'badge-info': item.category === 'amenities',
                  'badge-success': item.category === 'food',
                  'badge-warning': item.category === 'linens',
                  'badge-danger': item.category === 'cleaning'
                }">{{ item.category | uppercase }}</span>
              </td>
              <td>
                <span class="qty-text" [style.color]="item.qty <= item.reorderLevel ? 'var(--danger-color)' : 'inherit'">
                  {{ item.qty }} {{ item.unit }}
                </span>
                <span style="font-size: 11px; color: var(--fg-muted); display: block;">
                  Reorder: {{ item.reorderLevel }} {{ item.unit }}
                </span>
              </td>
              <td>\${{ item.unitCost }}</td>
              <td>\${{ item.qty * item.unitCost | number:'1.2-2' }}</td>
              <td>{{ item.supplier }}</td>
              <td>
                <div class="adjust-actions">
                  <!-- Subtract Qty -->
                  <button class="btn btn-sm" (click)="adjustQty(item.id, item.qty - 10)">-10</button>
                  <!-- Add Qty (Restock) -->
                  <button class="btn btn-sm" (click)="adjustQty(item.id, item.qty + 10)">+10</button>
                  <!-- Trigger PO restock -->
                  <button class="btn btn-sm btn-primary" *ngIf="item.qty <= item.reorderLevel" (click)="triggerPurchaseOrder(item)">
                    Auto-PO
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Stock Modal -->
      <div class="modal-overlay" *ngIf="showAddModal()">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add Inventory Item</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeAddModal()">X</button>
          </div>
          <form (ngSubmit)="saveInventoryItem()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label" for="inv-name">Item Name</label>
                <input type="text" id="inv-name" name="name" [(ngModel)]="newItem.name" class="form-control" required placeholder="e.g. Bleach Cleanser Liquid" />
              </div>
              <div class="form-group">
                <label class="form-label" for="inv-category">Category</label>
                <select id="inv-category" name="category" [(ngModel)]="newItem.category" class="form-control form-select">
                  <option value="food">Food & Kitchen Ingredients</option>
                  <option value="linens">Linens & Housekeeping Supplies</option>
                  <option value="cleaning">Cleaning Chemicals</option>
                  <option value="amenities">Guest Amenities & Minibar</option>
                </select>
              </div>
              <div class="form-group grid grid-2" style="gap: 8px;">
                <div>
                  <label class="form-label" for="inv-qty">Initial Qty</label>
                  <input type="number" id="inv-qty" name="qty" [(ngModel)]="newItem.qty" class="form-control" required />
                </div>
                <div>
                  <label class="form-label" for="inv-unit">Unit Measure</label>
                  <input type="text" id="inv-unit" name="unit" [(ngModel)]="newItem.unit" class="form-control" required placeholder="e.g. kg, litres, pcs" />
                </div>
              </div>
              <div class="form-group grid grid-2" style="gap: 8px;">
                <div>
                  <label class="form-label" for="inv-reorder">Reorder Threshold</label>
                  <input type="number" id="inv-reorder" name="reorderLevel" [(ngModel)]="newItem.reorderLevel" class="form-control" required />
                </div>
                <div>
                  <label class="form-label" for="inv-cost">Unit Cost ($)</label>
                  <input type="number" id="inv-cost" name="unitCost" [(ngModel)]="newItem.unitCost" step="0.01" class="form-control" required />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="inv-supplier">Supplier Vendor</label>
                <input type="text" id="inv-supplier" name="supplier" [(ngModel)]="newItem.supplier" class="form-control" required placeholder="e.g. Linen Distributors India" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn" (click)="closeAddModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Item</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .inventory-page {
      display: flex;
      flex-direction: column;
    }
    
    .summary-card.border-warning {
      border-left: 4px solid var(--warning-color);
    }
    
    .row-alert {
      background-color: var(--danger-bg);
    }
    
    body.dark-theme .row-alert td {
      background-color: rgba(248, 81, 73, 0.05);
    }
    
    .alert-tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      color: var(--danger-color);
      background-color: var(--danger-bg);
      border: 1px solid var(--danger-border);
      border-radius: 4px;
      padding: 1px 4px;
      margin-top: 4px;
    }
    
    .qty-text {
      font-weight: 600;
    }
    
    .adjust-actions {
      display: flex;
      gap: 6px;
    }
  `]
})
export class InventoryComponent implements OnInit {
  private dbService = inject(MockDbService);

  inventory = signal<InventoryItem[]>([]);
  showAddModal = signal<boolean>(false);

  // Computed metrics
  lowStockCount = signal<number>(0);
  totalItemsCount = signal<number>(0);
  totalInventoryValue = signal<number>(0);

  newItem: Omit<InventoryItem, 'id'> = {
    name: '',
    category: 'food',
    qty: 0,
    unit: 'pcs',
    reorderLevel: 10,
    unitCost: 1.0,
    supplier: ''
  };

  ngOnInit() {
    this.loadInventory();
  }

  private loadInventory() {
    this.dbService.getInventory().subscribe(list => {
      this.inventory.set(list);

      // Calculations
      const low = list.filter(item => item.qty <= item.reorderLevel).length;
      const totalVal = list.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);
      
      this.lowStockCount.set(low);
      this.totalItemsCount.set(list.length);
      this.totalInventoryValue.set(totalVal);
    });
  }

  openAddModal() {
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
    this.resetForm();
  }

  saveInventoryItem() {
    if (!this.newItem.name || !this.newItem.supplier) return;

    this.dbService.addInventoryItem(this.newItem).subscribe(() => {
      this.loadInventory();
      this.closeAddModal();
    });
  }

  adjustQty(id: string, newQty: number) {
    const qty = Math.max(0, newQty);
    this.dbService.updateInventoryQty(id, qty).subscribe(() => {
      this.loadInventory();
    });
  }

  triggerPurchaseOrder(item: InventoryItem) {
    // Standard PO restocks 100 units
    const restockQty = 100;
    const cost = restockQty * item.unitCost;

    // 1. Log financial cost
    this.dbService.addFinancialRecord({
      type: 'expense',
      category: 'Purchase Orders',
      amount: cost,
      description: `Restock Purchase Order - ${restockQty} ${item.unit} of ${item.name}`
    }).subscribe();

    // 2. Increase stock count
    this.dbService.updateInventoryQty(item.id, item.qty + restockQty).subscribe(() => {
      this.loadInventory();
      alert(`PO Sent: Ordered ${restockQty} ${item.unit} of ${item.name} for \$${cost}. Inventory updated.`);
    });
  }

  private resetForm() {
    this.newItem = {
      name: '',
      category: 'food',
      qty: 0,
      unit: 'pcs',
      reorderLevel: 10,
      unitCost: 1.0,
      supplier: ''
    };
  }
}
