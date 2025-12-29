/**
 * Order Types for Order Ecosystem 2.0
 * Complete order management with customer tracking
 */

// ══════════════════════════════════════════════════════════════════
// ORDER STATUS
// ══════════════════════════════════════════════════════════════════

export type OrderStatus = 
  | 'pending'           // Recebido, aguardando preparo
  | 'preparing'         // Em preparo na cozinha
  | 'ready'             // Pronto para entrega
  | 'delivered'         // Entregue ao cliente
  | 'billing_requested' // Cliente pediu a conta
  | 'closed';           // Pago e finalizado

export type ItemStatus = 'pending' | 'done';

// ══════════════════════════════════════════════════════════════════
// CUSTOMER
// ══════════════════════════════════════════════════════════════════

export interface Customer {
  name: string;
  cpf: string;          // Formato 000.000.000-00
  table?: string;       // Mesa (opcional)
  phone?: string;       // WhatsApp (opcional)
}

// ══════════════════════════════════════════════════════════════════
// ORDER ITEM
// ══════════════════════════════════════════════════════════════════

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  notes?: string;
  status: ItemStatus;   // Controle individual na cozinha
}

// ══════════════════════════════════════════════════════════════════
// ORDER
// ══════════════════════════════════════════════════════════════════

export interface Order {
  id: string;
  restaurantId: string;
  ownerId: string;             // Restaurant owner UID
  
  // Customer Data
  customer: Customer;
  
  // Order Details
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  
  // Status & Tracking
  status: OrderStatus;
  orderNumber: number;         // Sequential number for the day
  isPaid: boolean;             // Payment status for analytics
  
  // Waiter Attribution
  waiterId?: string;           // ID do garçom que lançou
  waiterName?: string;         // Nome do garçom
  tableNumber?: number;        // Número da mesa
  
  // Analytics
  isOrderBumpAccepted: boolean;
  orderBumpItem?: string;
  
  // Delivery
  deliveryType: 'dine_in' | 'takeaway' | 'delivery';
  deliveryAddress?: string;
  
  // Timestamps
  createdAt: any;              // Firestore Timestamp
  updatedAt: any;
  completedAt?: any;
  billingRequestedAt?: any;
}

// ══════════════════════════════════════════════════════════════════
// CART (Client-side state)
// ══════════════════════════════════════════════════════════════════

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  notes?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// ══════════════════════════════════════════════════════════════════
// ORDER BUMP SUGGESTION (From AI)
// ══════════════════════════════════════════════════════════════════

export interface OrderBumpSuggestion {
  itemName: string;
  reason: string;
  suggestedPrice: number;
}

// ══════════════════════════════════════════════════════════════════
// DASHBOARD METRICS
// ══════════════════════════════════════════════════════════════════

export interface DashboardMetrics {
  totalRevenue: number;
  todayRevenue: number;
  activeOrders: number;
  totalOrders: number;
  averageTicket: number;
  conversionRate: number;
  dailySales: { date: string; value: number }[];
  topItems: { name: string; quantity: number; image: string }[];
  recentOrders: Order[];
  
  // Comparison with previous period
  revenueChange: number;
  ordersChange: number;
  ticketChange: number;
}

// ══════════════════════════════════════════════════════════════════
// AI ORGANIZE RESPONSE
// ══════════════════════════════════════════════════════════════════

export interface AISmartOrganizeResponse {
  categories: {
    name: string;
    items: string[];
  }[];
  suggestedHighlights: string[];
  orderBumps: OrderBumpSuggestion[];
  improvedDescriptions: {
    itemName: string;
    newDescription: string;
  }[];
}
