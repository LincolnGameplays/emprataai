
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { startOfDay, format } from 'date-fns';

// Som de dinheiro/venda
const SALE_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3';

export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    activeCustomers: 0,
    chartData: [] as { date: string; value: number }[]
  });
  
  const audioRef = useRef(new Audio(SALE_SOUND));
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Filtra pedidos de HOJE
    const today = startOfDay(new Date());
    
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', user.uid),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'asc') // Importante para o gráfico
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let sales = 0;
      const customers = new Set();
      const hourlyData: Record<string, number> = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Só soma se não for cancelado
        if (data.status !== 'cancelled' && data.status !== 'CANCELLED') {
          sales += data.total || data.financials?.total || 0;
          customers.add(data.customer?.phone || data.customer?.id);

          // Agrupamento por Hora para o Gráfico
          const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          const hourKey = format(date, 'HH:00');
          hourlyData[hourKey] = (hourlyData[hourKey] || 0) + (data.total || data.financials?.total || 0);
        }
      });

      // Tocar som se houver NOVO pedido (aumentou o tamanho da lista)
      if (!isFirstLoad.current && snapshot.docChanges().some(change => change.type === 'added')) {
        audioRef.current.play().catch(e => console.log('Audio blocked', e));
      }

      // Formata dados para o SalesChart
      const chartData = Object.keys(hourlyData).map(key => ({
        date: key,
        value: hourlyData[key]
      }));

      setStats({
        totalSales: sales,
        totalOrders: snapshot.size,
        activeCustomers: customers.size,
        chartData
      });

      isFirstLoad.current = false;
    });

    return () => unsubscribe();
  }, []);

  return stats;
}
