import { Timestamp } from 'firebase/firestore';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'billing_requested' | 'closed' | 'cancelled';

export interface Customer {
  name: string;
  cpf: string;
  phone?: string;
  table?: string;
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    complement?: string;
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
  imageUrl?: string; // Adicionado para compatibilidade com Analytics
  category?: string;
  status?: 'pending' | 'done';
}

// Interface usada no Frontend (Carrinho)
export interface CartItem extends OrderItem {
  cartId: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: any; // Pode ser Date ou Timestamp dependendo do contexto
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

// Tipos para Analytics e Dashboard
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
    items: string[]; // IDs dos itens
  }[];
  orderBumps: {
    itemId: string;
    reason: string;
  }[];
}
