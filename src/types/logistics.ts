/**
 * Emprata Logistics - Type Definitions
 * Driver management and delivery tracking
 */

// ══════════════════════════════════════════════════════════════════
// DRIVER TYPES
// ══════════════════════════════════════════════════════════════════

export type DriverStatus = 'available' | 'busy' | 'offline';

export interface Driver {
  id: string;
  restaurantId: string; // Owner ID
  name: string;
  phone: string;
  pixKey?: string;
  pin: string; // 4-digit PIN for login
  active: boolean;
  currentStatus: DriverStatus;
  totalDeliveriesToday: number;
  createdAt: any; // Firestore Timestamp
}

// ══════════════════════════════════════════════════════════════════
// DELIVERY TRACKING
// ══════════════════════════════════════════════════════════════════

export interface DeliveryCoords {
  lat: number;
  lng: number;
}

export interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  zipCode?: string;
  reference?: string;
}

// ══════════════════════════════════════════════════════════════════
// PAYOUT TRACKING
// ══════════════════════════════════════════════════════════════════

export interface DriverPayoutSummary {
  driverId: string;
  driverName: string;
  totalDeliveries: number;
  totalFees: number; // Sum of all deliveryFee
  cashCollected: number; // Sum of orders paid in cash
  balance: number; // cashCollected - totalFees (what driver owes or is owed)
  date: string; // YYYY-MM-DD
}
