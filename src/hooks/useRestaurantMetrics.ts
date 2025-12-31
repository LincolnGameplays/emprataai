
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface RealMetrics {
  rating: number | null; // Null se não tiver avaliações suficientes
  reviewCount: number;
  totalOrders: number;
  isNew: boolean; // True se tiver menos de X pedidos
  latestReviews: any[];
}

export const useRestaurantMetrics = (restaurantId: string) => {
  const [metrics, setMetrics] = useState<RealMetrics>({
    rating: null,
    reviewCount: 0,
    totalOrders: 0,
    isNew: true,
    latestReviews: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchRealData = async () => {
      try {
        // 1. Buscar Avaliações Reais
        const reviewsRef = collection(db, 'reviews');
        const qReviews = query(
          reviewsRef, 
          where('restaurantId', '==', restaurantId),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const reviewsSnap = await getDocs(qReviews);
        const reviews = reviewsSnap.docs.map(d => d.data());
        
        // Calcular média real (Nada fake)
        let avgRating = null;
        if (reviews.length > 0) {
          const total = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
          avgRating = parseFloat((total / reviews.length).toFixed(1));
        }

        // 2. Buscar Contagem de Pedidos (Vendas Reais)
        // Nota: Em produção, ideal é ter um contador no documento do user para não ler tudo
        const ordersRef = collection(db, 'orders');
        const qOrders = query(ordersRef, where('restaurantId', '==', restaurantId));
        const ordersSnap = await getDocs(qOrders); // count() é melhor no server-side
        const orderCount = ordersSnap.size;

        setMetrics({
          rating: avgRating,
          reviewCount: reviews.length,
          totalOrders: orderCount,
          isNew: orderCount < 10, // Menos de 10 vendas = "Novo"
          latestReviews: reviews
        });

      } catch (err) {
        console.error("Erro ao buscar métricas reais:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [restaurantId]);

  return { metrics, loading };
};
