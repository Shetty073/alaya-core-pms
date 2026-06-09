import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService, Entity, Invoice, InvoiceItem } from '../../../core/services/mock-db.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-check-in-out',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="checkin-container">
      <!-- Tabs -->
      <div class="tab-header">
        <button class="tab-btn" [class.active]="activeTab() === 'registry'" (click)="setTab('registry')">
          Checked-In Guests Registry
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'checkin'" (click)="setTab('checkin')">
          New Manual Check-In
        </button>
      </div>

      <!-- ACTIVE GUEST REGISTRY TAB -->
      <div *ngIf="activeTab() === 'registry'" class="tab-content">
        <div class="grid-layout">
          <!-- Left side: Guest Table -->
          <div class="list-section">
            <div class="card">
              <div class="card-header justify-between">
                <h3>Active Checked-In Suites</h3>
                <span class="badge badge-success">{{ activeGuests().length }} Active Stays</span>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Suite / Room</th>
                        <th>Guest Name</th>
                        <th>Checked In At</th>
                        <th>Pre-Paid Deposit</th>
                        <th>Outstanding Balance</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let guest of activeGuests()" 
                          [class.selected-row]="selectedGuestInvoice()?.id === guest.id"
                          (click)="selectGuest(guest)">
                        <td>
                          <strong>{{ guest.entityName }}</strong>
                        </td>
                        <td>
                          <strong>{{ guest.guestName }}</strong>
                          <div style="font-size: 11px; color: var(--fg-muted);">{{ guest.guestEmail }}</div>
                        </td>
                        <td>{{ guest.date | date:'mediumDate' }}</td>
                        <td>\${{ guest.prepayment || 0 }}</td>
                        <td [style.color]="guest.total > 0 ? 'var(--warning-color)' : 'var(--success-color)'">
                          <strong>\${{ guest.total }}</strong>
                        </td>
                        <td>
                          <div class="btn-actions">
                            <button class="btn btn-sm btn-primary" (click)="selectGuest(guest); $event.stopPropagation()">
                              Checkout Settle
                            </button>
                            <button class="btn btn-sm btn-secondary" (click)="openServiceModal(guest); $event.stopPropagation()">
                              ➕ Add Service
                            </button>
                            <button class="btn btn-sm btn-success" (click)="orderRoomFood(guest); $event.stopPropagation()">
                              🍔 Order Food
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr *ngIf="activeGuests().length === 0">
                        <td colspan="6" class="text-center py-4" style="color: var(--fg-muted);">
                          No guests currently checked in.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Right side: Check-out aggregates Panel -->
          <div class="details-section">
            <div class="card" *ngIf="selectedGuestInvoice() as inv; else noGuestSelected">
              <div class="card-header justify-between">
                <h3>Check-Out Settlement</h3>
                <button class="btn-close" (click)="clearSelection()">&times;</button>
              </div>
              <div class="card-body">
                <div class="guest-details mb-3">
                  <div class="detail-row">
                    <span>Guest:</span>
                    <strong>{{ inv.guestName }}</strong>
                  </div>
                  <div class="detail-row">
                    <span>Room / Suite:</span>
                    <strong>{{ inv.entityName }}</strong>
                  </div>
                  <div class="detail-row" *ngIf="inv.idProofs && inv.idProofs.length > 0">
                    <span>Uploaded ID Proofs:</span>
                    <span style="font-size: 11px; color: var(--success-color); font-weight: 600;">
                      ✓ {{ inv.idProofs.length }} Scanned ID(s) Attached
                    </span>
                  </div>
                </div>

                <!-- Invoice Breakdown -->
                <div class="bill-invoice">
                  <div class="invoice-header">
                    <span>Charge Detail</span>
                    <span style="text-align: right;">Amount</span>
                  </div>
                  <div class="invoice-items">
                    <div class="invoice-item" *ngFor="let item of inv.items">
                      <span>{{ item.description }}</span>
                      <strong style="text-align: right;" [style.color]="item.amount < 0 ? 'var(--success-color)' : 'var(--fg-primary)'">
                        \${{ item.amount }}
                      </strong>
                    </div>
                  </div>
                  <div class="invoice-footer">
                    <span>Outstanding Due:</span>
                    <h2>\${{ inv.total }}</h2>
                  </div>
                </div>

                <!-- Checkout triggers -->
                <div class="mt-4">
                  <button class="btn btn-danger w-100" (click)="settleCheckout(inv.id)">
                    🛎️ Confirm Payment & Settle Checkout
                  </button>
                  <p class="text-center mt-2" style="font-size: 11px; color: var(--fg-muted);">
                    Completing this settling invoice automatically marks the room as dirty and posts a housekeeping cleaning assignment.
                  </p>
                </div>
              </div>
            </div>
            <ng-template #noGuestSelected>
              <div class="card text-center py-5" style="color: var(--fg-muted);">
                <div class="card-body">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 16px; display: block; opacity: 0.5;">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <polyline points="16 11 18 13 22 9"></polyline>
                  </svg>
                  <h4>No Active Guest Selected</h4>
                  <p>Choose an active room in the registry table to aggregates charges and finalize the checkout process.</p>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>

      <!-- ADD SERVICE MODAL -->
      <div class="modal-backdrop" *ngIf="showServiceModal()">
        <div class="modal-card">
          <div class="card-header justify-between">
            <h3>Add Service Charge (Room: {{ targetGuestForService()?.entityName }})</h3>
            <button class="btn-close" (click)="closeServiceModal()">&times;</button>
          </div>
          <div class="card-body">
            <form (submit)="postServiceCharge($event)">
              <div class="form-group mb-3">
                <label class="form-label">Service Type</label>
                <select class="form-control form-select" name="serviceDesc" [(ngModel)]="newServiceName" required>
                  <option value="Airport Cab Transfer">Airport Cab Transfer</option>
                  <option value="Executive Spa Massage">Executive Spa Massage</option>
                  <option value="Minibar Snack Charges">Minibar Snacks Restock</option>
                  <option value="Extra Rollaway Bed Service">Extra Bed Service</option>
                  <option value="Laundry & Dry Cleaning">Laundry & Dry Cleaning</option>
                  <option value="Custom Value Add-on">Custom Charge...</option>
                </select>
              </div>
              <div class="form-group mb-3" *ngIf="newServiceName === 'Custom Value Add-on'">
                <label class="form-label">Custom Service Description</label>
                <input type="text" class="form-control" name="customDesc" [(ngModel)]="customServiceDescription" required placeholder="e.g. Premium Gym Access Pass" />
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Price (USD)</label>
                <input type="number" class="form-control" name="servicePrice" [(ngModel)]="newServicePrice" required min="1" />
              </div>
              <div class="btn-group">
                <button type="button" class="btn btn-secondary flex-1" (click)="closeServiceModal()">Cancel</button>
                <button type="submit" class="btn btn-primary flex-1">Post to Invoice</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- NEW MANUAL CHECK-IN TAB -->
      <div *ngIf="activeTab() === 'checkin'" class="tab-content">
        <div class="card max-w-700">
          <div class="card-header">
            <h3>Manual Guest Check-In Form</h3>
          </div>
          <div class="card-body">
            <form (submit)="submitCheckIn($event)">
              <!-- Row 1: Guest Personal Info -->
              <div class="row mb-3">
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">Guest Full Name</label>
                    <input type="text" class="form-control" name="guestName" [(ngModel)]="checkInForm.name" required placeholder="e.g. Tony Stark" />
                  </div>
                </div>
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">Guest Email Address</label>
                    <input type="email" class="form-control" name="guestEmail" [(ngModel)]="checkInForm.email" required placeholder="e.g. tony@stark.com" />
                  </div>
                </div>
              </div>

              <!-- Row 2: Room & Stay Config -->
              <div class="row mb-3">
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">Select Available Room / Suite</label>
                    <select class="form-control form-select" name="guestRoomId" [(ngModel)]="checkInForm.roomId" required>
                      <option value="" disabled selected>-- Choose Available Suite --</option>
                      <option *ngFor="let rm of availableRooms()" [value]="rm.id">
                        {{ rm.name }} ({{ rm.subtype }}) - \${{ rm.price }}/night
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">Length of Stay (Nights)</label>
                    <input type="number" class="form-control" name="checkInDays" [(ngModel)]="checkInForm.checkInDays" required min="1" />
                  </div>
                </div>
              </div>

              <!-- Row 3: Pre-payment deposit -->
              <div class="row mb-3">
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">Room Pre-payment Deposit (Optional)</label>
                    <input type="number" class="form-control" name="prepayment" [(ngModel)]="checkInForm.prepayment" min="0" placeholder="e.g. 100" />
                  </div>
                </div>
              </div>

              <!-- ID Scanner Mock Uploader -->
              <div class="form-group mb-4">
                <label class="form-label">Scan / Upload ID Proofs (Passport, Driving License, etc.)</label>
                <div class="upload-zone" (click)="triggerFileInput()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 8px; opacity: 0.7;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>Drag files here or <strong>browse local storage</strong></span>
                  <input type="file" #fileInput multiple style="display: none;" (change)="onIdUpload($event)" accept="image/*,.pdf" />
                </div>

                <!-- Carousel Preview for mock uploaded IDs -->
                <div class="id-carousel mt-3" *ngIf="mockUploadedFiles.length > 0">
                  <h5>Attached Scans ({{ mockUploadedFiles.length }})</h5>
                  <div class="carousel-track">
                    <div class="id-card-preview" *ngFor="let file of mockUploadedFiles; let idx = index">
                      <div class="id-icon">🪪</div>
                      <div class="id-details">
                        <span class="file-name">{{ file.name }}</span>
                        <span class="file-size">{{ file.size }} KB</span>
                      </div>
                      <button type="button" class="btn-remove" (click)="removeIdFile(idx)">&times;</button>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" class="btn btn-success w-100">
                🗝️ Register Check-in & Activate Room Key
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkin-container {
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

    .btn-actions {
      display: flex;
      gap: 6px;
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

    .bill-invoice {
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background-color: var(--bg-secondary);
      padding: 12px;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
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
      max-height: 200px;
      overflow-y: auto;
    }

    .invoice-item {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--fg-primary);
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

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.4);
      z-index: 500;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-card {
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      width: 480px;
      max-width: 90vw;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* Check-In Form Layout */
    .row {
      display: flex;
      gap: 16px;
    }

    .col {
      flex: 1;
    }

    .max-w-700 {
      max-width: 700px;
      margin: 0 auto;
    }

    /* Uploader Area */
    .upload-zone {
      border: 2px dashed var(--border-color);
      border-radius: var(--border-radius);
      background-color: var(--bg-secondary);
      padding: 24px;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.15s ease;
    }

    .upload-zone:hover {
      border-color: var(--primary-color);
      background-color: var(--primary-accent);
    }

    .upload-zone span {
      font-size: 13px;
      color: var(--fg-secondary);
    }

    /* ID Proof Carousel Preview */
    .id-carousel {
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 10px;
      background-color: var(--bg-primary);
    }

    .id-carousel h5 {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--fg-muted);
      margin-bottom: 8px;
    }

    .carousel-track {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .id-card-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--border-muted);
      background-color: var(--bg-secondary);
      padding: 6px 10px;
      border-radius: 4px;
      min-width: 160px;
      position: relative;
    }

    .id-icon {
      font-size: 18px;
    }

    .id-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .file-name {
      font-size: 11px;
      font-weight: 600;
      color: var(--fg-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 9px;
      color: var(--fg-muted);
    }

    .btn-remove {
      background: none;
      border: none;
      color: var(--danger-color);
      font-size: 14px;
      font-weight: bold;
      position: absolute;
      top: 2px;
      right: 4px;
      cursor: pointer;
    }
  `]
})
export class CheckInOutComponent implements OnInit {
  private dbService = inject(MockDbService);
  private router = inject(Router);

  activeTab = signal<'registry' | 'checkin'>('registry');

  // Loaded Db states
  activeGuests = signal<Invoice[]>([]);
  availableRooms = signal<Entity[]>([]);

  // Selections
  selectedGuestInvoice = signal<Invoice | null>(null);

  // Add custom service charge state
  showServiceModal = signal<boolean>(false);
  targetGuestForService = signal<Invoice | null>(null);
  newServiceName = 'Airport Cab Transfer';
  customServiceDescription = '';
  newServicePrice = 40;

  // Manual Check-In form values
  checkInForm = {
    name: '',
    email: '',
    roomId: '',
    checkInDays: 1,
    prepayment: 0
  };
  mockUploadedFiles: Array<{ name: string, size: number }> = [];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dbService.getCheckedInGuests().subscribe(list => {
      this.activeGuests.set(list);
    });
    this.dbService.getEntities().subscribe(list => {
      // Available rooms configured
      this.availableRooms.set(list.filter(e => e.type === 'room' && e.status === 'available'));
    });
  }

  setTab(tab: 'registry' | 'checkin') {
    this.activeTab.set(tab);
    this.clearSelection();
  }

  selectGuest(invoice: Invoice) {
    this.selectedGuestInvoice.set(invoice);
  }

  clearSelection() {
    this.selectedGuestInvoice.set(null);
  }

  orderRoomFood(invoice: Invoice) {
    if (!invoice.entityId) return;
    // Route to KOT order placement screen with pre-selected room
    this.router.navigate(['/admin/kot'], {
      queryParams: {
        roomId: invoice.entityId
      }
    });
  }

  settleCheckout(invoiceId: string) {
    const guest = this.activeGuests().find(g => g.id === invoiceId);
    if (!guest) return;

    if (confirm(`Check-out guest ${guest.guestName} from ${guest.entityName}? Settle final balance of $${guest.total}.`)) {
      this.dbService.checkOutGuest(invoiceId).subscribe(() => {
        alert('Check-out completed successfully! Room is released to housekeeping queue.');
        this.clearSelection();
        this.loadData();
      });
    }
  }

  // --- Add Service Modal Actions ---

  openServiceModal(guest: Invoice) {
    this.targetGuestForService.set(guest);
    this.newServiceName = 'Airport Cab Transfer';
    this.customServiceDescription = '';
    this.newServicePrice = 40;
    this.showServiceModal.set(true);
  }

  closeServiceModal() {
    this.showServiceModal.set(false);
    this.targetGuestForService.set(null);
  }

  postServiceCharge(event: Event) {
    event.preventDefault();
    const target = this.targetGuestForService();
    if (!target) return;

    const desc = this.newServiceName === 'Custom Value Add-on' 
      ? this.customServiceDescription 
      : this.newServiceName;

    const chargeItem: InvoiceItem = {
      description: desc,
      amount: this.newServicePrice
    };

    this.dbService.addInvoiceItem(target.id, chargeItem).subscribe(() => {
      alert(`Service charge of $${this.newServicePrice} posted to guest invoice.`);
      this.closeServiceModal();
      this.loadData();
      // Auto-refresh detail panel if currently viewing details of this guest
      if (this.selectedGuestInvoice()?.id === target.id) {
        this.dbService.getCheckedInGuests().subscribe(list => {
          const fresh = list.find(g => g.id === target.id);
          if (fresh) this.selectedGuestInvoice.set(fresh);
        });
      }
    });
  }

  // --- Manual Check-In Actions ---

  triggerFileInput() {
    // Standard uploader trigger
    const inputEl = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (inputEl) inputEl.click();
  }

  onIdUpload(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      // Generate simulated attachment size
      this.mockUploadedFiles.push({
        name: f.name,
        size: Math.round(f.size / 1024)
      });
    }
  }

  removeIdFile(idx: number) {
    this.mockUploadedFiles.splice(idx, 1);
  }

  submitCheckIn(event: Event) {
    event.preventDefault();
    const { name, email, roomId, checkInDays, prepayment } = this.checkInForm;
    if (!name || !email || !roomId || checkInDays < 1) {
      alert('Please fill out all check-in fields.');
      return;
    }

    const proofList = this.mockUploadedFiles.map(f => f.name);

    this.dbService.checkInGuest({
      name,
      email,
      roomId,
      idProofs: proofList,
      prepayment: prepayment || 0,
      checkInDays
    }).subscribe(() => {
      alert(`Guest check-in registered! Room key activated.`);
      // Reset values
      this.checkInForm = {
        name: '',
        email: '',
        roomId: '',
        checkInDays: 1,
        prepayment: 0
      };
      this.mockUploadedFiles = [];
      this.setTab('registry');
      this.loadData();
    });
  }
}
