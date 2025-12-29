export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'billing_requested' | 'closed' | 'cancelled';

export interface Customer {
  name: string;
  cpf: string; // Formato 000.000.000-00
  phone?: string;
  table?: string;
  // Delivery address (optional for dine-in)
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    zipCode?: string;
    reference?: string;
  };
}

export interface OrderItem {
  id: string; // ID único do item no pedido (uuid)
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  image?: string;
}

export interface Order {
  id: string;
  restaurantId: string; // Owner ID
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: any; // Firestore Timestamp
  paymentMethod: 'pix' | 'credit' | 'debit' | 'cash';
  isOrderBumpAccepted: boolean; // Se aceitou a sugestão da IA
  
  // ══════════════════════════════════════════════════════════════════
  // LOGISTICS FIELDS
  // ══════════════════════════════════════════════════════════════════
  driverId?: string; // Assigned driver
  driverName?: string; // Denormalized for display
  deliveryFee?: number; // Fee paid to driver
  dispatchedAt?: any; // When driver left with order
  deliveredAt?: any; // When delivery confirmed
  
  // ══════════════════════════════════════════════════════════════════
  // SECURITY PIN PROTOCOL
  // ══════════════════════════════════════════════════════════════════
  deliveryPin?: string; // 4-digit code for customer verification
  deliveryProofUrl?: string; // Photo proof if left at doorstep/portaria
  deliveryAttemptCoords?: { lat: number; lng: number }; // GPS at delivery
}

