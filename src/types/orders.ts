import { Timestamp } from 'firebase/firestore';

export type OrderStatus = 
  | 'PENDING' | 'pending' 
  | 'PREPARING' | 'preparing' 
  | 'READY' | 'ready' 
  | 'DISPATCHED' | 'dispatched' 
  | 'DELIVERED' | 'delivered' 
  | 'CANCELLED' | 'cancelled'
  | 'billing_requested' | 'BILLING_REQUESTED';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  imageUrl?: string;
}

// Adicionado para corrigir erro do WaiterApp
export interface CartItem extends OrderItem {
  restaurantId?: string;
  menuItemId?: string; // Para WaiterApp
  cartId?: string; // Identificador único do item no carrinho
}

export interface OrderCustomer {
  uid: string;
  name: string;
  phone?: string;
  email?: string;
  table?: string;
}

export interface OrderAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  complement?: string;
  coords?: { lat: number; lng: number };
}

export interface Order {
  id: string;
  restaurantId: string;
  driverId?: string;
  customer: OrderCustomer;
  deliveryAddress?: OrderAddress;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  deliveryPin?: string;
  paymentMethod?: string;
  isPaid?: boolean;
  createdAt: any;
  updatedAt?: any;
  deliveredAt?: any;
  aiMetrics?: {
    predicted?: number;
    actual?: number;
    delta?: number;
  };
}

// Expandido para incluir todas as propriedades usadas em analyticsService e useMerchantStats
export interface DashboardMetrics {
  totalRevenue: number;
  todayRevenue?: number;
  activeOrders?: number;
  totalOrders: number;
  averageTicket: number;
  conversionRate?: number;
  dailySales?: { date: string; value: number }[];
  topItems?: { name: string; quantity: number; image?: string }[];
  topProducts?: { name: string; quantity: number }[];
  recentOrders?: Order[];
  ordersByStatus?: Record<string, number>;
  revenueChange?: number;
  ordersChange?: number;
  ticketChange?: number;
}
