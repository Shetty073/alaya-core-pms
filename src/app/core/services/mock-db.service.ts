import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Property {
  id: string;
  name: string;
  type: 'hotel' | 'resort' | 'restaurant' | 'other';
  location: string;
  description: string;
  imageUrl?: string;
}

export interface Entity {
  id: string;
  propertyId: string;
  name: string;
  type: 'room' | 'table' | 'cab' | 'service';
  subtype?: string; // e.g. "Deluxe", "Suite", "Sedan", "SUV"
  price: number;
  status: 'available' | 'occupied' | 'dirty' | 'maintenance';
  imageUrl?: string;
}

export interface KOTItem {
  name: string;
  qty: number;
  notes?: string;
}

export interface KOTOrder {
  id: string;
  propertyId: string;
  entityId: string; // table ID or room ID
  entityName: string;
  items: KOTItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served';
  timestamp: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string; // "food", "beverage", "linens", "cleaning", "amenities"
  qty: number;
  unit: string;
  reorderLevel: number;
  unitCost: number;
  supplier: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'receptionist' | 'chef' | 'housekeeper' | 'driver' | 'guest';
  accessModules: string[];
}

export interface HousekeepingTask {
  id: string;
  entityId: string; // room ID
  entityName: string;
  housekeeperId?: string;
  housekeeperName?: string;
  status: 'dirty' | 'cleaning' | 'clean';
  notes?: string;
  updatedAt: number;
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  guestName: string;
  guestEmail: string;
  entityId?: string;
  entityName?: string;
  items: InvoiceItem[];
  total: number;
  status: 'unpaid' | 'paid';
  date: number;
}

