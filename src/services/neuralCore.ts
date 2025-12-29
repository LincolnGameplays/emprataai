/**
 * ⚡ NEURAL CORE - Central AI Intelligence Layer ⚡
 * Connects Gemini to the entire Emprata ecosystem
 * 
 * Features:
 * - Delivery status updates with engaging copy
 * - Anomaly detection in audit logs
 * - Inventory prediction based on sales + weather
 * - Context-aware menu ordering
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || '');

// Use the logic model for text generation
const logicModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.8,
    maxOutputTokens: 500,
  }
});

// ══════════════════════════════════════════════════════════════════
// A. DELIVERY UPDATE GENERATOR
// ══════════════════════════════════════════════════════════════════

export interface DeliveryUpdateResponse {
  message: string;
  emoji: string;
  tone: 'exciting' | 'calm' | 'celebration';
}

/**
 * Generates engaging, food-porn style delivery status updates
 */
export async function generateDeliveryUpdate(
  orderItem: string,
  status: string,
  chefName: string = 'nosso chef'
): Promise<DeliveryUpdateResponse> {
  try {
    const prompt = `Atue como um narrador gastronômico empolgado e divertido.
    
O pedido é: "${orderItem}"
O status mudou para: "${status}"
O chef responsável é: "${chefName}"

Gere uma frase curta, divertida e apetitosa para o cliente (máximo 120 caracteres).
Use emojis relevantes com comida.
Seja criativo e faça o cliente salivar!

Responda APENAS com a frase, nada mais.`;

    const result = await logicModel.generateContent(prompt);
    const text = result.response.text().trim();

    // Determine tone based on status
    const tone = status === 'delivered' ? 'celebration' : 
                 status === 'ready' ? 'exciting' : 'calm';

    return {
      message: text.slice(0, 150),
      emoji: extractEmoji(text) || '🍔',
      tone
    };
  } catch (error) {
    console.error('[NeuralCore] Delivery update error:', error);
    return {
      message: getDefaultMessage(status, orderItem),
      emoji: '🍔',
      tone: 'calm'
    };
  }
}

function extractEmoji(text: string): string {
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
  const emojis = text.match(emojiRegex);
  return emojis?.[0] || '';
}

function getDefaultMessage(status: string, item: string): string {
  const messages: Record<string, string> = {
    pending: `Seu ${item} entrou na fila! 🔜`,
    preparing: `O chef está caprichando no seu ${item}! 👨‍🍳`,
    ready: `Seu ${item} está pronto e cheirando bem! 🔥`,
    dispatched: `Seu ${item} está a caminho! 🛵`,
    delivered: `Entregue! Aproveite seu ${item}! 🎉`
  };
  return messages[status] || `Atualizando seu ${item}...`;
}

// ══════════════════════════════════════════════════════════════════
// B. ANOMALY DETECTION
// ══════════════════════════════════════════════════════════════════

export interface AnomalyResult {
  hasAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  affectedArea: string;
  confidence: number;
}

/**
 * Analyzes audit logs for suspicious patterns
 */
