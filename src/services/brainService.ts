/**
 * 🧠 BRAIN SERVICE - O Cérebro do EmprataBrain
 * 
 * Implementa RAG (Retrieval-Augmented Generation):
 * 1. Busca dados reais do restaurante
 * 2. Injeta no contexto do prompt
 * 3. Envia para a IA responder com base em dados reais
 */

import { logicModel } from './googleAi';
import { getRestaurantContext, formatContextForAI } from './dataAggregator';
import { safeRequest } from './apiClient';

/**
 * Consulta o EmprataBrain com contexto real do restaurante
 * @param restaurantId UID do dono do restaurante
 * @param userQuestion Pergunta do usuário
 */
export async function askEmprataBrain(restaurantId: string, userQuestion: string): Promise<string> {
  
  // 1. Busca os dados reais primeiro (RAG - Retrieval)
  const data = await getRestaurantContext(restaurantId);
  const contextText = formatContextForAI(data);

  // 2. Monta o "System Prompt" com os dados injetados
  const systemContext = `
VOCÊ É O EMPRATABRAIN, um analista de negócios sênior especializado em restaurantes e delivery.

${contextText}

SUA MISSÃO:
Responda à pergunta do dono baseando-se ESTRITAMENTE nesses dados.
- Seja direto, curto e objetivo
- Use formatação Markdown (negrito para números importantes, listas quando apropriado)
- Dê conselhos acionáveis baseados nos dados
- Se o ticket médio for baixo (< R$ 30), sugira combos
- Se o cancelamento for alto (> 5%), alerte sobre processos
- Se não houver dados suficientes, seja honesto e diga que precisa de mais vendas para análise
- Responda sempre em português brasileiro

IMPORTANTE: Não invente dados. Use apenas as informações fornecidas acima.

PERGUNTA DO DONO: "${userQuestion}"
  `.trim();

  // 3. Envia para o Google Gemini (usando safeRequest resiliente)
  const answer = await safeRequest(
    async () => {
      const result = await logicModel.generateContent(systemContext);
      return result.response.text();
    },
    "Erro ao consultar o EmprataBrain",
    {
      fallback: "🔌 Não consegui analisar seus dados agora. O serviço de IA está temporariamente indisponível. Tente novamente em alguns instantes.",
      retries: 2,
      retryDelay: 1000
    }
  );

  return answer;
}

/**
 * Gera sugestões rápidas baseadas no contexto atual
 */
export async function getBrainSuggestions(restaurantId: string): Promise<string[]> {
  try {
    const data = await getRestaurantContext(restaurantId);
    
    const suggestions: string[] = [];
    
    // Sugestões baseadas em dados reais
    if (data.ticketAverage > 0 && data.ticketAverage < 30) {
      suggestions.push("💡 Como aumentar meu ticket médio?");
    }
    
    if (parseFloat(data.cancelledRate) > 5) {
      suggestions.push("⚠️ Como reduzir cancelamentos?");
    }
    
    if (data.topProducts.length > 0) {
      suggestions.push("🍔 Qual meu prato mais lucrativo?");
    }
    
    suggestions.push("📊 Como estão minhas vendas hoje?");
    suggestions.push("📈 Que promoção você sugere?");
    
    return suggestions.slice(0, 4);
  } catch (e) {
    return [
      "📊 Como estão minhas vendas hoje?",
      "🍔 Qual prato vende mais?",
      "📉 Como diminuir cancelamentos?",
      "💡 Me dê uma ideia de promoção."
    ];
  }
}
