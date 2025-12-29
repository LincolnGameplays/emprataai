/**
 * Analytics Service - Real-time Order Processing
 * Firestore listeners and metric calculations
 */

import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Order, DashboardMetrics, OrderItem } from '../types/orders';

// ══════════════════════════════════════════════════════════════════
// SUBSCRIBE TO ORDERS (Real-time)
// ══════════════════════════════════════════════════════════════════

export function subscribeToOrders(
  ownerId: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as Order;
    });

    callback(orders);
  }, (error) => {
    console.error('Error subscribing to orders:', error);
    callback([]);
  });
}

// ══════════════════════════════════════════════════════════════════
// CALCULATE METRICS
// ══════════════════════════════════════════════════════════════════

export function calculateMetrics(orders: Order[]): DashboardMetrics {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));
  const weekAgoStart = startOfDay(subDays(now, 7));

  // Today's orders
  const todayOrders = orders.filter(o => isAfter(o.createdAt, todayStart));
  const yesterdayOrders = orders.filter(o => 
    isAfter(o.createdAt, yesterdayStart) && !isAfter(o.createdAt, todayStart)
  );
  const weekOrders = orders.filter(o => isAfter(o.createdAt, weekAgoStart));

  // Paid orders for revenue calculations
  const paidOrders = orders.filter(o => o.isPaid);
  const todayPaidOrders = todayOrders.filter(o => o.isPaid);
  const yesterdayPaidOrders = yesterdayOrders.filter(o => o.isPaid);

  // Revenue calculations
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + o.total, 0);
  const yesterdayRevenue = yesterdayPaidOrders.reduce((sum, o) => sum + o.total, 0);

  // Average ticket
  const averageTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const yesterdayTicket = yesterdayPaidOrders.length > 0 
    ? yesterdayPaidOrders.reduce((sum, o) => sum + o.total, 0) / yesterdayPaidOrders.length 
    : 0;

  // Active orders (pending or preparing)
  const activeOrders = orders.filter(o => 
    o.status === 'pending' || o.status === 'preparing' || o.status === 'billing_requested'
  ).length;

  // Percentage changes
  const revenueChange = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
    : todayRevenue > 0 ? 100 : 0;
  
  const ordersChange = yesterdayOrders.length > 0
    ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100
    : todayOrders.length > 0 ? 100 : 0;

  const ticketChange = yesterdayTicket > 0
    ? ((averageTicket - yesterdayTicket) / yesterdayTicket) * 100
    : 0;

  // Daily sales for chart (last 7 days)
  const dailySales = generateDailySales(weekOrders);

  // Top selling items
  const topItems = calculateTopItems(paidOrders);

  // Recent orders (last 10)
  const recentOrders = orders.slice(0, 10);

  return {
    totalRevenue,
    todayRevenue,
    activeOrders,
    totalOrders: orders.length,
    averageTicket,
    conversionRate: 0, // Would need menu views data
    dailySales,
    topItems,
    recentOrders,
    revenueChange,
    ordersChange,
    ticketChange
  };
}

// ══════════════════════════════════════════════════════════════════
// GENERATE DAILY SALES (Last 7 Days)
// ══════════════════════════════════════════════════════════════════

function generateDailySales(orders: Order[]): { date: string; value: number }[] {
  const days = [];
  
  for (let i = 6; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayStart = startOfDay(day);
    const dayEnd = startOfDay(subDays(day, -1));
    
    const dayOrders = orders.filter(o => 
      isAfter(o.createdAt, dayStart) && !isAfter(o.createdAt, dayEnd) && o.isPaid
    );
    
    const value = dayOrders.reduce((sum, o) => sum + o.total, 0);
    
    days.push({
      date: format(day, 'dd/MM', { locale: ptBR }),
      value
    });
  }
  
  return days;
}

// ══════════════════════════════════════════════════════════════════
// CALCULATE TOP ITEMS
// ══════════════════════════════════════════════════════════════════

function calculateTopItems(
  orders: Order[]
): { name: string; quantity: number; image: string }[] {
  const itemMap = new Map<string, { quantity: number; image: string }>();

  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = itemMap.get(item.name);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemMap.set(item.name, {
          quantity: item.quantity,
          image: item.imageUrl || ''
        });
      }
    });
  });

  return Array.from(itemMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

// ══════════════════════════════════════════════════════════════════
// FORMAT CURRENCY (BRL)
// ══════════════════════════════════════════════════════════════════

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// ══════════════════════════════════════════════════════════════════
// FORMAT PERCENTAGE
// ══════════════════════════════════════════════════════════════════

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
