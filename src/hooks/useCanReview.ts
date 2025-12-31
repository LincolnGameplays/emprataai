import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Hook de Verificação de Compra Real (Anti-Fake Reviews)
 * 
 * Verifica se o usuário atual tem pelo menos um pedido ENTREGUE
 * no restaurante especificado antes de permitir avaliação.
 * 
 * @param restaurantId - ID do restaurante a verificar
 * @returns { canReview, lastOrderDate, loading }
 */
export function useCanReview(restaurantId: string) {
  const [canReview, setCanReview] = useState(false);
  const [lastOrderDate, setLastOrderDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || !restaurantId) {
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('customer.uid', '==', auth.currentUser!.uid),
          where('restaurantId', '==', restaurantId),
          where('status', '==', 'DELIVERED'),
          limit(1)
        );
        
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          setCanReview(true);
          const orderData = snap.docs[0].data();
          if (orderData.createdAt?.toDate) {
            setLastOrderDate(orderData.createdAt.toDate());
          }
        } else {
          setCanReview(false);
        }
      } catch (error) {
        console.error('[useCanReview] Erro ao verificar compra:', error);
        setCanReview(false);
      } finally {
        setLoading(false);
      }
    };
    
    check();
  }, [restaurantId]);

  return { canReview, lastOrderDate, loading };
}
