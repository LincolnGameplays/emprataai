/**
 * 🤖 Google AI Service - Otimizado para Economia de Cota
 * 
 * Estratégias implementadas:
 * 1. Modelo gemini-1.5-flash (15 RPM, 1500/dia no plano gratuito)
 * 2. Mock Mode em desenvolvimento (economiza cota no localhost)
 * 3. Preparado para cache no Firestore
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key do ambiente
const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || "SUA_API_KEY_AQUI";

// Detecta se está em desenvolvimento (localhost)
const IS_DEV = import.meta.env.DEV;

// Inicializa o cliente Google AI
const genAI = new GoogleGenerativeAI(API_KEY);

// ═══════════════════════════════════════════════════════════════════════════
// MODELO PRINCIPAL: gemini-1.5-flash (Plano Gratuito Generoso)
// - 15 RPM (1 a cada 4 segundos)
// - 1.500 requisições/dia
// - 1M tokens/minuto
// ═══════════════════════════════════════════════════════════════════════════

export const logicModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash", // ✅ Modelo otimizado para alta frequência
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA PARA DESENVOLVIMENTO (Economiza cota no localhost)
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_RESPONSES: Record<string, string> = {
  insight: "📊 Insight Simulado: Aumente o estoque de refrigerantes, pois hoje é sexta-feira e o consumo tende a subir 40%.",
  description: "Delicioso hambúrguer artesanal com blend de carnes nobres, queijo cheddar derretido, bacon crocante e molho especial da casa.",
  suggestion: "💡 Sugestão: Seus pedidos estão 15% acima da média para este horário. Considere ativar o Modo Chuva.",
  default: "Resposta simulada da IA para economia de cota em desenvolvimento."
};

function getMockResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('insight') || lowerPrompt.includes('análise')) return MOCK_RESPONSES.insight;
  if (lowerPrompt.includes('descrição') || lowerPrompt.includes('cardápio')) return MOCK_RESPONSES.description;
  if (lowerPrompt.includes('sugestão') || lowerPrompt.includes('recomend')) return MOCK_RESPONSES.suggestion;
  return MOCK_RESPONSES.default;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL COM MOCK MODE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gera insight/resposta da IA com economia de cota
 * Em DEV: retorna mock instantâneo
 * Em PROD: chama a API real
 */
export async function getAiInsight(prompt: string): Promise<string> {
  // 🛑 MOCK MODE: Em desenvolvimento, não gasta cota
  if (IS_DEV) {
    console.log("🤖 [MOCK] IA simulada (economia de cota):", prompt.slice(0, 50) + "...");
    await new Promise(r => setTimeout(r, 800)); // Simula delay de rede
    return getMockResponse(prompt);
  }

  // 🚀 PRODUÇÃO: Chama a IA real
  try {
    const result = await logicModel.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error("[GoogleAI] Erro:", error.message);
    
    // Trata erro 429 (Rate Limit)
    if (error.message?.includes('429')) {
      return "⏳ IA ocupada no momento. Tente novamente em alguns segundos.";
    }
    
    return "IA indisponível no momento.";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA GERAR JSON ESTRUTURADO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gera resposta em JSON válido (útil para parsing de cardápio, etc.)
 */
export async function generateJSON<T = any>(prompt: string): Promise<T> {
  // Mock em DEV
  if (IS_DEV) {
    console.log("🤖 [MOCK] JSON simulado:", prompt.slice(0, 50) + "...");
    await new Promise(r => setTimeout(r, 500));
    // Retorna objeto mock baseado no contexto
    return { 
      success: true, 
      data: "Dados simulados para desenvolvimento",
      items: []
    } as T;
  }

  // Produção: usa modelo com responseMimeType JSON
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error: any) {
    console.error("[GoogleAI] Erro ao gerar JSON:", error.message);
    throw new Error("Falha ao processar resposta da IA");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Verifica se deve usar IA real (para bypass manual do mock)
// ═══════════════════════════════════════════════════════════════════════════

export const isAiMockEnabled = IS_DEV;

/**
 * Força chamada real à IA (ignora mock) - use com cuidado!
 */
export async function forceRealAiCall(prompt: string): Promise<string> {
  try {
    const result = await logicModel.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error("[GoogleAI] Erro na chamada forçada:", error.message);
    return "Erro ao chamar IA.";
  }
}