export interface FinancialRecord {
  id: string;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
  date: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class MockDbService {
  // Active state signals for internal tracking
  private properties = signal<Property[]>([]);
  private entities = signal<Entity[]>([]);
  private kotOrders = signal<KOTOrder[]>([]);
  private inventory = signal<InventoryItem[]>([]);
  private staffList = signal<Staff[]>([]);
  private housekeepingTasks = signal<HousekeepingTask[]>([]);
  private invoices = signal<Invoice[]>([]);
  private financialRecords = signal<FinancialRecord[]>([]);

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    // Attempt to load from local storage first, else initialize with mock data
    const getLocal = <T>(key: string, fallback: T): T => {
      const val = localStorage.getItem(`alaya_pms_${key}`);
      return val ? JSON.parse(val) : fallback;
    };

    const initialProperties: Property[] = [
      { 
        id: 'prop-1', 
        name: 'Alaya Grand Plaza', 
        type: 'hotel', 
        location: 'Goa, Beachfront', 
        description: 'Premium 5-star beachfront resort featuring world-class oceanfront views, serene day-spa centers, and luxury suites.',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=60'
      },
      { 
        id: 'prop-2', 
        name: 'Alaya Bistro & Kitchen', 
        type: 'restaurant', 
        location: 'Goa, Beachfront', 
        description: 'Oceanview dining offering coastal delicacies, fresh seafood harvests, open wood-fire grills, and premium cocktails.',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=60'
      },
      { 
        id: 'prop-3', 
        name: 'Alaya Hills Retreat', 
        type: 'resort', 
        location: 'Manali, Valley View', 
        description: 'Luxury mountain resort with pine log chalets, hot mineral springs pools, and panoramas of snow-capped peaks.',
        imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&auto=format&fit=crop&q=60'
      }
    ];

    const initialEntities: Entity[] = [
      // Rooms at Grand Plaza
      { id: 'ent-101', propertyId: 'prop-1', name: 'Room 101', type: 'room', subtype: 'Deluxe Suite', price: 150, status: 'available', imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&auto=format&fit=crop&q=60' },
      { id: 'ent-102', propertyId: 'prop-1', name: 'Room 102', type: 'room', subtype: 'Deluxe Suite', price: 150, status: 'occupied', imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&auto=format&fit=crop&q=60' },
      { id: 'ent-103', propertyId: 'prop-1', name: 'Room 103', type: 'room', subtype: 'Presidential Suite', price: 300, status: 'dirty', imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&auto=format&fit=crop&q=60' },
      { id: 'ent-104', propertyId: 'prop-1', name: 'Room 104', type: 'room', subtype: 'Standard Room', price: 90, status: 'maintenance', imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=500&auto=format&fit=crop&q=60' },
      { id: 'ent-105', propertyId: 'prop-1', name: 'Room 105', type: 'room', subtype: 'Standard Room', price: 90, status: 'available', imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=500&auto=format&fit=crop&q=60' },
      
      // Rooms at Alaya Hills Retreat
      { id: 'ent-301', propertyId: 'prop-3', name: 'Cabin 301', type: 'room', subtype: 'Mountain Lodge Suite', price: 180, status: 'available', imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format&fit=crop&q=60' },
      { id: 'ent-302', propertyId: 'prop-3', name: 'Cabin 302', type: 'room', subtype: 'Alpine Chalet Deluxe', price: 240, status: 'available', imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=500&auto=format&fit=crop&q=60' },

      // Tables at Alaya Bistro
      { id: 'ent-t1', propertyId: 'prop-2', name: 'Table 1', type: 'table', subtype: '2-Seater', price: 0, status: 'available' },
      { id: 'ent-t2', propertyId: 'prop-2', name: 'Table 2', type: 'table', subtype: '4-Seater', price: 0, status: 'occupied' },
      { id: 'ent-t3', propertyId: 'prop-2', name: 'Table 3', type: 'table', subtype: '6-Seater', price: 0, status: 'available' },
      // Cabs
      { id: 'ent-c1', propertyId: 'prop-1', name: 'Cab DL-01', type: 'cab', subtype: 'Toyota Innova (SUV)', price: 40, status: 'available' },
      { id: 'ent-c2', propertyId: 'prop-1', name: 'Cab DL-02', type: 'cab', subtype: 'Honda City (Sedan)', price: 25, status: 'occupied' }
    ];

    const initialKOTOrders: KOTOrder[] = [
      {
        id: 'kot-1001',
        propertyId: 'prop-2',
        entityId: 'ent-t2',
        entityName: 'Table 2',
        items: [
          { name: 'Lobster Thermidor', qty: 1, notes: 'Medium spicy' },
          { name: 'Chardonnay Wine Glass', qty: 2 }
        ],
        status: 'preparing',
        timestamp: Date.now() - 15 * 60 * 1000
      },
      {
        id: 'kot-1002',
        propertyId: 'prop-2',
        entityId: 'ent-t1',
        entityName: 'Table 1',
        items: [
          { name: 'Garlic Butter Naan', qty: 3 },
          { name: 'Butter Chicken Grand', qty: 1 }
        ],
        status: 'pending',
        timestamp: Date.now() - 5 * 60 * 1000
      }
    ];

    const initialInventory: InventoryItem[] = [
      { id: 'inv-1', name: 'Premium Basmati Rice', category: 'food', qty: 120, unit: 'kg', reorderLevel: 50, unitCost: 1.8, supplier: 'Agro Farms India' },
      { id: 'inv-2', name: 'Luxury Cotton Bed Sheets', category: 'linens', qty: 85, unit: 'pcs', reorderLevel: 20, unitCost: 12.0, supplier: 'Linen World Ltd' },
      { id: 'inv-3', name: 'All-Purpose Sanitizer Liquid', category: 'cleaning', qty: 8, unit: 'litres', reorderLevel: 15, unitCost: 4.5, supplier: 'CleanChem Suppliers' },
      { id: 'inv-4', name: 'Mini Bar Chocolates', category: 'amenities', qty: 300, unit: 'pcs', reorderLevel: 100, unitCost: 0.8, supplier: 'Nestle Distribution' },
      { id: 'inv-5', name: 'Fresh Lobster', category: 'food', qty: 6, unit: 'kg', reorderLevel: 10, unitCost: 24.0, supplier: 'Goa Coastal Fishery' }
    ];

    const initialStaff: Staff[] = [
      { id: 'st-1', name: 'Administrator Alaya', email: 'admin@alaya.com', role: 'admin', accessModules: ['dashboard', 'properties', 'entities', 'kot', 'inventory', 'staff', 'housekeeping', 'finance'] },
      { id: 'st-2', name: 'Chef Mario', email: 'chef@alaya.com', role: 'chef', accessModules: ['dashboard', 'kot', 'inventory'] },
      { id: 'st-3', name: 'Sarah Clean', email: 'housekeeper@alaya.com', role: 'housekeeper', accessModules: ['housekeeping'] },
      { id: 'st-4', name: 'John Guest', email: 'guest@alaya.com', role: 'guest', accessModules: [] }
    ];

    const initialHousekeeping: HousekeepingTask[] = [
      { id: 'hk-1', entityId: 'ent-103', entityName: 'Room 103 (Presidential)', status: 'dirty', updatedAt: Date.now() - 2 * 60 * 60 * 1000 },
      { id: 'hk-2', entityId: 'ent-104', entityName: 'Room 104 (Standard Room)', status: 'cleaning', housekeeperId: 'st-3', housekeeperName: 'Sarah Clean', updatedAt: Date.now() - 30 * 60 * 1000 }
    ];

    const initialInvoices: Invoice[] = [
      {
        id: 'inv-2001',
        guestName: 'Richard Miller',
        guestEmail: 'richard@gmail.com',
        entityId: 'ent-102',
        entityName: 'Room 102',
        items: [
          { description: 'Room Booking (2 nights)', amount: 300 },
          { description: 'Mini Bar Charges', amount: 25 },
          { description: 'In-room Dining Order #kot-990', amount: 45 }
        ],
        total: 370,
        status: 'paid',
        date: Date.now() - 1 * 24 * 60 * 60 * 1000
      },
      {
        id: 'inv-2002',
        guestName: 'Emma Watson',
        guestEmail: 'emma@gmail.com',
        entityId: 'ent-102',
        entityName: 'Room 102',
        items: [
          { description: 'Room Booking (1 night)', amount: 150 },
          { description: 'Airport Cab Transfer', amount: 40 }
        ],
        total: 190,
        status: 'unpaid',
        date: Date.now()
      }
    ];

    const initialFinance: FinancialRecord[] = [
      { id: 'fin-1', type: 'revenue', category: 'Room Bookings', amount: 370, date: Date.now() - 1 * 24 * 60 * 60 * 1000, description: 'Invoice inv-2001 Payment' },
      { id: 'fin-2', type: 'expense', category: 'Purchase Orders', amount: 180, date: Date.now() - 2 * 24 * 60 * 60 * 1000, description: 'Restocking Rice & Fresh Seafood' },
      { id: 'fin-3', type: 'expense', category: 'Salary', amount: 1200, date: Date.now() - 5 * 24 * 60 * 60 * 1000, description: 'Staff Salary Payout for May' },
      { id: 'fin-4', type: 'revenue', category: 'KOT Restaurant', amount: 145, date: Date.now() - 12 * 60 * 60 * 1000, description: 'Table 5 Food Bill' }
    ];

    this.properties.set(getLocal('properties', initialProperties));
    this.entities.set(getLocal('entities', initialEntities));
    this.kotOrders.set(getLocal('kotOrders', initialKOTOrders));
    this.inventory.set(getLocal('inventory', initialInventory));
    this.staffList.set(getLocal('staff', initialStaff));
    this.housekeepingTasks.set(getLocal('housekeeping', initialHousekeeping));
    this.invoices.set(getLocal('invoices', initialInvoices));
    this.financialRecords.set(getLocal('finance', initialFinance));

    this.syncAll();
  }

  private sync(key: string, data: any) {
    localStorage.setItem(`alaya_pms_${key}`, JSON.stringify(data));
  }

  private syncAll() {
    this.sync('properties', this.properties());
    this.sync('entities', this.entities());
    this.sync('kotOrders', this.kotOrders());
    this.sync('inventory', this.inventory());
    this.sync('staff', this.staffList());
    this.sync('housekeeping', this.housekeepingTasks());
    this.sync('invoices', this.invoices());
    this.sync('finance', this.financialRecords());
  }

  // API-Ready Observable Accessors

  // --- Properties ---
  getProperties(): Observable<Property[]> {
    return of(this.properties()).pipe(delay(150));
  }

  addProperty(property: Omit<Property, 'id'>): Observable<Property> {
    const newProp: Property = { ...property, id: `prop-${Date.now()}` };
    this.properties.update(p => [...p, newProp]);
    this.sync('properties', this.properties());
    return of(newProp).pipe(delay(150));
  }

  // --- Entities (Rooms, tables, cabs) ---
  getEntities(): Observable<Entity[]> {
    return of(this.entities()).pipe(delay(150));
  }

  addEntity(entity: Omit<Entity, 'id'>): Observable<Entity> {
    const newEnt: Entity = { ...entity, id: `ent-${Date.now()}` };
    this.entities.update(e => [...e, newEnt]);
    this.sync('entities', this.entities());

    // If it's a room and is dirty, make housekeeping task
    if (newEnt.type === 'room' && newEnt.status === 'dirty') {
      this.createHousekeepingTask(newEnt.id, newEnt.name).subscribe();
    }

    return of(newEnt).pipe(delay(150));
  }

  updateEntityStatus(id: string, status: Entity['status']): Observable<Entity> {
    let updated: Entity | null = null;
    this.entities.update(list => list.map(item => {
      if (item.id === id) {
        updated = { ...item, status };
        
        // Trigger housekeeping status sync if it is a room
        if (item.type === 'room') {
          this.syncHousekeepingStatus(id, status);
        }

        return updated;
      }
      return item;
    }));
    this.sync('entities', this.entities());
    return updated ? of(updated as Entity).pipe(delay(100)) : throwError(() => new Error('Entity not found'));
  }

  // --- Kitchen Order Tickets (KOT) ---
  getKOTOrders(): Observable<KOTOrder[]> {
    return of(this.kotOrders()).pipe(delay(150));
  }

  createKOTOrder(order: Omit<KOTOrder, 'id' | 'timestamp'>): Observable<KOTOrder> {
    const newOrder: KOTOrder = {
      ...order,
      id: `kot-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: Date.now()
    };
    this.kotOrders.update(k => [...k, newOrder]);
    this.sync('kotOrders', this.kotOrders());
    return of(newOrder).pipe(delay(150));
  }

  updateKOTStatus(id: string, status: KOTOrder['status']): Observable<KOTOrder> {
    let updated: KOTOrder | null = null;
    this.kotOrders.update(list => list.map(item => {
      if (item.id === id) {
        updated = { ...item, status };

        // If served, log revenue automatically and complete payment
        if (status === 'served') {
          const totalAmount = item.items.reduce((sum, current) => {
            // Mock price lookup: 15 per item on average
            return sum + (current.qty * 15);
          }, 0);
          this.addFinancialRecord({
            type: 'revenue',
            category: 'KOT Restaurant',
            amount: totalAmount,
            description: `Order ${id} served at ${item.entityName}`
          }).subscribe();
        }

        return updated;
      }
      return item;
    }));
    this.sync('kotOrders', this.kotOrders());
    return updated ? of(updated as KOTOrder).pipe(delay(100)) : throwError(() => new Error('KOT order not found'));
  }

  // --- Inventory ---
  getInventory(): Observable<InventoryItem[]> {
    return of(this.inventory()).pipe(delay(150));
  }

  addInventoryItem(item: Omit<InventoryItem, 'id'>): Observable<InventoryItem> {
    const newItem: InventoryItem = { ...item, id: `inv-${Date.now()}` };
    this.inventory.update(inv => [...inv, newItem]);
    this.sync('inventory', this.inventory());
    return of(newItem).pipe(delay(150));
  }

  updateInventoryQty(id: string, qty: number): Observable<InventoryItem> {
    let updated: InventoryItem | null = null;
    this.inventory.update(list => list.map(item => {
      if (item.id === id) {
        updated = { ...item, qty };
        return updated;
      }
      return item;
    }));
    this.sync('inventory', this.inventory());
    return updated ? of(updated as InventoryItem).pipe(delay(100)) : throwError(() => new Error('Inventory item not found'));
  }

  // --- Staff ---
  getStaff(): Observable<Staff[]> {
    return of(this.staffList()).pipe(delay(150));
  }

  addStaff(staff: Omit<Staff, 'id'>): Observable<Staff> {
    const newStaff: Staff = { ...staff, id: `st-${Date.now()}` };
    this.staffList.update(list => [...list, newStaff]);
    this.sync('staff', this.staffList());
    return of(newStaff).pipe(delay(150));
  }

  // --- Housekeeping ---
  getHousekeepingTasks(): Observable<HousekeepingTask[]> {
    return of(this.housekeepingTasks()).pipe(delay(150));
  }

  createHousekeepingTask(entityId: string, entityName: string): Observable<HousekeepingTask> {
    // Check if task already exists
    const existing = this.housekeepingTasks().find(t => t.entityId === entityId && t.status !== 'clean');
    if (existing) {
      return of(existing);
    }
    const newTask: HousekeepingTask = {
      id: `hk-${Date.now()}`,
      entityId,
      entityName,
      status: 'dirty',
      updatedAt: Date.now()
    };
    this.housekeepingTasks.update(tasks => [...tasks, newTask]);
    this.sync('housekeeping', this.housekeepingTasks());
    return of(newTask);
  }

  assignHousekeeper(taskId: string, housekeeperId: string, housekeeperName: string): Observable<HousekeepingTask> {
    let updated: HousekeepingTask | null = null;
    this.housekeepingTasks.update(list => list.map(task => {
      if (task.id === taskId) {
        updated = { ...task, housekeeperId, housekeeperName, status: 'cleaning', updatedAt: Date.now() };
        // Sync back to entity
        this.updateEntityStatusSync(task.entityId, 'dirty');
        return updated;
      }
      return task;
    }));
    this.sync('housekeeping', this.housekeepingTasks());
    return updated ? of(updated as HousekeepingTask).pipe(delay(100)) : throwError(() => new Error('Task not found'));
  }

  updateHousekeepingStatus(taskId: string, status: HousekeepingTask['status']): Observable<HousekeepingTask> {
    let updated: HousekeepingTask | null = null;
    this.housekeepingTasks.update(list => list.map(task => {
      if (task.id === taskId) {
        updated = { ...task, status, updatedAt: Date.now() };
        // Sync entity status
        const entityStatus = status === 'clean' ? 'available' : 'dirty';
        this.updateEntityStatusSync(task.entityId, entityStatus);
        return updated;
      }
      return task;
    }));
    this.sync('housekeeping', this.housekeepingTasks());
    return updated ? of(updated as HousekeepingTask).pipe(delay(100)) : throwError(() => new Error('Task not found'));
  }

  private updateEntityStatusSync(entityId: string, status: Entity['status']) {
    this.entities.update(list => list.map(ent => ent.id === entityId ? { ...ent, status } : ent));
    this.sync('entities', this.entities());
  }

  private syncHousekeepingStatus(roomId: string, entityStatus: Entity['status']) {
    if (entityStatus === 'dirty') {
      this.createHousekeepingTask(roomId, `Room ${roomId.replace('ent-', '')}`).subscribe();
    } else if (entityStatus === 'available') {
      // Complete active task
      this.housekeepingTasks.update(list => list.map(task => 
        (task.entityId === roomId && task.status !== 'clean') ? { ...task, status: 'clean', updatedAt: Date.now() } : task
      ));
      this.sync('housekeeping', this.housekeepingTasks());
    }
  }

  // --- Invoices & Billing ---
  getInvoices(): Observable<Invoice[]> {
    return of(this.invoices()).pipe(delay(150));
  }

  createInvoice(invoice: Omit<Invoice, 'id' | 'date'>): Observable<Invoice> {
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      date: Date.now()
    };
    this.invoices.update(invs => [...invs, newInvoice]);
    this.sync('invoices', this.invoices());

    // If paid, log financial record immediately
    if (newInvoice.status === 'paid') {
      this.addFinancialRecord({
        type: 'revenue',
        category: newInvoice.entityName?.includes('Room') ? 'Room Bookings' : 'Services',
        amount: newInvoice.total,
        description: `Invoice ${newInvoice.id} Payment Received`
      }).subscribe();
    }

    return of(newInvoice).pipe(delay(150));
  }

  payInvoice(id: string): Observable<Invoice> {
    let updated: Invoice | null = null;
    this.invoices.update(list => list.map(inv => {
      if (inv.id === id) {
        updated = { ...inv, status: 'paid' };
        
        // Log revenue in finance ledger
        this.addFinancialRecord({
          type: 'revenue',
          category: inv.entityName?.includes('Room') ? 'Room Bookings' : 'Services',
          amount: inv.total,
          description: `Invoice ${id} paid by guest`
        }).subscribe();

        // Mark corresponding entity as checkout/available
        if (inv.entityId) {
          this.updateEntityStatus(inv.entityId, 'dirty').subscribe(); // Needs cleaning after guest leaves
        }

        return updated;
      }
      return inv;
    }));
    this.sync('invoices', this.invoices());
    return updated ? of(updated as Invoice).pipe(delay(100)) : throwError(() => new Error('Invoice not found'));
  }

  // --- Finance Management ---
  getFinancialRecords(): Observable<FinancialRecord[]> {
    return of(this.financialRecords()).pipe(delay(150));
  }

  addFinancialRecord(record: Omit<FinancialRecord, 'id' | 'date'>): Observable<FinancialRecord> {
    const newRecord: FinancialRecord = {
      ...record,
      id: `fin-${Date.now()}`,
      date: Date.now()
    };
    this.financialRecords.update(recs => [...recs, newRecord]);
    this.sync('finance', this.financialRecords());
    return of(newRecord).pipe(delay(100));
  }
}
