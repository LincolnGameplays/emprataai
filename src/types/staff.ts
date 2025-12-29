/**
 * Staff Types - Team Management
 * User roles and waiter profiles
 */

// ══════════════════════════════════════════════════════════════════
// USER ROLES
// ══════════════════════════════════════════════════════════════════

export type UserRole = 'owner' | 'waiter' | 'kitchen';

// ══════════════════════════════════════════════════════════════════
// WAITER PROFILE
// ══════════════════════════════════════════════════════════════════

export interface WaiterProfile {
  id: string;                    // UID do Firebase Auth ou gerado
  ownerId: string;               // ID do dono do restaurante
  restaurantId: string;          // ID do restaurante vinculado
  
  // Dados Pessoais
  name: string;
  code: string;                  // PIN de 4-6 dígitos para login rápido
  email?: string;                // Para login alternativo
  
  // Status
  active: boolean;
  isOnline: boolean;
  lastActiveAt?: any;            // Timestamp
  
  // Performance
  performance: WaiterPerformance;
  
  // Timestamps
  createdAt: any;
  updatedAt: any;
}

export interface WaiterPerformance {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  todaySales: number;
  todayOrders: number;
}

// ══════════════════════════════════════════════════════════════════
// STAFF STATS (Dashboard View)
// ══════════════════════════════════════════════════════════════════

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  onlineNow: number;
  totalSalesViaWaiters: number;
  topPerformer: {
    name: string;
    sales: number;
  } | null;
}

// ══════════════════════════════════════════════════════════════════
// TABLE MANAGEMENT
// ══════════════════════════════════════════════════════════════════

export interface TableAssignment {
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  customerId?: string;
  customerCpf?: string;
  status: 'occupied' | 'billing' | 'free';
  startedAt: any;
}

// ══════════════════════════════════════════════════════════════════
// WAITER SESSION
// ══════════════════════════════════════════════════════════════════

export interface WaiterSession {
  waiterId: string;
  waiterName: string;
  restaurantId: string;
  ownerId: string;
  loginAt: Date;
  currentTables: number[];
}

// ══════════════════════════════════════════════════════════════════
// CREATE WAITER DTO
// ══════════════════════════════════════════════════════════════════

export interface CreateWaiterInput {
  name: string;
  code: string;
  ownerId: string;
  restaurantId: string;
}