export async function detectAnomalies(auditLogs: any[]): Promise<AnomalyResult[]> {
  if (!auditLogs || auditLogs.length === 0) {
    return [];
  }

  try {
    const logsPreview = auditLogs.slice(0, 50).map(log => ({
      action: log.action,
      severity: log.severity,
      details: log.details,
      userId: log.userId?.slice(-4), // Anonymize
      timestamp: log.timestamp
    }));

    const prompt = `Analise estes logs de operação de restaurante e identifique padrões suspeitos.

LOGS:
${JSON.stringify(logsPreview, null, 2)}

Procure por:
1. Muitos cancelamentos seguidos (possível roubo)
2. Descontos excessivos ou fora do padrão
3. Alterações de preço suspeitas
4. Acessos em horários incomuns
5. Erros operacionais repetitivos

Responda APENAS em JSON válido, array de objetos:
[{
  "hasAnomaly": true/false,
  "severity": "low|medium|high|critical",
  "message": "descrição curta",
  "recommendation": "o que fazer",
  "affectedArea": "area afetada",
  "confidence": 0.0-1.0
}]

Se não houver anomalias, retorne array vazio: []`;

    const result = await logicModel.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (error) {
    console.error('[NeuralCore] Anomaly detection error:', error);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════
// C. INVENTORY PREDICTION
// ══════════════════════════════════════════════════════════════════

export interface InventoryPrediction {
  ingredient: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedDaysLeft: number;
  suggestedPurchase: string;
  reason: string;
}

/**
 * Predicts inventory needs based on sales history and weather
 */
export async function predictInventoryNeeds(
  salesHistory: any[],
  weatherForecast: string = 'ensolarado'
): Promise<InventoryPrediction[]> {
  if (!salesHistory || salesHistory.length === 0) {
    return [];
  }

  try {
    // Aggregate sales by item
    const itemCounts: Record<string, number> = {};
    salesHistory.forEach(sale => {
      sale.items?.forEach((item: any) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    const prompt = `Você é um especialista em gestão de estoque de restaurantes.

VENDAS DOS ÚLTIMOS 7 DIAS:
${JSON.stringify(itemCounts, null, 2)}

PREVISÃO DO TEMPO PARA O FIM DE SEMANA:
${weatherForecast}

Com base nisso, quais ingredientes correm risco de acabar?
Considere que tempo quente aumenta venda de bebidas e tempo frio aumenta sopas/caldos.

Responda APENAS em JSON válido, array de objetos:
[{
  "ingredient": "nome do ingrediente",
  "riskLevel": "low|medium|high",
  "estimatedDaysLeft": número,
  "suggestedPurchase": "quantidade sugerida",
  "reason": "motivo curto"
}]

Máximo 5 itens mais críticos.`;

    const result = await logicModel.generateContent(prompt);
    const text = result.response.text().trim();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (error) {
    console.error('[NeuralCore] Inventory prediction error:', error);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════
// D. CONTEXT-AWARE MENU ORDERING
// ══════════════════════════════════════════════════════════════════

export interface MenuContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather: 'hot' | 'cold' | 'rainy' | 'normal';
  dayOfWeek: string;
  isWeekend: boolean;
}

/**
 * Gets current context for menu personalization
 */
export function getMenuContext(): MenuContext {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  const timeOfDay = 
    hour < 11 ? 'morning' :
    hour < 14 ? 'afternoon' :
    hour < 18 ? 'evening' : 'night';
  
  const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  
  return {
    timeOfDay,
    weather: 'normal', // Could integrate with weather API
    dayOfWeek: days[day],
    isWeekend: day === 0 || day === 6
  };
}

/**
 * Suggests menu item ordering based on context
 */
export async function suggestMenuOrder(
  items: any[],
  context: MenuContext
): Promise<string[]> {
  try {
    const itemNames = items.map(i => i.title || i.name).slice(0, 30);
    
    const prompt = `Você é um especialista em psicologia de vendas para restaurantes.

ITENS DO CARDÁPIO:
${itemNames.join(', ')}

CONTEXTO ATUAL:
- Horário: ${context.timeOfDay}
- Clima: ${context.weather}
- Dia: ${context.dayOfWeek}
- Fim de semana: ${context.isWeekend ? 'sim' : 'não'}

Reordene os itens para maximizar vendas neste contexto.
Ex: Café da manhã primeiro de manhã, pratos leves à tarde, etc.

Responda APENAS com os nomes dos itens na ordem ideal, separados por vírgula.`;

    const result = await logicModel.generateContent(prompt);
    const text = result.response.text().trim();
    
    return text.split(',').map(s => s.trim()).filter(Boolean);
  } catch (error) {
    console.error('[NeuralCore] Menu order suggestion error:', error);
    return items.map(i => i.title || i.name);
  }
}

// ══════════════════════════════════════════════════════════════════
// E. NEURAL FEED INSIGHTS
// ══════════════════════════════════════════════════════════════════

export interface NeuralInsight {
  id: string;
  type: 'anomaly' | 'prediction' | 'praise' | 'tip';
  severity: 'success' | 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  createdAt: Date;
}

/**
 * Generates daily insights for the dashboard
 */
export async function generateDailyInsights(
  salesData: any[],
  auditLogs: any[]
): Promise<NeuralInsight[]> {
  const insights: NeuralInsight[] = [];

  try {
    // Check for anomalies
    const anomalies = await detectAnomalies(auditLogs);
    anomalies.forEach((anomaly, i) => {
      if (anomaly.hasAnomaly) {
        insights.push({
          id: `anomaly-${i}`,
          type: 'anomaly',
          severity: anomaly.severity === 'critical' || anomaly.severity === 'high' ? 'danger' : 'warning',
          title: 'Atenção Requerida',
          message: anomaly.message,
          action: {
            label: 'Ver Detalhes',
            href: '/security-audit'
          },
          createdAt: new Date()
        });
      }
    });

    // Check inventory predictions
    const predictions = await predictInventoryNeeds(salesData, 'normal');
    predictions.filter(p => p.riskLevel === 'high').forEach((pred, i) => {
      insights.push({
        id: `inventory-${i}`,
        type: 'prediction',
        severity: 'info',
        title: 'Previsão de Estoque',
        message: `${pred.ingredient}: ${pred.reason}. Sugestão: ${pred.suggestedPurchase}`,
        createdAt: new Date()
      });
    });

    // Add tips based on time
    const context = getMenuContext();
    if (context.isWeekend) {
      insights.push({
        id: 'tip-weekend',
        type: 'tip',
        severity: 'success',
        title: 'Dica de Fim de Semana',
        message: 'Fins de semana têm 40% mais pedidos. Prepare o estoque!',
        createdAt: new Date()
      });
    }

  } catch (error) {
    console.error('[NeuralCore] Daily insights error:', error);
  }

  return insights;
}
