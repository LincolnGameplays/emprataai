/**
 * Learning AI Service - R.A.L.F. (Realtime Adaptive Learning Framework)
 * 
 * Implements a feedback loop:
 * 1. AI makes prediction
 * 2. System monitors reality
 * 3. System calculates error (delta)
 * 4. System saves learning to restaurant's neural profile
 * 5. Next prediction uses calibrated data
 */

import { 
  doc, getDoc, updateDoc, 
  collection, query, where, getDocs, 
  limit, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logicModel } from './googleAi';

// ══════════════════════════════════════════════════════════════════
// BRAIN MEMORY INTERFACE
// ══════════════════════════════════════════════════════════════════

export interface BrainMemory {
  avgDelay: number; // Average delay in minutes
  kitchenPerformance: 'FAST' | 'NORMAL' | 'SLOW';
  rushHourImpact: number; // Multiplier factor (e.g., 1.2x)
  weatherSensitivity: number; // How much rain affects (e.g., 1.5x)
  learningNote: string; // AI's learning summary
  lastLearnedAt: any;
  totalDeliveries: number;
  accuracyPercent: number;
}

export interface AIMetrics {
  predicted: number;
  actual: number;
  delta: number;
  recordedAt: any;
}

// ══════════════════════════════════════════════════════════════════
// 1. RECORD DELIVERY OUTCOME (Called when order is delivered)
// ══════════════════════════════════════════════════════════════════

export async function recordDeliveryOutcome(
  orderId: string, 
  predictedDuration: number, 
  actualDuration: number
): Promise<void> {
  const diff = actualDuration - predictedDuration;
  
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      'aiMetrics': {
        predicted: predictedDuration,
        actual: actualDuration,
        delta: diff, // Positive = late, Negative = early
        recordedAt: serverTimestamp()
      }
    });
    
    console.log(`[RALF] Recorded outcome: Predicted ${predictedDuration}m, Actual ${actualDuration}m, Delta ${diff}m`);
  } catch (error) {
    console.error('[RALF] Error recording outcome:', error);
  }
}

// ══════════════════════════════════════════════════════════════════
// 2. CALIBRATE BRAIN (Run periodically or on dashboard load)
// ══════════════════════════════════════════════════════════════════

