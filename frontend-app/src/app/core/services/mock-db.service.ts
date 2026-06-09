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
  billingStatus?: 'pending' | 'billed' | 'charged_to_room';
  deliveryTime?: string;
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
  role: string;
  accessModules: string[];
  phone?: string;
  employeeCode?: string;
  joinDate?: string;
  status?: 'active' | 'suspended';
  idProofs?: string[];
}

export interface ModuleMaster {
  id: string;
  name: string;
}

export interface PermissionMaster {
  id: string;
  name: string;
}

export interface RoleMaster {
  id: string;
  name: string;
  permissions: Record<string, string[]>;
}

export interface TransactionalLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  module: string;
  timestamp: number;
  details?: string;
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
  idProofs?: string[];
  prepayment?: number;
  checkedInAt?: number;
  checkedOutAt?: number;
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
  private modulesMaster = signal<ModuleMaster[]>([]);
  private permissionsMaster = signal<PermissionMaster[]>([]);
  private rolesMaster = signal<RoleMaster[]>([]);
  private transactionalLogs = signal<TransactionalLog[]>([]);

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
      { id: 'st-1', name: 'Administrator Alaya', email: 'admin@alaya.com', role: 'admin', accessModules: ['dashboard', 'properties', 'entities', 'kot', 'inventory', 'staff', 'housekeeping', 'finance'], employeeCode: 'EMP-001', phone: '9876543210', joinDate: '2025-01-15', status: 'active', idProofs: ['id_card.png'] },
      { id: 'st-2', name: 'Chef Mario', email: 'chef@alaya.com', role: 'chef', accessModules: ['dashboard', 'kot', 'inventory'], employeeCode: 'EMP-002', phone: '9876543211', joinDate: '2025-02-10', status: 'active', idProofs: ['health_cert.pdf'] },
      { id: 'st-3', name: 'Sarah Clean', email: 'housekeeper@alaya.com', role: 'housekeeper', accessModules: ['housekeeping'], employeeCode: 'EMP-003', phone: '9876543212', joinDate: '2025-03-20', status: 'active', idProofs: ['aadhaar_scan.jpg'] },
      { id: 'st-4', name: 'John Guest', email: 'guest@alaya.com', role: 'guest', accessModules: [], employeeCode: 'EMP-004', phone: '9876543213', joinDate: '2026-05-01', status: 'active', idProofs: [] },
      { id: 'st-5', name: 'Front Desk Fiona', email: 'receptionist@alaya.com', role: 'receptionist', accessModules: ['dashboard', 'entities', 'housekeeping', 'check-in-out'], employeeCode: 'EMP-005', phone: '9876543214', joinDate: '2025-06-01', status: 'active', idProofs: ['dl_scan.jpg'] },
      { id: 'st-6', name: 'Captain Jack', email: 'captain@alaya.com', role: 'captain', accessModules: ['kot'], employeeCode: 'EMP-006', phone: '9876543215', joinDate: '2025-08-12', status: 'active', idProofs: ['passport_scan.pdf'] },
      { id: 'st-7', name: 'Biller Bill', email: 'biller@alaya.com', role: 'biller', accessModules: ['restaurant-billing', 'kot'], employeeCode: 'EMP-007', phone: '9876543216', joinDate: '2025-10-05', status: 'active', idProofs: ['voter_id.jpg'] }
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

    const initialModules: ModuleMaster[] = [
      { id: 'dashboard', name: 'Dashboard' },
      { id: 'properties', name: 'Properties' },
      { id: 'entities', name: 'Entities' },
      { id: 'kot', name: 'KOT Restaurant' },
      { id: 'billing', name: 'Restaurant Billing' },
      { id: 'inventory', name: 'Inventory' },
      { id: 'staff', name: 'User Management' },
      { id: 'housekeeping', name: 'Housekeeping' },
      { id: 'finance', name: 'Finance & Invoices' }
    ];

    const initialPermissions: PermissionMaster[] = [
      { id: 'read', name: 'Read' },
      { id: 'write', name: 'Write' },
      { id: 'delete', name: 'Delete' },
      { id: 'settle', name: 'Settle Payments' },
      { id: 'assign', name: 'Assign Tasks' }
    ];

    const initialRoles: RoleMaster[] = [
      {
        id: 'admin',
        name: 'Admin',
        permissions: {
          'dashboard': ['read', 'write', 'delete', 'settle', 'assign'],
          'properties': ['read', 'write', 'delete'],
          'entities': ['read', 'write', 'delete'],
          'kot': ['read', 'write', 'delete'],
          'billing': ['read', 'write', 'delete', 'settle'],
          'inventory': ['read', 'write', 'delete'],
          'staff': ['read', 'write', 'delete'],
          'housekeeping': ['read', 'write', 'assign'],
          'finance': ['read', 'write', 'delete']
        }
      },
      {
        id: 'receptionist',
        name: 'Receptionist',
        permissions: {
          'dashboard': ['read'],
          'entities': ['read', 'write'],
          'housekeeping': ['read', 'write', 'assign'],
          'staff': ['read']
        }
      },
      {
        id: 'captain',
        name: 'Captain',
        permissions: {
          'kot': ['read', 'write']
        }
      },
      {
        id: 'biller',
        name: 'Biller',
        permissions: {
          'kot': ['read', 'write'],
          'billing': ['read', 'write', 'settle']
        }
      },
      {
        id: 'chef',
        name: 'Chef',
        permissions: {
          'dashboard': ['read'],
          'kot': ['read', 'write'],
          'inventory': ['read', 'write']
        }
      },
      {
        id: 'housekeeper',
        name: 'Housekeeper',
        permissions: {
          'housekeeping': ['read', 'write']
        }
      }
    ];

    const initialLogs: TransactionalLog[] = [
      { id: 'log-1', userId: 'st-5', userEmail: 'receptionist@alaya.com', userName: 'Front Desk Fiona', action: 'Guest Check-In', module: 'Entities', timestamp: Date.now() - 3600000, details: 'Checked in Richard Miller for Room 102' },
      { id: 'log-2', userId: 'st-6', userEmail: 'captain@alaya.com', userName: 'Captain Jack', action: 'KOT Created', module: 'KOT Restaurant', timestamp: Date.now() - 1800000, details: 'Placed order for Table 2' },
      { id: 'log-3', userId: 'st-7', userEmail: 'biller@alaya.com', userName: 'Biller Bill', action: 'Direct Settle', module: 'Restaurant Billing', timestamp: Date.now() - 900000, details: 'Settled bill for order kot-1001' },
      { id: 'log-4', userId: 'st-1', userEmail: 'admin@alaya.com', userName: 'Administrator Alaya', action: 'Role Update', module: 'User Management', timestamp: Date.now() - 300000, details: 'Modified permissions for role receptionist' }
    ];

    this.properties.set(getLocal('properties', initialProperties));
    this.entities.set(getLocal('entities', initialEntities));
    this.kotOrders.set(getLocal('kotOrders', initialKOTOrders));
    this.inventory.set(getLocal('inventory', initialInventory));
    this.staffList.set(getLocal('staff', initialStaff));
    this.housekeepingTasks.set(getLocal('housekeeping', initialHousekeeping));
    this.invoices.set(getLocal('invoices', initialInvoices));
    this.financialRecords.set(getLocal('finance', initialFinance));
    this.modulesMaster.set(getLocal('modules', initialModules));
    this.permissionsMaster.set(getLocal('permissions', initialPermissions));
    this.rolesMaster.set(getLocal('roles', initialRoles));
    this.transactionalLogs.set(getLocal('logs', initialLogs));

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
    this.sync('modules', this.modulesMaster());
    this.sync('permissions', this.permissionsMaster());
    this.sync('roles', this.rolesMaster());
    this.sync('logs', this.transactionalLogs());
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
      timestamp: Date.now(),
      billingStatus: 'pending'
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
    this.logAction('st-1', 'Create User', 'User Management', `Created user account for ${staff.name} (${staff.email})`);
    return of(newStaff).pipe(delay(150));
  }

  updateStaff(staff: Staff): Observable<Staff> {
    this.staffList.update(list => list.map(item => item.id === staff.id ? staff : item));
    this.sync('staff', this.staffList());
    this.logAction('st-1', 'Update User', 'User Management', `Updated user account details for ${staff.name}`);
    return of(staff).pipe(delay(100));
  }

  deleteStaff(id: string): Observable<boolean> {
    const user = this.staffList().find(s => s.id === id);
    if (!user) return throwError(() => new Error('User not found'));
    
    this.staffList.update(list => list.filter(item => item.id !== id));
    this.sync('staff', this.staffList());
    this.logAction('st-1', 'Delete User', 'User Management', `Deleted user account for ${user.name}`);
    return of(true).pipe(delay(100));
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

  // --- Guest Registry / Check-In/Out Helpers ---

  getCheckedInGuests(): Observable<Invoice[]> {
    return of(this.invoices().filter(inv => inv.status === 'unpaid' && inv.entityId && this.entities().some(e => e.id === inv.entityId && e.type === 'room'))).pipe(delay(100));
  }

  checkInGuest(data: { name: string, email: string, roomId: string, idProofs: string[], prepayment: number, checkInDays: number }): Observable<Invoice> {
    const room = this.entities().find(e => e.id === data.roomId);
    if (!room) return throwError(() => new Error('Room not found'));
    
    const roomCost = room.price * data.checkInDays;
    const items: InvoiceItem[] = [
      { description: `Room Booking (${data.checkInDays} nights @ $${room.price}/night)`, amount: roomCost }
    ];
    if (data.prepayment > 0) {
      items.push({ description: 'Advance Pre-payment Credit', amount: -data.prepayment });
    }
    
    const invoiceTotal = roomCost - data.prepayment;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      guestName: data.name,
      guestEmail: data.email,
      entityId: data.roomId,
      entityName: room.name,
      items,
      total: invoiceTotal,
      status: 'unpaid',
      date: Date.now(),
      idProofs: data.idProofs,
      prepayment: data.prepayment,
      checkedInAt: Date.now()
    };

    // Update room status to occupied
    this.entities.update(list => list.map(e => e.id === data.roomId ? { ...e, status: 'occupied' as const } : e));
    this.invoices.update(list => [...list, newInvoice]);

    // Log prepayment revenue
    if (data.prepayment > 0) {
      this.addFinancialRecord({
        type: 'revenue',
        category: 'Room Bookings',
        amount: data.prepayment,
        description: `Pre-payment from Guest ${data.name} for Room ${room.name}`
      }).subscribe();
    }
    
    this.logAction('st-5', 'Guest Check-In', 'Entities', `Checked in guest ${data.name} into Room ${room.name}`);
    this.syncAll();
    return of(newInvoice).pipe(delay(150));
  }

  chargeOrderToRoom(orderId: string, invoiceId: string): Observable<boolean> {
    const order = this.kotOrders().find(o => o.id === orderId);
    if (!order) return throwError(() => new Error('Order not found'));
    
    const mockPrices: Record<string, number> = {
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

    const orderTotal = order.items.reduce((sum, item) => sum + (item.qty * (mockPrices[item.name] || 15)), 0);

    let updated = false;
    this.invoices.update(list => list.map(inv => {
      if (inv.id === invoiceId) {
        const updatedItems = [
          ...inv.items,
          { description: `Restaurant Order #${orderId} - Charged to Suite`, amount: orderTotal }
        ];
        updated = true;
        return {
          ...inv,
          items: updatedItems,
          total: inv.total + orderTotal
        };
      }
      return inv;
    }));

    if (updated) {
      this.kotOrders.update(list => list.map(o => o.id === orderId ? { ...o, billingStatus: 'charged_to_room' as const } : o));
      this.logAction('st-7', 'Charge KOT to Room', 'Restaurant Billing', `Charged restaurant order #${orderId} to Room Invoice`);
      this.syncAll();
      return of(true).pipe(delay(100));
    } else {
      return throwError(() => new Error('Room Invoice not found'));
    }
  }

  addInvoiceItem(invoiceId: string, item: { description: string, amount: number }): Observable<Invoice> {
    let updated: Invoice | null = null;
    this.invoices.update(list => list.map(inv => {
      if (inv.id === invoiceId) {
        updated = {
          ...inv,
          items: [...inv.items, item],
          total: inv.total + item.amount
        };
        return updated;
      }
      return inv;
    }));
    if (updated) {
      this.syncAll();
      return of(updated as Invoice).pipe(delay(100));
    } else {
      return throwError(() => new Error('Invoice not found'));
    }
  }

  checkOutGuest(invoiceId: string): Observable<Invoice> {
    const invoice = this.invoices().find(i => i.id === invoiceId);
    if (!invoice) return throwError(() => new Error('Invoice not found'));

    let updated: Invoice | null = null;
    this.invoices.update(list => list.map(inv => {
      if (inv.id === invoiceId) {
        updated = { ...inv, status: 'paid' as const, checkedOutAt: Date.now() };
        return updated;
      }
      return inv;
    }));

    // Flip room status to dirty
    if (invoice.entityId) {
      this.entities.update(list => list.map(e => e.id === invoice.entityId ? { ...e, status: 'dirty' as const } : e));
      this.syncHousekeepingStatus(invoice.entityId, 'dirty');
    }

    // Log the remaining balance as revenue
    const remainingRevenue = invoice.total;
    if (remainingRevenue > 0) {
      this.addFinancialRecord({
        type: 'revenue',
        category: 'Room Bookings',
        amount: remainingRevenue,
        description: `Check-out settle for Invoice ${invoice.id} (${invoice.guestName})`
      }).subscribe();
    }

    this.logAction('st-5', 'Guest Check-Out', 'Entities', `Settled checkout for guest ${invoice.guestName} (${invoice.entityName})`);
    this.syncAll();
    return of(updated as unknown as Invoice).pipe(delay(150));
  }

  // --- Table Master Management ---

  addTable(table: { name: string, subtype: string, propertyId: string }): Observable<Entity> {
    const newTable: Entity = {
      id: `ent-t-${Date.now()}`,
      propertyId: table.propertyId,
      name: table.name,
      type: 'table',
      subtype: table.subtype,
      price: 0,
      status: 'available'
    };
    this.entities.update(list => [...list, newTable]);
    this.sync('entities', this.entities());
    return of(newTable).pipe(delay(100));
  }

  deleteTable(id: string): Observable<boolean> {
    const table = this.entities().find(e => e.id === id && e.type === 'table');
    if (!table) return throwError(() => new Error('Table not found'));
    
    this.entities.update(list => list.filter(e => e.id !== id));
    this.sync('entities', this.entities());
    return of(true).pipe(delay(100));
  }

  settleKOTDirect(orderId: string): Observable<boolean> {
    const order = this.kotOrders().find(o => o.id === orderId);
    if (!order) return throwError(() => new Error('Order not found'));
    
    this.kotOrders.update(list => list.map(o => o.id === orderId ? { ...o, status: 'served' as const, billingStatus: 'billed' as const } : o));
    
    const mockPrices: Record<string, number> = {
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
    const orderTotal = order.items.reduce((sum, item) => sum + (item.qty * (mockPrices[item.name] || 15)), 0);
    this.addFinancialRecord({
      type: 'revenue',
      category: 'KOT Restaurant',
      amount: orderTotal,
      description: `Direct Settle KOT #${orderId} at ${order.entityName}`
    }).subscribe();
    
    this.logAction('st-7', 'Direct Settle KOT', 'Restaurant Billing', `Settled direct cash/card payment for KOT order #${orderId}`);
    this.syncAll();
    return of(true).pipe(delay(100));
  }

  // --- Roles & Modules Master Configurations ---

  getRoles(): Observable<RoleMaster[]> {
    return of(this.rolesMaster()).pipe(delay(100));
  }

  addRole(role: Omit<RoleMaster, 'id'>): Observable<RoleMaster> {
    const newRole: RoleMaster = { ...role, id: `role-${Date.now()}` };
    this.rolesMaster.update(list => [...list, newRole]);
    this.sync('roles', this.rolesMaster());
    this.logAction('st-1', 'Created Role', 'User Management', `Created new user role configuration: ${role.name}`);
    return of(newRole).pipe(delay(100));
  }

  updateRole(role: RoleMaster): Observable<RoleMaster> {
    this.rolesMaster.update(list => list.map(r => r.id === role.id ? role : r));
    this.sync('roles', this.rolesMaster());
    this.logAction('st-1', 'Updated Role', 'User Management', `Updated permissions matrix for role: ${role.name}`);
    return of(role).pipe(delay(100));
  }

  deleteRole(id: string): Observable<boolean> {
    const role = this.rolesMaster().find(r => r.id === id);
    if (!role) return throwError(() => new Error('Role not found'));
    
    this.rolesMaster.update(list => list.filter(r => r.id !== id));
    this.sync('roles', this.rolesMaster());
    this.logAction('st-1', 'Deleted Role', 'User Management', `Deleted user role configuration: ${role.name}`);
    return of(true).pipe(delay(100));
  }

  getModules(): Observable<ModuleMaster[]> {
    return of(this.modulesMaster()).pipe(delay(100));
  }

  addModule(mod: Omit<ModuleMaster, 'id'>): Observable<ModuleMaster> {
    const newMod: ModuleMaster = { ...mod, id: `mod-${Date.now()}` };
    this.modulesMaster.update(list => [...list, newMod]);
    this.sync('modules', this.modulesMaster());
    this.logAction('st-1', 'Created Module', 'User Management', `Created new platform module: ${mod.name}`);
    return of(newMod).pipe(delay(100));
  }

  updateModule(mod: ModuleMaster): Observable<ModuleMaster> {
    this.modulesMaster.update(list => list.map(m => m.id === mod.id ? mod : m));
    this.sync('modules', this.modulesMaster());
    this.logAction('st-1', 'Updated Module', 'User Management', `Updated platform module details: ${mod.name}`);
    return of(mod).pipe(delay(100));
  }

  deleteModule(id: string): Observable<boolean> {
    const mod = this.modulesMaster().find(m => m.id === id);
    if (!mod) return throwError(() => new Error('Module not found'));
    
    this.modulesMaster.update(list => list.filter(m => m.id !== id));
    this.sync('modules', this.modulesMaster());
    this.logAction('st-1', 'Deleted Module', 'User Management', `Deleted platform module: ${mod.name}`);
    return of(true).pipe(delay(100));
  }

  getPermissions(): Observable<PermissionMaster[]> {
    return of(this.permissionsMaster()).pipe(delay(100));
  }

  addPermission(perm: Omit<PermissionMaster, 'id'>): Observable<PermissionMaster> {
    const newPerm: PermissionMaster = { ...perm, id: `perm-${Date.now()}` };
    this.permissionsMaster.update(list => [...list, newPerm]);
    this.sync('permissions', this.permissionsMaster());
    this.logAction('st-1', 'Created Permission', 'User Management', `Created new system permission: ${perm.name}`);
    return of(newPerm).pipe(delay(100));
  }

  updatePermission(perm: PermissionMaster): Observable<PermissionMaster> {
    this.permissionsMaster.update(list => list.map(p => p.id === perm.id ? perm : p));
    this.sync('permissions', this.permissionsMaster());
    this.logAction('st-1', 'Updated Permission', 'User Management', `Updated system permission details: ${perm.name}`);
    return of(perm).pipe(delay(100));
  }

  deletePermission(id: string): Observable<boolean> {
    const perm = this.permissionsMaster().find(p => p.id === id);
    if (!perm) return throwError(() => new Error('Permission not found'));
    
    this.permissionsMaster.update(list => list.filter(p => p.id !== id));
    this.sync('permissions', this.permissionsMaster());
    this.logAction('st-1', 'Deleted Permission', 'User Management', `Deleted system permission: ${perm.name}`);
    return of(true).pipe(delay(100));
  }

  // --- Transactional Logs ---

  getLogs(): Observable<TransactionalLog[]> {
    return of(this.transactionalLogs()).pipe(delay(100));
  }

  logAction(userId: string, action: string, module: string, details?: string): void {
    const user = this.staffList().find(s => s.id === userId) || this.staffList()[0];
    const newLog: TransactionalLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user?.id || 'st-1',
      userEmail: user?.email || 'admin@alaya.com',
      userName: user?.name || 'Administrator Alaya',
      action,
      module,
      timestamp: Date.now(),
      details
    };
    this.transactionalLogs.update(list => [newLog, ...list]);
    this.sync('logs', this.transactionalLogs());
  }
}
