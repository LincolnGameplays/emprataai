/**
 * useProductionStats - Real-Time Production Statistics
 * 
 * Aggregates REAL data from Firestore orders.
 * No mock data. Every number reflects actual transactions.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { startOfDay, endOfDay } from 'date-fns';

interface ProductionStats {
  revenue: number;
  ordersCount: number;
  averageTicket: number;
  topItems: { name: string; quantity: number }[];
}

interface UseProductionStatsReturn {
  stats: ProductionStats;
  loading: boolean;
  error: string | null;
}

export function useProductionStats(): UseProductionStatsReturn {
  const [stats, setStats] = useState<ProductionStats>({
    revenue: 0,
    ordersCount: 0,
    averageTicket: 0,
    topItems: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setError('Usuário não autenticado');
      return;
    }

    const userId = auth.currentUser.uid;

    // Filter: TODAY (00:00 to 23:59)
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());

    try {
      const q = query(
        collection(db, 'orders'),
        where('restaurantId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end))
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let totalRevenue = 0;
          let validOrdersCount = 0;
          const productMap: Record<string, number> = {};

          snapshot.docs.forEach((doc) => {
            const order = doc.data();

            // ONLY count if NOT cancelled (data integrity)
            if (order.status !== 'CANCELLED' && order.status !== 'cancelled') {
              totalRevenue += Number(order.total) || 0;
              validOrdersCount++;

              // Count items for "Top Sellers"
              order.items?.forEach((item: any) => {
                const itemName = item.name || item.title || 'Unknown';
                productMap[itemName] = (productMap[itemName] || 0) + (item.quantity || 1);
              });
            }
          });

          // Sort products by quantity sold
          const sortedProducts = Object.entries(productMap)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5); // Top 5

          setStats({
            revenue: totalRevenue,
            ordersCount: validOrdersCount,
            averageTicket: validOrdersCount > 0 ? totalRevenue / validOrdersCount : 0,
            topItems: sortedProducts
          });
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('[useProductionStats] Error:', err);
          setError('Erro ao carregar estatísticas');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('[useProductionStats] Setup error:', err);
      setError('Erro ao configurar listener');
      setLoading(false);
    }
  }, []);

  return { stats, loading, error };
}
