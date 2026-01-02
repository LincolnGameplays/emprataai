/**
 * 📊 DATA AGGREGATOR - Os Olhos da IA
 * 
 * Coleta dados reais do Firestore e transforma em estatísticas
 * que a IA pode usar para responder perguntas de negócio.
 */

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { startOfMonth, subDays } from 'date-fns';

export interface RestaurantContext {
  revenueMonth: number;
  ordersMonth: number;
  revenueLast7Days: number;
  topProducts: string[];
  cancelledRate: string;
  ticketAverage: number;
  todayRevenue: number;
  todayOrders: number;
}

/**
 * Agrega dados do restaurante para contexto da IA
 * @param restaurantId UID do dono do restaurante
 */
export async function getRestaurantContext(restaurantId: string): Promise<RestaurantContext> {
  // Define janelas de tempo
  const startMonth = startOfMonth(new Date());
  const last7Days = subDays(new Date(), 7);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Busca pedidos dos últimos 30 dias (otimizado)
  const q = query(
    collection(db, 'orders'),
    where('restaurantId', '==', restaurantId),
    where('createdAt', '>=', Timestamp.fromDate(subDays(new Date(), 30)))
  );

  const snap = await getDocs(q);
  const orders = snap.docs.map(d => d.data());

  // Processamento Matemático
  let totalRevMonth = 0;
  let countMonth = 0;
  let totalRev7 = 0;
  let cancelled = 0;
  let todayRevenue = 0;
  let todayOrders = 0;
  const productCount: Record<string, number> = {};

  orders.forEach((o: any) => {
    const date = o.createdAt?.toDate?.() || new Date(o.createdAt);
    const isPaid = ['DELIVERED', 'PAID', 'DISPATCHED', 'delivered', 'paid', 'dispatched', 'completed'].includes(o.status?.toUpperCase?.() || o.status);

    // Contagem de Produtos
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach((item: any) => {
        const itemName = item.name || item.title || 'Item Desconhecido';
        const itemQty = item.quantity || 1;
        productCount[itemName] = (productCount[itemName] || 0) + itemQty;
      });
    }

    // Métricas Financeiras do Mês
    if (date >= startMonth && isPaid) {
      totalRevMonth += Number(o.total) || 0;
      countMonth++;
    }

    // Últimos 7 dias
    if (date >= last7Days && isPaid) {
      totalRev7 += Number(o.total) || 0;
    }

    // Hoje
    if (date >= todayStart && isPaid) {
      todayRevenue += Number(o.total) || 0;
      todayOrders++;
    }

    // Cancelamentos
    if (o.status === 'CANCELLED' || o.status === 'cancelled') {
      cancelled++;
    }
  });

  // Top 3 Produtos
  const topProducts = Object.entries(productCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, qtd]) => `${name} (${qtd}x)`);

  const cancelledRate = orders.length > 0 
    ? ((cancelled / orders.length) * 100).toFixed(1) + '%'
    : '0%';

  return {
    revenueMonth: totalRevMonth,
    ordersMonth: countMonth,
    revenueLast7Days: totalRev7,
    ticketAverage: countMonth > 0 ? totalRevMonth / countMonth : 0,
    cancelledRate,
    topProducts,
    todayRevenue,
    todayOrders
  };
}

/**
 * Formata os dados do contexto como texto para o prompt da IA
 */
export function formatContextForAI(data: RestaurantContext): string {
  return `
DADOS REAIS DO RESTAURANTE (Últimos 30 dias):
- Faturamento Mês Atual: R$ ${data.revenueMonth.toFixed(2)}
- Faturamento 7 Dias: R$ ${data.revenueLast7Days.toFixed(2)}
- Faturamento Hoje: R$ ${data.todayRevenue.toFixed(2)}
- Pedidos Hoje: ${data.todayOrders}
- Total Pedidos (Mês): ${data.ordersMonth}
- Ticket Médio: R$ ${data.ticketAverage.toFixed(2)}
- Taxa de Cancelamento: ${data.cancelledRate}
- Top 3 Mais Vendidos: ${data.topProducts.length > 0 ? data.topProducts.join(', ') : 'Nenhum dado'}
  `.trim();
}
