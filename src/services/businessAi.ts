/**
 * ⚡ EMPRATA BRAIN - BUSINESS INTELLIGENCE v1.0 ⚡
 * AI-Powered Business Consulting Tools
 * 
 * Functions:
 * - analyzePricing: Michelin-level pricing analysis with Neuromarketing tips
 * - generateReviewReply: Smart replies for negative reviews
 * - generateCampaign: Viral WhatsApp copy generator
 * 
 * Model: Gemini 3 Pro Preview (same as Neural Engine)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize API with environment key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || "");

// Use Gemini 3 Pro for intelligent reasoning
const LOGIC_MODEL = "models/gemini-3-pro-preview";

// ══════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════════

export interface PricingAnalysis {
  suggestedPrice: number;
  costEstimate: number;
  tip: string;
}

export interface ReviewReply {
  tone: string;
  text: string;
}

export interface ReviewRepliesResponse {
  replies: ReviewReply[];
}

// ══════════════════════════════════════════════════════════════════
// A. ANALYZE PRICING - "O Espião de Lucro"
// Michelin Consultant for menu pricing with Neuromarketing
// ══════════════════════════════════════════════════════════════════

export async function analyzePricing(
  description: string,
  targetMargin: number
): Promise<PricingAnalysis> {
  if (!description.trim()) {
    throw new Error("Descrição do prato é obrigatória.");
  }

  if (targetMargin < 30 || targetMargin > 100) {
    throw new Error("Margem deve estar entre 30% e 100%.");
  }

  const model = genAI.getGenerativeModel({ 
    model: LOGIC_MODEL,
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const prompt = `Atue como um Consultor de Menu Michelin com expertise em precificação gastronômica no Brasil.

Analise este prato: "${description}"

SUAS TAREFAS:
1. **Custo Estimado:** Estime o custo dos ingredientes em Reais (R$), considerando fornecedores brasileiros de médio porte. Seja realista com porções típicas.
2. **Preço de Venda:** Sugira um Preço de Venda ideal para atingir ${targetMargin}% de margem de lucro bruta. Use a fórmula: Preço = Custo / (1 - ${targetMargin}/100).
3. **Dica de Neuromarketing:** Dê UMA dica psicológica matadora para aumentar o valor percebido (ex: trocar palavras no nome, usar número quebrado, sugestão de empratamento, técnica de ancoragem).

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "suggestedPrice": 45.90,
  "costEstimate": 12.50,
  "tip": "Troque 'Burger' por 'Smash Artesanal' e use preço R$ 44,90 (números ímpares parecem mais autênticos)"
}`;

  console.log("🧠 [Business AI] Analisando precificação...");
  
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    const parsed = JSON.parse(responseText) as PricingAnalysis;
    
    // Validate required fields
    if (typeof parsed.suggestedPrice !== 'number' || 
        typeof parsed.costEstimate !== 'number' || 
        typeof parsed.tip !== 'string') {
      throw new Error("Estrutura de resposta inválida");
    }

    console.log("✅ [Business AI] Análise de precificação concluída!");
    return parsed;

  } catch (parseError) {
    console.error("❌ [Business AI] Erro ao parsear resposta:", responseText);
    throw new Error("Erro ao processar análise. Tente novamente.");
  }
}

// ══════════════════════════════════════════════════════════════════
// B. GENERATE REVIEW REPLY - "Blindagem de Reputação"
// Smart replies for negative reviews without admitting fault
// ══════════════════════════════════════════════════════════════════

export async function generateReviewReply(
  reviewText: string,
  stars: number
): Promise<ReviewRepliesResponse> {
  if (!reviewText.trim()) {
    throw new Error("Texto da avaliação é obrigatório.");
  }

  if (stars < 1 || stars > 5) {
    throw new Error("Estrelas devem estar entre 1 e 5.");
  }

  const model = genAI.getGenerativeModel({ 
    model: LOGIC_MODEL,
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const prompt = `Você é um especialista em Gestão de Reputação Online para restaurantes.

Um cliente postou esta avaliação (${stars} estrela${stars > 1 ? 's' : ''}):
"${reviewText}"

SUAS TAREFAS:
Escreva 3 opções de resposta profissional:
1. **Curta:** Máximo 2 linhas, direta e cordial.
2. **Empática:** 3-4 linhas, foco em acolher o sentimento do cliente.
3. **Profissional:** 4-5 linhas, postura corporativa elegante.

REGRAS CRÍTICAS:
- NUNCA admita culpa diretamente (evite "foi nosso erro", "pedimos desculpas pelo erro")
- Foque em agradecer o feedback e mostrar compromisso com melhoria
- Convide o cliente para retornar com uma experiência melhor
- Mantenha tom respeitoso mesmo se a crítica for injusta

Retorne APENAS um JSON válido:
{
  "replies": [
    { "tone": "Curta", "text": "Resposta curta aqui..." },
    { "tone": "Empática", "text": "Resposta empática aqui..." },
    { "tone": "Profissional", "text": "Resposta profissional aqui..." }
  ]
}`;

  console.log("🛡️ [Business AI] Gerando respostas de reputação...");
  
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    const parsed = JSON.parse(responseText) as ReviewRepliesResponse;
    
    // Validate required structure
    if (!Array.isArray(parsed.replies) || parsed.replies.length === 0) {
      throw new Error("Estrutura de resposta inválida");
    }

    console.log("✅ [Business AI] Respostas geradas!");
    return parsed;

  } catch (parseError) {
    console.error("❌ [Business AI] Erro ao parsear resposta:", responseText);
    throw new Error("Erro ao gerar respostas. Tente novamente.");
  }
}

// ══════════════════════════════════════════════════════════════════
// C. GENERATE CAMPAIGN - "Campanha Num Clique"
// Viral WhatsApp copy with emojis and mental triggers
// ══════════════════════════════════════════════════════════════════

export async function generateCampaign(
  menuItemName: string,
  price: number
): Promise<string> {
  if (!menuItemName.trim()) {
    throw new Error("Nome do prato é obrigatório.");
  }

  if (price <= 0) {
    throw new Error("Preço deve ser maior que zero.");
  }

  const model = genAI.getGenerativeModel({ model: LOGIC_MODEL });

  const prompt = `Você é um Copywriter de Marketing Gastronômico especialista em WhatsApp.

PRATO: "${menuItemName}"
PREÇO: R$ ${price.toFixed(2)}

CRIE uma mensagem de WhatsApp curta e viral para vender este prato AGORA.

REGRAS:
- Máximo 280 caracteres (tamanho de tweet)
- Use 3-5 emojis estratégicos (🔥🍔🤤💥⚡)
- Aplique ESCASSEZ ("Só hoje", "Últimas unidades", "Acaba às 22h")
- Use GATILHOS MENTAIS (urgência, exclusividade, fome imediata)
- Tom: Jovem, descontraído, irresistível
- NÃO use hashtags

EXEMPLO BOM:
"🔥 X-BACON DUPLO por apenas R$ 24,90! Só até meia-noite 🕛 Corre que o queijo tá derretendo e a fila tá formando! 🍔🤤 Pede agora!"

Responda APENAS com o texto da mensagem, sem aspas nem explicações.`;

  console.log("🚀 [Business AI] Gerando campanha viral...");
  
  const result = await model.generateContent(prompt);
  const campaignText = result.response.text().trim();

  // Remove any surrounding quotes if present
  const cleanText = campaignText.replace(/^["']|["']$/g, '');

  console.log("✅ [Business AI] Campanha gerada!");
  return cleanText;
}
// ══════════════════════════════════════════════════════════════════
// D. PROFIT GUARDIAN - "Auditoria Financeira"
// Analyzes menu margins and financial health
// ══════════════════════════════════════════════════════════════════

export interface MenuAuditResult {
  dangerousItems: {
    name: string;
    currentMargin: number;
    suggestion: string;
    suggestedPrice: number;
  }[];
  overallHealth: number; // 0 a 100
}

export async function auditMenuMargins(items: any[]) {
  const itemsData = items.map(i => ({
    name: i.title,
    price: i.price,
    cost: i.costPrice || (i.price * 0.4) // Se não tiver custo, assume 40% (pior caso)
  }));

  const model = genAI.getGenerativeModel({ 
    model: LOGIC_MODEL,
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const prompt = `
    Atue como um CFO de Restaurante. Analise estes itens do cardápio:
    ${JSON.stringify(itemsData)}

    REGRAS:
    1. Calcule a margem bruta: (Preço - Custo) / Preço.
    2. Identifique itens com margem < 30% (Perigo).
    3. Para os itens perigosos, sugira um novo preço para atingir 45% de margem.
    4. Dê uma nota de 0 a 100 para a saúde financeira do menu.

    Retorne JSON:
    {
      "dangerousItems": [{ "name": "...", "currentMargin": 0.25, "suggestion": "Aumentar preço ou reduzir porção de proteína", "suggestedPrice": 0.00 }],
      "overallHealth": 85
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Erro na auditoria:", error);
    return { dangerousItems: [], overallHealth: 0 };
  }
}
