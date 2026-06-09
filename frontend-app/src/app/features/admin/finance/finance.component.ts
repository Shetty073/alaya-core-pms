import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService, Invoice, FinancialRecord, Entity } from '../../../core/services/mock-db.service';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="finance-page">
      <div class="page-header justify-between mb-3 d-flex align-items-center">
        <div>
          <h2>Financials & Invoicing Ledger</h2>
          <p>Generate guest receipts, process checkout payments, and trace income and operational expenditures.</p>
        </div>
        <div class="action-buttons">
          <button class="btn btn-primary" (click)="openInvoiceModal()">+ Create Custom Invoice</button>
          <button class="btn btn-danger" (click)="openExpenseModal()">- Log Expense</button>
        </div>
      </div>

      <!-- Financial Metrics Grid -->
      <div class="grid grid-3 mb-3">
        <div class="card summary-card border-success">
          <div class="card-body">
            <h3>\${{ totalRevenue() | number:'1.2-2' }}</h3>
            <p>Total Revenue logged</p>
          </div>
        </div>
        <div class="card summary-card border-danger">
          <div class="card-body">
            <h3>\${{ totalExpenses() | number:'1.2-2' }}</h3>
            <p>Total Expenses logged</p>
          </div>
        </div>
        <div class="card summary-card" [class.border-success]="netProfit() >= 0" [class.border-danger]="netProfit() < 0">
          <div class="card-body">
            <h3>\${{ netProfit() | number:'1.2-2' }}</h3>
            <p>Net Profit / (Loss)</p>
          </div>
        </div>
      </div>

      <!-- Tab selector: Invoices vs Ledger -->
      <div class="tabs-container mb-3">
        <button class="tab-btn" [class.active]="activeTab() === 'invoices'" (click)="setTab('invoices')">
          Guest Invoices & Billing
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'ledger'" (click)="setTab('ledger')">
          Profit & Loss Transaction History
        </button>
      </div>

      <!-- INVOICES GRID TAB -->
      <div *ngIf="activeTab() === 'invoices'" class="tab-content">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Guest Details</th>
                <th>Linked Asset</th>
                <th>Date Logged</th>
                <th>Total Charges</th>
                <th>Payment Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inv of invoices()">
                <td><strong>{{ inv.id }}</strong></td>
                <td>
                  <strong>{{ inv.guestName }}</strong>
                  <div style="font-size: 11px; color: var(--fg-muted);">{{ inv.guestEmail }}</div>
                </td>
                <td>{{ inv.entityName || 'General service' }}</td>
                <td>{{ inv.date | date:'mediumDate' }}</td>
                <td><strong>\${{ inv.total | number:'1.2-2' }}</strong></td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-success': inv.status === 'paid',
                    'badge-danger': inv.status === 'unpaid'
                  }">{{ inv.status | uppercase }}</span>
                </td>
                <td>
                  <button class="btn btn-sm btn-success" *ngIf="inv.status === 'unpaid'" (click)="payInvoice(inv.id)">
                    Pay & Clear Tab
                  </button>
                  <span *ngIf="inv.status === 'paid'" style="font-size: 11px; color: var(--fg-muted); font-weight: 500;">
                    Settled
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- LEDGER HISTORIES TAB -->
      <div *ngIf="activeTab() === 'ledger'" class="tab-content">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Transaction Code</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let rec of ledger()">
                <td><strong>{{ rec.id }}</strong></td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-success': rec.type === 'revenue',
                    'badge-danger': rec.type === 'expense'
                  }">{{ rec.type | uppercase }}</span>
                </td>
                <td><strong>{{ rec.category }}</strong></td>
                <td>{{ rec.description }}</td>
                <td>
                  <strong [style.color]="rec.type === 'revenue' ? 'var(--success-color)' : 'var(--danger-color)'">
                    {{ rec.type === 'revenue' ? '+' : '-' }}\${{ rec.amount | number:'1.2-2' }}
                  </strong>
                </td>
                <td>{{ rec.date | date:'mediumDate' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Invoice Modal -->
      <div class="modal-overlay" *ngIf="showInvoiceModal()">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Generate Guest Invoice</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeInvoiceModal()">X</button>
          </div>
          <form (ngSubmit)="saveInvoice()">
            <div class="modal-body">
              <div class="form-group grid grid-2" style="gap: 8px;">
                <div>
                  <label class="form-label">Guest Name</label>
                  <input type="text" name="guestName" [(ngModel)]="newInvoice.guestName" class="form-control" required placeholder="e.g. Richard Hendricks" />
                </div>
                <div>
                  <label class="form-label">Guest Email</label>
                  <input type="email" name="guestEmail" [(ngModel)]="newInvoice.guestEmail" class="form-control" required placeholder="e.g. richard@gmail.com" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Associate Asset Room/Cab</label>
                <select name="entityId" [(ngModel)]="newInvoice.entityId" class="form-control form-select" (change)="onInvoiceEntityChange()">
                  <option value="">No specific asset (General service bill)</option>
                  <option *ngFor="let e of entities()" [value]="e.id">{{ e.name }} ({{ e.type | uppercase }})</option>
                </select>
              </div>

              <!-- Line item manager -->
              <div class="form-group line-items-box">
                <label class="form-label">Bill Line Items</label>
                <div class="line-item-row" *ngFor="let item of invoiceItems(); let i = index">
                  <input type="text" placeholder="Description" class="form-control" [name]="'desc_' + i" [(ngModel)]="item.description" required />
                  <input type="number" placeholder="Cost ($)" class="form-control" [name]="'amount_' + i" [(ngModel)]="item.amount" (input)="updateInvoiceTotal()" required style="max-width: 100px;" />
                  <button type="button" class="btn btn-danger btn-sm" (click)="removeLineItem(i)">X</button>
                </div>
                <button type="button" class="btn btn-sm mt-2" (click)="addLineItem()">+ Add Item Line</button>
              </div>

              <div class="justify-between d-flex mt-3 pt-2" style="border-top: 1px solid var(--border-color);">
                <strong>Total Amount:</strong>
                <strong>\${{ newInvoice.total | number:'1.2-2' }}</strong>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn" (click)="closeInvoiceModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Generate Invoice</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Log Expense Modal -->
      <div class="modal-overlay" *ngIf="showExpenseModal()">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Log Operational Expense</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeExpenseModal()">X</button>
          </div>
          <form (ngSubmit)="saveExpense()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Expense Category</label>
                <select name="category" [(ngModel)]="newExpense.category" class="form-control form-select">
                  <option value="Salary">Staff Salaries</option>
                  <option value="Purchase Orders">Inventory / PO Supplies</option>
                  <option value="Electricity">Electricity / Water Utilities</option>
                  <option value="Maintenance">Asset Repairs / Maintenance</option>
                  <option value="Marketing">Marketing / ADS</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Expense Amount ($)</label>
                <input type="number" name="amount" [(ngModel)]="newExpense.amount" class="form-control" required placeholder="0.00" />
              </div>
              <div class="form-group">
                <label class="form-label">Description / Remarks</label>
                <textarea name="description" [(ngModel)]="newExpense.description" class="form-control" rows="3" required placeholder="e.g. Cleared electricity bill for block A resort"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn" (click)="closeExpenseModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Expense</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .finance-page {
      display: flex;
      flex-direction: column;
    }
    
    .summary-card.border-success { border-left: 4px solid var(--success-color); }
    .summary-card.border-danger { border-left: 4px solid var(--danger-color); }
    
    .tabs-container {
      display: flex;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 2px;
    }
    
    .tab-btn {
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      background: none;
      border: none;
      color: var(--fg-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      outline: none;
    }
    
    .tab-btn:hover {
      color: var(--fg-primary);
    }
    
    .tab-btn.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }
    
    .line-items-box {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 12px;
      margin-top: 12px;
    }
    
    .line-item-row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .line-item-row:last-child {
      margin-bottom: 0;
    }
  `]
})
export class FinanceComponent implements OnInit {
  private dbService = inject(MockDbService);

  activeTab = signal<'invoices' | 'ledger'>('invoices');
  
  // Datasets
  invoices = signal<Invoice[]>([]);
  ledger = signal<FinancialRecord[]>([]);
  entities = signal<Entity[]>([]);

  // Computed metrics
  totalRevenue = signal<number>(0);
  totalExpenses = signal<number>(0);
  netProfit = signal<number>(0);

  // Modals signals
  showInvoiceModal = signal<boolean>(false);
  showExpenseModal = signal<boolean>(false);

  // Custom Invoice Form Data
  invoiceItems = signal<{ description: string; amount: number }[]>([
    { description: 'Service Charges', amount: 50 }
  ]);
  newInvoice: Omit<Invoice, 'id' | 'date'> = {
    guestName: '',
    guestEmail: '',
    entityId: '',
    entityName: '',
    items: [],
    total: 50,
    status: 'unpaid'
  };

  // Expense Form Data
  newExpense: Omit<FinancialRecord, 'id' | 'date' | 'type'> = {
    category: 'Salary',
    amount: 0,
    description: ''
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dbService.getInvoices().subscribe(list => {
      this.invoices.set(list.sort((a, b) => b.date - a.date));
    });
    this.dbService.getFinancialRecords().subscribe(list => {
      this.ledger.set(list.sort((a, b) => b.date - a.date));

      // Compute aggregates
      const rev = list.filter(r => r.type === 'revenue').reduce((s, r) => s + r.amount, 0);
      const exp = list.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
      
      this.totalRevenue.set(rev);
      this.totalExpenses.set(exp);
      this.netProfit.set(rev - exp);
    });
    this.dbService.getEntities().subscribe(list => {
      this.entities.set(list.filter(e => e.status === 'occupied' || e.status === 'dirty'));
    });
  }

  setTab(tab: 'invoices' | 'ledger') {
    this.activeTab.set(tab);
  }

  payInvoice(id: string) {
    this.dbService.payInvoice(id).subscribe(() => {
      this.loadData();
      alert('Invoice paid successfully. Ledger updated.');
    });
  }

  // Invoice Modal Actions
  openInvoiceModal() {
    this.invoiceItems.set([{ description: 'Room / Unit Accommodation Charges', amount: 100 }]);
    this.newInvoice = {
      guestName: '',
      guestEmail: '',
      entityId: '',
      entityName: '',
      items: [],
      total: 100,
      status: 'unpaid'
    };
    this.showInvoiceModal.set(true);
  }

  closeInvoiceModal() {
    this.showInvoiceModal.set(false);
  }

  onInvoiceEntityChange() {
    const entId = this.newInvoice.entityId;
    const ent = this.entities().find(e => e.id === entId);
    if (ent) {
      this.newInvoice.entityName = ent.name;
      // Set initial item price matching the entity rate
      if (ent.price > 0) {
        this.invoiceItems.set([{ description: `${ent.name} Stay Accommodation`, amount: ent.price }]);
        this.updateInvoiceTotal();
      }
    } else {
      this.newInvoice.entityName = '';
    }
  }

  addLineItem() {
    this.invoiceItems.update(list => [...list, { description: 'Value added service bill', amount: 15 }]);
    this.updateInvoiceTotal();
  }

  removeLineItem(idx: number) {
    this.invoiceItems.update(list => list.filter((_, i) => i !== idx));
    this.updateInvoiceTotal();
  }

  updateInvoiceTotal() {
    const total = this.invoiceItems().reduce((sum, item) => sum + (item.amount || 0), 0);
    this.newInvoice.total = total;
  }

  saveInvoice() {
    if (!this.newInvoice.guestName || !this.newInvoice.guestEmail) return;

    this.newInvoice.items = [...this.invoiceItems()];
    this.dbService.createInvoice(this.newInvoice).subscribe(() => {
      this.loadData();
      this.closeInvoiceModal();
      alert('Custom Invoice generated successfully.');
    });
  }

  // Expense Modal Actions
  openExpenseModal() {
    this.newExpense = {
      category: 'Salary',
      amount: 0,
      description: ''
    };
    this.showExpenseModal.set(true);
  }

  closeExpenseModal() {
    this.showExpenseModal.set(false);
  }

  saveExpense() {
    if (this.newExpense.amount <= 0 || !this.newExpense.description) return;

    this.dbService.addFinancialRecord({
      type: 'expense',
      category: this.newExpense.category,
      amount: this.newExpense.amount,
      description: this.newExpense.description
    }).subscribe(() => {
      this.loadData();
      this.closeExpenseModal();
      alert('Operational Expense recorded successfully.');
    });
  }
}