export async function calibrateBrain(restaurantId: string): Promise<BrainMemory | null> {
  try {
    // Fetch last 50 completed orders with AI metrics
    const ordersQuery = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      where('status', 'in', ['delivered', 'DELIVERED']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(ordersQuery);
    
    if (snapshot.empty) {
      console.log('[RALF] No delivery history to learn from');
      return null;
    }

    // Build history for AI analysis
    const deliveries: { predicted: number; actual: number; delta: number }[] = [];
    let historyText = '';
    
    snapshot.docs.forEach((d, index) => {
      const data = d.data();
      if (data.aiMetrics) {
        deliveries.push({
          predicted: data.aiMetrics.predicted || 0,
          actual: data.aiMetrics.actual || 0,
          delta: data.aiMetrics.delta || 0
        });
        historyText += `Pedido ${index + 1}: Previsto ${data.aiMetrics.predicted}m, Real ${data.aiMetrics.actual}m (Delta: ${data.aiMetrics.delta > 0 ? '+' : ''}${data.aiMetrics.delta}m)\n`;
      }
    });

    if (deliveries.length < 5) {
      // Not enough data, calculate simple stats
      const avgDelay = deliveries.length > 0 
        ? deliveries.reduce((sum, d) => sum + d.delta, 0) / deliveries.length 
        : 0;
      
      return {
        avgDelay: Math.round(avgDelay),
        kitchenPerformance: avgDelay <= -5 ? 'FAST' : avgDelay >= 10 ? 'SLOW' : 'NORMAL',
        rushHourImpact: 1,
        weatherSensitivity: 1.3,
        learningNote: 'Poucos dados para calibração completa',
        lastLearnedAt: new Date(),
        totalDeliveries: deliveries.length,
        accuracyPercent: 100 - Math.abs(avgDelay)
      };
    }

    // AI Analysis
    const prompt = `
      Analise o histórico recente de entregas deste restaurante:
      
      ${historyText}
      
      Total de entregas analisadas: ${deliveries.length}
      
      Identifique padrões de erro:
      - Onde estamos errando sistematicamente?
      - A cozinha está mais lenta que o previsto?
      - O trânsito está pior que as estimativas?
      
      Gere um JSON de CALIBRAGEM para as próximas previsões:
      {
        "avgDelay": (média do delta em minutos, número inteiro),
        "kitchenPerformance": "FAST" se geralmente adiantou, "NORMAL" se próximo, "SLOW" se atrasou muito,
        "rushHourImpact": (fator multiplicador sugerido, ex: 1.1 para 10% de margem extra),
        "weatherSensitivity": (fator para dias de chuva, ex: 1.3),
        "learningNote": "Resumo curto do que você aprendeu em português",
        "accuracyPercent": (porcentagem de precisão, 0-100)
      }
      
      Retorne APENAS o JSON válido, sem markdown.
    `;

    try {
      const result = await logicModel.generateContent(prompt);
      const responseText = result.response.text();
      const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const calibration = JSON.parse(jsonStr);

      const brainMemory: BrainMemory = {
        avgDelay: calibration.avgDelay || 0,
        kitchenPerformance: calibration.kitchenPerformance || 'NORMAL',
        rushHourImpact: calibration.rushHourImpact || 1,
        weatherSensitivity: calibration.weatherSensitivity || 1.3,
        learningNote: calibration.learningNote || 'Calibração concluída',
        lastLearnedAt: serverTimestamp(),
        totalDeliveries: deliveries.length,
        accuracyPercent: calibration.accuracyPercent || 80
      };

      // Save to database
      await updateDoc(doc(db, 'users', restaurantId), {
        emprataBrain: brainMemory
      });

      console.log('[RALF] Brain calibrated:', brainMemory);
      return brainMemory;

    } catch (aiError) {
      console.error('[RALF] AI calibration failed:', aiError);
      
      // Fallback: Simple statistical calibration
      const avgDelay = deliveries.reduce((sum, d) => sum + d.delta, 0) / deliveries.length;
      const fallbackMemory: BrainMemory = {
        avgDelay: Math.round(avgDelay),
        kitchenPerformance: avgDelay <= -5 ? 'FAST' : avgDelay >= 10 ? 'SLOW' : 'NORMAL',
        rushHourImpact: avgDelay > 5 ? 1.1 : 1,
        weatherSensitivity: 1.3,
        learningNote: 'Calibração estatística básica',
        lastLearnedAt: serverTimestamp(),
        totalDeliveries: deliveries.length,
        accuracyPercent: Math.max(0, 100 - Math.abs(avgDelay * 2))
      };

      await updateDoc(doc(db, 'users', restaurantId), {
        emprataBrain: fallbackMemory
      });

      return fallbackMemory;
    }

  } catch (error) {
    console.error('[RALF] Calibration error:', error);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// 3. GET BRAIN STATUS (Read current memory)
// ══════════════════════════════════════════════════════════════════

export async function getBrainStatus(restaurantId: string): Promise<BrainMemory | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', restaurantId));
    
    if (userDoc.exists() && userDoc.data()?.emprataBrain) {
      return userDoc.data()!.emprataBrain as BrainMemory;
    }
    
    return null;
  } catch (error) {
    console.error('[RALF] Error fetching brain status:', error);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// 4. ADAPTIVE PREDICTION (Uses brain memory)
// ══════════════════════════════════════════════════════════════════

export async function predictAdaptiveTime(
  restaurantId: string, 
  distanceKm: number, 
  kitchenQueue: number
): Promise<{
  min: number;
  max: number;
  insight: string;
  confidence: number;
}> {
  // Fetch brain memory
  const memory = await getBrainStatus(restaurantId);
  
  // Base calculation
  let baseTime = 15 + (kitchenQueue * 2) + (distanceKm * 4);
  
  // Apply learned adjustments
  if (memory) {
    baseTime *= (memory.rushHourImpact || 1);
    baseTime += (memory.avgDelay || 0);
  }
  
  const insight = memory?.kitchenPerformance === 'SLOW' 
    ? 'Ajustado: Alta demanda histórica' 
    : memory?.kitchenPerformance === 'FAST'
      ? 'Cozinha eficiente'
      : 'Fluxo normal';
  
  return {
    min: Math.floor(baseTime),
    max: Math.floor(baseTime + 10),
    insight,
    confidence: memory?.accuracyPercent || 70
  };
}
