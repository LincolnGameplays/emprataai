/**
 * Deep Learning Service - EmprataBrain 2.0
 * 
 * Implements "Synapses" system for restaurant intelligence:
 * 1. Market Basket Analysis: Item correlations (who buys X also buys Y)
 * 2. Temporal Patterns: Hour/day demand patterns
 * 3. AI-powered insights using Gemini
 */

import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logicModel } from './googleAi';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

interface ShopMemory {
  correlations: Record<string, Record<string, number>>; // Item A -> { Item B: count, Item C: count }
  hourlyPatterns: Record<string, number>; // "Monday-19": 45 orders
  lastUpdate: any;
  totalOrders: number;
}

interface OrderItem {
  name?: string;
  title?: string;
  id: string;
}

interface Order {
  items: OrderItem[];
  total?: number;
  createdAt?: any;
}

// ══════════════════════════════════════════════════════════════════
// 1. TRAIN SYNAPSES (Called after each completed order)
// ══════════════════════════════════════════════════════════════════

export async function trainSynapses(restaurantId: string, order: Order): Promise<void> {
  const memoryRef = doc(db, 'brain_synapses', restaurantId);
  
  try {
    // Check if document exists, create if not
    const memorySnap = await getDoc(memoryRef);
    if (!memorySnap.exists()) {
      await setDoc(memoryRef, { 
        correlations: {}, 
        hourlyPatterns: {},
        totalOrders: 0,
        lastUpdate: serverTimestamp() 
      });
    }

    // A. Market Basket Analysis (Simplified)
    const items = order.items.map((i: OrderItem) => i.name || i.title || i.id);
    
    // Create pairs: If customer bought X and Y, X connects to Y
    for (const itemA of items) {
      for (const itemB of items) {
        if (itemA !== itemB) {
          // Increment connection strength atomically
          await updateDoc(memoryRef, {
            [`correlations.${sanitizeKey(itemA)}.${sanitizeKey(itemB)}`]: increment(1)
          }).catch(() => {});
        }
      }
    }

    // B. Temporal Learning (Hour patterns)
    const date = new Date();
    const timeKey = `${getDayName(date.getDay())}-${date.getHours()}`; // e.g., "Friday-20"
    
    await updateDoc(memoryRef, {
      [`hourlyPatterns.${timeKey}`]: increment(1),
      totalOrders: increment(1),
      lastUpdate: serverTimestamp()
    });

  } catch (error) {
    console.error('[DeepLearning] Train error:', error);
  }
}

// ══════════════════════════════════════════════════════════════════
// 2. GET SURPRISING INSIGHT (The Magic)
// ══════════════════════════════════════════════════════════════════

export async function getSurprisingInsight(restaurantId: string): Promise<string> {
  try {
    const memorySnap = await getDoc(doc(db, 'brain_synapses', restaurantId));
    
    if (!memorySnap.exists()) {
      return "🧠 Ainda estou aprendendo... Continue vendendo para eu criar padrões!";
    }

    const memory = memorySnap.data() as ShopMemory;
    const today = new Date();
    const currentHour = today.getHours();
    const nextHourKey = `${getDayName(today.getDay())}-${currentHour + 1}`;
    const currentKey = `${getDayName(today.getDay())}-${currentHour}`;
    
    const historicalDemandNextHour = memory.hourlyPatterns?.[nextHourKey] || 0;
    const historicalDemandNow = memory.hourlyPatterns?.[currentKey] || 0;
    
    // Find strongest correlations
    const topCorrelations = getTopCorrelations(memory.correlations || {}, 5);

    // Prompt for Gemini to find the "golden insight"
    const prompt = `
Você é um consultor de negócios especialista em restaurantes. Analise estes dados REAIS:

📊 DADOS DO RESTAURANTE:
- Total de pedidos registrados: ${memory.totalOrders || 0}
- Pedidos históricos NESTA hora (${currentKey}): ${historicalDemandNow}
- Pedidos históricos na PRÓXIMA hora (${nextHourKey}): ${historicalDemandNextHour}
- Top correlações de produtos: ${JSON.stringify(topCorrelations)}

🎯 SUA MISSÃO:
Surpreenda o dono com UM insight prático e acionável de no máximo 2 frases.

Exemplos do tipo de insight esperado:
- "⚡ Alerta: Historicamente, a demanda TRIPLICA na próxima hora. Prepare a equipe agora!"
- "💡 Dica: Quem pede Hambúrguer costuma pedir Milkshake. Ofereça combo com desconto!"
- "📈 Padrão detectado: Sexta às 20h é seu pico. Hoje é sexta, prepare-se!"
- "🔥 Oportunidade: X-Bacon tem alta correlação com Batata. Crie um combo agora!"

Responda APENAS com o insight, sem explicações adicionais.`;

    const result = await logicModel.generateContent(prompt);
    const insight = result.response.text().trim();
    
    return insight || "🔮 Analisando padrões de venda...";
    
  } catch (error) {
    console.error('[DeepLearning] Insight error:', error);
    return "🧠 Otimizando sinapses comerciais...";
  }
}

// ══════════════════════════════════════════════════════════════════
// 3. GET MEMORY STATUS (For debugging/display)
// ══════════════════════════════════════════════════════════════════

export async function getBrainMemory(restaurantId: string): Promise<ShopMemory | null> {
  try {
    const memorySnap = await getDoc(doc(db, 'brain_synapses', restaurantId));
    if (!memorySnap.exists()) return null;
    return memorySnap.data() as ShopMemory;
  } catch (error) {
    console.error('[DeepLearning] Get memory error:', error);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
}

function sanitizeKey(key: string): string {
  // Firebase doesn't allow dots in keys
  return key.replace(/\./g, '_').replace(/\//g, '_').replace(/\$/g, '_');
}

function getTopCorrelations(correlations: Record<string, Record<string, number>>, limit: number): string[] {
  const pairs: { pair: string; count: number }[] = [];
  
  for (const itemA of Object.keys(correlations)) {
    for (const itemB of Object.keys(correlations[itemA] || {})) {
      pairs.push({
        pair: `${itemA} → ${itemB}`,
        count: correlations[itemA][itemB]
      });
    }
  }
  
  return pairs
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(p => `${p.pair} (${p.count}x)`);
}
