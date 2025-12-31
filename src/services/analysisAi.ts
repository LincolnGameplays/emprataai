/**
 * Analysis AI Service - EmprataBrain Analytics
 * 
 * Generates Customer DNA profiles by:
 * - Processing order history locally (MapReduce pattern)
 * - Identifying VIPs, at-risk customers, preferences
 * - Using Gemini for executive insights
 */

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logicModel } from './googleAi';

// ══════════════════════════════════════════════════════════════════
// CUSTOMER DNA INTERFACE
// ══════════════════════════════════════════════════════════════════

export interface CustomerProfile {
  id: string;
  name: string;
  totalSpent: number;
  orderCount: number;
  favoriteItems: string[];
  lastOrderDate: any;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; // Churn risk
  tags: string[]; // e.g., "VIP", "Friday Regular", "Vegan"
}

export interface AIInsight {
  insight: string;
  actionItem: string;
}

export interface AnalyticsResult {
  profiles: CustomerProfile[];
  aiInsight: AIInsight;
  topProducts: [string, number][];
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    atRiskCustomers: number;
    vipCustomers: number;
    avgTicket: number;
    totalRevenue: number;
  };
}

// ══════════════════════════════════════════════════════════════════
// MAIN ANALYSIS FUNCTION
// ══════════════════════════════════════════════════════════════════

export async function generateCustomerDNA(restaurantId: string): Promise<AnalyticsResult> {
  // 1. Fetch raw data (optimized query)
  const q = query(
    collection(db, 'orders'),
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc'),
    limit(500) // Analyze last 500 orders for performance
  );
  
  const snapshot = await getDocs(q);
  const customers: Record<string, CustomerProfile> = {};
  const productCount: Record<string, number> = {};
  let totalRevenue = 0;

  // 2. Local Processing (MapReduce pattern)
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const uid = data.customer?.uid || data.customer?.phone || 'anonymous';
    
    if (!customers[uid]) {
      customers[uid] = {
        id: uid,
        name: data.customer?.name || 'Cliente',
        totalSpent: 0,
        orderCount: 0,
        favoriteItems: [],
        lastOrderDate: data.createdAt,
        riskLevel: 'LOW',
        tags: []
      };
    }

    // Aggregation
    const orderTotal = data.total || 0;
    customers[uid].totalSpent += orderTotal;
    customers[uid].orderCount += 1;
    totalRevenue += orderTotal;
    
    // Track favorite items
    data.items?.forEach((item: any) => {
      const itemName = item.name || item.title || 'Item';
      customers[uid].favoriteItems.push(itemName);
      productCount[itemName] = (productCount[itemName] || 0) + (item.quantity || 1);
    });
  });

  // 3. Refine profiles
  const profiles = Object.values(customers).map(c => {
    // Find most ordered item
    const itemFrequency: Record<string, number> = {};
    c.favoriteItems.forEach(item => {
      itemFrequency[item] = (itemFrequency[item] || 0) + 1;
    });
    const favoriteItem = Object.entries(itemFrequency)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Variado';

    // Churn risk logic
    let daysSinceOrder = 0;
    try {
      const lastDate = c.lastOrderDate?.toDate?.() || new Date(c.lastOrderDate);
      daysSinceOrder = (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
    } catch (e) {
      daysSinceOrder = 0;
    }
    
    let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (daysSinceOrder > 30) risk = 'HIGH';
    else if (daysSinceOrder > 14) risk = 'MEDIUM';

    // Auto-tags
    const tags: string[] = [];
    if (c.totalSpent > 500) tags.push('💎 VIP');
    if (c.orderCount === 1) tags.push('🆕 Novo');
    if (c.orderCount >= 10) tags.push('🔄 Frequente');
    if (favoriteItem.toLowerCase().includes('vegan') || favoriteItem.toLowerCase().includes('salad')) {
      tags.push('🥗 Saudável');
    }

    return { 
      ...c, 
      favoriteItems: [favoriteItem], 
      riskLevel: risk, 
      tags 
    };
  });

  // 4. Calculate stats
  const stats = {
    totalCustomers: profiles.length,
    activeCustomers: profiles.filter(p => p.riskLevel === 'LOW').length,
    atRiskCustomers: profiles.filter(p => p.riskLevel === 'HIGH').length,
    vipCustomers: profiles.filter(p => p.totalSpent > 500).length,
    avgTicket: profiles.length > 0 
      ? totalRevenue / snapshot.docs.length 
      : 0,
    totalRevenue
  };

  // 5. AI Insights (Gemini)
  const topProducts = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) as [string, number][];
  
  const prompt = `
    Analise estes dados do meu restaurante de delivery:
    
    DADOS:
    - Top 5 Produtos Mais Vendidos: ${JSON.stringify(topProducts)}
    - Total Clientes: ${stats.totalCustomers}
    - Clientes Ativos (últimos 14 dias): ${stats.activeCustomers}
    - Clientes em Risco (mais de 30 dias sem pedir): ${stats.atRiskCustomers}
    - Clientes VIP (gastaram +R$500): ${stats.vipCustomers}
    - Ticket Médio: R$ ${stats.avgTicket.toFixed(2)}
    - Faturamento Total: R$ ${stats.totalRevenue.toFixed(2)}

    Gere um resumo estratégico para o dono do restaurante:
    1. Um insight sobre o estado atual do negócio (max 2 linhas)
    2. Uma ação concreta para melhorar vendas ou recuperar clientes

    Retorne APENAS um JSON válido (sem markdown):
    { "insight": "texto aqui", "actionItem": "ação aqui" }
  `;

  let aiInsight: AIInsight = { 
    insight: "Processando dados de vendas...", 
    actionItem: "Aguarde a análise completa." 
  };

  try {
    const res = await logicModel.generateContent(prompt);
    const responseText = res.response.text();
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    aiInsight = JSON.parse(jsonStr);
  } catch (e) { 
    console.error('AI insight error:', e);
    // Fallback insights based on data
    if (stats.atRiskCustomers > stats.activeCustomers * 0.3) {
      aiInsight = {
        insight: `${stats.atRiskCustomers} clientes estão há mais de 30 dias sem pedir. Isso representa um risco de perda de receita.`,
        actionItem: `Envie uma mensagem com desconto exclusivo para reconquistar esses clientes ausentes.`
      };
    } else if (stats.vipCustomers > 0) {
      aiInsight = {
        insight: `Você tem ${stats.vipCustomers} clientes VIP que representam alta receita. Mantenha-os engajados!`,
        actionItem: `Crie um programa de fidelidade ou ofereça vantagens exclusivas para seus top clientes.`
      };
    }
  }

  return { profiles, aiInsight, topProducts, stats };
}

// ══════════════════════════════════════════════════════════════════
// HELPER: Get quick stats without full analysis
// ══════════════════════════════════════════════════════════════════

export async function getQuickStats(restaurantId: string) {
  const q = query(
    collection(db, 'orders'),
    where('restaurantId', '==', restaurantId),
    where('status', 'in', ['delivered', 'DELIVERED']),
    limit(100)
  );
  
  const snapshot = await getDocs(q);
  let total = 0;
  const uniqueCustomers = new Set<string>();
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    total += data.total || 0;
    if (data.customer?.uid) uniqueCustomers.add(data.customer.uid);
    else if (data.customer?.phone) uniqueCustomers.add(data.customer.phone);
  });
  
  return {
    recentOrders: snapshot.size,
    recentRevenue: total,
    uniqueCustomers: uniqueCustomers.size,
    avgTicket: snapshot.size > 0 ? total / snapshot.size : 0
  };
}
