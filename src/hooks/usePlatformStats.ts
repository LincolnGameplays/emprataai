/**
 * 🔢 usePlatformStats - Real Platform Statistics Hook
 * 
 * Fetches actual platform metrics from Firestore to display
 * honest, real-time statistics on the Landing Page.
 * No fake numbers - builds trust with early adopters.
 */

import { useState, useEffect } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

interface PlatformStats {
  restaurants: number;
  orders: number;
  isLoading: boolean;
}

export function usePlatformStats(): PlatformStats {
  const [stats, setStats] = useState<PlatformStats>({
    restaurants: 0,
    orders: 0,
    isLoading: true
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Count total active restaurants (users with OWNER role)
        const restaurantsSnap = await getCountFromServer(
          query(collection(db, 'users'), where('role', '==', 'OWNER'))
        );

        // Count total orders (shows platform traction)
        const ordersSnap = await getCountFromServer(collection(db, 'orders'));

        setStats({
          restaurants: restaurantsSnap.data().count,
          orders: ordersSnap.data().count,
          isLoading: false
        });
      } catch (error) {
        // Fail silently - stats are enhancement, not critical
        console.warn('Could not load platform stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadStats();
  }, []);

  return stats;
}
