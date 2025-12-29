/**
 * useMerchantStats Hook
 * Real-time dashboard statistics for restaurant owners
 */

import { useState, useEffect } from 'react';
import { subscribeToOrders, calculateMetrics } from '../services/analyticsService';
import type { DashboardMetrics, Order } from '../types/orders';

// ══════════════════════════════════════════════════════════════════
// DEFAULT METRICS (Empty State)
// ══════════════════════════════════════════════════════════════════

const defaultMetrics: DashboardMetrics = {
  totalRevenue: 0,
  todayRevenue: 0,
  activeOrders: 0,
  totalOrders: 0,
  averageTicket: 0,
  conversionRate: 0,
  dailySales: [],
  topItems: [],
  recentOrders: [],
  revenueChange: 0,
  ordersChange: 0,
  ticketChange: 0
};

// ══════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════

export function useMerchantStats(userId: string | null) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setError('Usuário não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToOrders(userId, (newOrders) => {
      setOrders(newOrders);
      
      // Recalculate metrics whenever orders change
      const newMetrics = calculateMetrics(newOrders);
      setMetrics(newMetrics);
      
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [userId]);

  return {
    metrics,
    orders,
    isLoading,
    error,
    hasData: orders.length > 0
  };
}

export default useMerchantStats;
