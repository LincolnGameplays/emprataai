import { GoogleGenerativeAI } from "@google/generative-ai";

// Recupera a chave e sanitiza
const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || "";
const IS_DEV = import.meta.env.DEV;

// Instância segura (pode ser null se a chave não existir)
const genAI = API_KEY.length > 10 ? new GoogleGenerativeAI(API_KEY) : null;

// Modelo Otimizado
const logicModel = genAI?.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 500,
  }
});

// ══════════════════════════════════════════════════════════════════
// MOCK DATA (Fallback de Segurança)
// ══════════════════════════════════════════════════════════════════
const MOCK_RESPONSES: Record<string, string> = {
  insight: "📊 Insight: Suas vendas estão 20% acima da média das terças-feiras. O prato 'X-Bacon' está liderando os pedidos.",
  marketing: "🔥 Promoção Relâmpago: Peça agora e ganhe entrega grátis em pedidos acima de R$ 50! Oferta válida por 2 horas.",
  default: "✨ A IA analisou seus dados e sugere manter o estoque alto para o fim de semana."
};

function getMock(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes('venda') || p.includes('insight')) return MOCK_RESPONSES.insight;
  if (p.includes('marketing') || p.includes('texto')) return MOCK_RESPONSES.marketing;
  return MOCK_RESPONSES.default;
}

// ══════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL BLINDADA
// ══════════════════════════════════════════════════════════════════
export async function getAiInsight(prompt: string): Promise<string> {
  // 1. Se não tem chave ou modelo, usa Mock imediatamente
  if (!logicModel || !API_KEY) {
    console.warn("⚠️ [GoogleAI] API Key ausente ou inválida. Usando modo offline.");
    return getMock(prompt);
  }

  // 2. Se for DEV e quisermos economizar cota (Opcional)
  if (IS_DEV && !prompt.includes("FORCE_REAL")) {
    console.log("🤖 [MOCK DEV] Simulando resposta da IA...");
    await new Promise(r => setTimeout(r, 800));
    return getMock(prompt);
  }

  // 3. Tentativa Real com Tratamento de Erro
  try {
    const result = await logicModel.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("❌ [GoogleAI] Erro na API:", error.message);
    
    // Se for erro de chave ou cota excedida, fallback para Mock
    if (error.message?.includes("400") || error.message?.includes("429")) {
      return getMock(prompt);
    }
    
    return "A IA está indisponível momentaneamente. Tente novamente em breve.";
  }
}

// Exporta o modelo apenas se estiver validado
export { logicModel };
