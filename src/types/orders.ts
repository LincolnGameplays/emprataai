export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'billing_requested' | 'closed' | 'cancelled';

export interface Customer {
  name: string;
  cpf: string;
  phone?: string;
  table?: string;
  // Adicionado para suportar Logística e DriverApp
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    complement?: string;
    reference?: string; // Para pontos de referência na entrega
  };
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  image?: string;
  imageUrl?: string;
  category?: string;
  status?: 'pending' | 'done';
}

export interface CartItem extends OrderItem {
  cartId: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  ownerId?: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: any;
  updatedAt?: any;
  completedAt?: any;
  paymentMethod: 'pix' | 'credit' | 'debit' | 'cash';
  isOrderBumpAccepted?: boolean;
  
  // Campos de Logística
  driverId?: string;
  driverName?: string;
  waiterId?: string;
  deliveryFee?: number;
  deliveryPin?: string;
  deliveryProofUrl?: string;
  deliveryAttemptCoords?: { lat: number; lng: number };
  dispatchedAt?: any;
  deliveredAt?: any;
  
  // Campos de Analytics
  isPaid?: boolean;
  discountPercent?: number;
  discountAmount?: number;
  
  // Campos de Restaurante
  restaurant?: {
    name?: string;
    phone?: string;
  };
}

// Tipos para Dashboard e Analytics
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
  revenueChange: number;
  ordersChange: number;
  ticketChange: number;
  // Legacy compatibility
  topSellingItems?: { name: string; quantity: number; revenue: number }[];
  ordersByHour?: { hour: number; count: number }[];
}

// Tipos para IA
export interface AISmartOrganizeResponse {
  categories: {
    title: string;
    description: string;
    items: string[];
  }[];
  orderBumps: {
    itemId: string;
    reason: string;
  }[];
  // Campos adicionais para menuAi.ts
  suggestedHighlights?: string[];
  improvedDescriptions?: Record<string, string>;
}
