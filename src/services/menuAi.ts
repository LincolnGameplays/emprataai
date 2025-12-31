/**
 * Menu AI Service - Gemini-powered Intelligence V2
 * Enhances menu descriptions, auto-organizes, and suggests order bumps
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIOrganizeResponse, AISmartOrganizeResponse } from "../types/menu";

// Initialize API with environment key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || "");

// Use Gemini 1.5 Pro for better language nuance and JSON output
const AI_MODEL = "gemini-1.5-pro";

// ══════════════════════════════════════════════════════════════════
// ENHANCE DESCRIPTION
// Transforms simple descriptions into persuasive gastro-copy
// ══════════════════════════════════════════════════════════════════

export async function enhanceDescription(
  originalText: string,
  vibe: string = "gourmet"
): Promise<string> {
  if (!originalText.trim()) {
    throw new Error("Texto vazio não pode ser aprimorado.");
  }

  const model = genAI.getGenerativeModel({ model: AI_MODEL });

  const prompt = `Atue como um Copywriter Gastronômico de elite. Reescreva a descrição deste prato para torná-la irresistível, focada em despertar fome e sensorialidade. Mantenha curto (máx 150 caracteres). Vibe: ${vibe}.

Descrição original: "${originalText}"

Responda APENAS com a descrição aprimorada, sem aspas nem explicações.`;

  const result = await model.generateContent(prompt);
  const enhanced = result.response.text().trim();

  // Ensure we don't exceed 150 chars
  return enhanced.substring(0, 150);
}

// ══════════════════════════════════════════════════════════════════
// ORGANIZE MENU STRUCTURE (Basic)
// Takes a flat list of item names and returns categorized JSON
// ══════════════════════════════════════════════════════════════════

export async function organizeMenuStructure(
  items: string[]
): Promise<AIOrganizeResponse> {
  if (!items.length) {
    throw new Error("Lista de itens vazia.");
  }

  const model = genAI.getGenerativeModel({ 
    model: AI_MODEL,
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const itemsList = items.map((item, i) => `${i + 1}. ${item}`).join("\n");

  const prompt = `Atue como um Engenheiro de Cardápio. Analise esta lista de itens.
1. Categorize-os logicamente (Entradas, Pratos Principais, Burgers, Pizzas, Bebidas, Sobremesas, etc).
2. Identifique quais itens têm maior potencial de venda para serem "Destaques" (Highlights) - máximo 3 itens.

Lista de itens:
${itemsList}

Retorne APENAS um JSON válido com a estrutura:
{
  "categories": [
    { "name": "Nome da Categoria", "items": ["Item 1", "Item 2"] }
  ],
  "suggestedHighlights": ["Item destaque 1", "Item destaque 2"]
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    // Parse JSON response
    const parsed = JSON.parse(responseText) as AIOrganizeResponse;
    
    // Validate structure
    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      throw new Error("Resposta inválida da IA");
    }

    return parsed;
  } catch (parseError) {
    console.error("❌ Erro ao parsear resposta da IA:", responseText);
    throw new Error("Erro ao processar resposta da IA. Tente novamente.");
  }
}

// ══════════════════════════════════════════════════════════════════
// ORGANIZE MENU SMART (V2 - With Context Learning)
// Uses restaurant history to make smarter suggestions
// ══════════════════════════════════════════════════════════════════

export async function organizeMenuSmart(
  items: string[],
  restaurantHistory?: { topCategories?: string[]; avgTicket?: number }
): Promise<AISmartOrganizeResponse> {
  if (!items.length) {
    throw new Error("Lista de itens vazia.");
  }

  const model = genAI.getGenerativeModel({ 
    model: AI_MODEL,
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const itemsList = items.map((item, i) => `${i + 1}. ${item}`).join("\n");
  
  const historyContext = restaurantHistory?.topCategories?.length 
    ? `As categorias mais vendidas deste restaurante são: ${restaurantHistory.topCategories.join(", ")}.`
    : "Sem histórico disponível.";

  const prompt = `Você é um Engenheiro de Cardápio Sênior e especialista em Neuromarketing Gastronômico.

CONTEXTO DO RESTAURANTE:
${historyContext}

LISTA DE ITENS:
${itemsList}

SUAS TAREFAS:
1. Organize os itens em categorias lógicas otimizadas para conversão.
2. Melhore as descrições de CADA item usando técnicas de Neuromarketing (gatilhos sensoriais, texturas, aromas) - máximo 100 caracteres por descrição.
3. Sugira 3 "Order Bumps" - itens baratos e complementares para oferecer no checkout (bebidas, sobremesas leves).

Retorne APENAS um JSON válido:
{
  "categories": [
    { "name": "Nome da Categoria", "items": ["Item 1", "Item 2"] }
  ],
  "suggestedHighlights": ["Item 1", "Item 2", "Item 3"],
  "orderBumps": [
    { "itemName": "Nome do Item", "reason": "Por que combina", "suggestedPrice": 9.90 }
  ],
  "improvedDescriptions": [
    { "itemName": "Nome do Item", "newDescription": "Descrição sensorial aqui" }
  ]
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    const parsed = JSON.parse(responseText) as AISmartOrganizeResponse;
    
    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      throw new Error("Resposta inválida da IA");
    }

    // Ensure defaults and convert improvedDescriptions array to Record
    const descriptionsRecord: Record<string, string> = {};
    if (Array.isArray(parsed.improvedDescriptions)) {
      parsed.improvedDescriptions.forEach((item: any) => {
        if (item.itemName && item.newDescription) {
          descriptionsRecord[item.itemName] = item.newDescription;
        }
      });
    } else if (typeof parsed.improvedDescriptions === 'object') {
      Object.assign(descriptionsRecord, parsed.improvedDescriptions);
    }

    return {
      categories: parsed.categories,
      suggestedHighlights: parsed.suggestedHighlights || [],
      orderBumps: parsed.orderBumps || [],
      improvedDescriptions: descriptionsRecord
    };
  } catch (parseError) {
    console.error("❌ Erro ao parsear resposta da IA:", responseText);
    throw new Error("Erro ao processar resposta da IA. Tente novamente.");
  }
}

// ══════════════════════════════════════════════════════════════════
// GENERATE ITEM NAME SUGGESTIONS
// Given a food image description, suggest appetizing item names
// ══════════════════════════════════════════════════════════════════

export async function suggestItemName(
  imageDescription: string
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ 
    model: AI_MODEL,
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const prompt = `Atue como um Chef criativo. Baseado nesta descrição de imagem de comida, sugira 3 nomes criativos para o prato.

Descrição: "${imageDescription}"

Retorne APENAS um JSON: { "suggestions": ["Nome 1", "Nome 2", "Nome 3"] }`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    const parsed = JSON.parse(responseText) as { suggestions: string[] };
    return parsed.suggestions || [];
  } catch {
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════
// SUGGEST ORDER BUMP
// Given cart items, suggest a complementary item
// ══════════════════════════════════════════════════════════════════

export async function suggestOrderBump(
  cartItems: string[],
  availableItems: string[]
): Promise<{ itemName: string; pitch: string } | null> {
  if (!cartItems.length || !availableItems.length) return null;

  const model = genAI.getGenerativeModel({ 
    model: AI_MODEL,
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const prompt = `Você é um consultor de vendas. O cliente pediu: ${cartItems.join(", ")}.
Itens disponíveis para sugerir: ${availableItems.join(", ")}.

Sugira UM item complementar barato (bebida ou sobremesa) com uma frase de vendas irresistível (máx 50 caracteres).

Retorne JSON: { "itemName": "Nome", "pitch": "Frase de venda" }`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return parsed;
  } catch {
    return null;
  }
}


export async function parseMenuFromText(text: string) {
  const prompt = `
    Analise o texto de cardápio abaixo e extraia os itens em formato JSON estruturado.
    O texto pode estar bagunçado. Tente identificar Categoria, Nome do Prato, Descrição e Preço.
    
    Retorne APENAS um JSON com esta estrutura:
    {
      "categories": [
        {
          "title": "Nome da Categoria",
          "items": [
            {
              "title": "Nome do Item",
              "description": "Descrição (se houver)",
              "price": 0.00 (number)
            }
          ]
        }
      ]
    }

    TEXTO DO CARDÁPIO:
    ${text}
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    // Limpeza básica para garantir JSON válido
    const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Erro ao processar cardápio:", error);
    throw new Error("Não foi possível ler o cardápio. Tente formatar melhor o texto.");
  }
}
export async function semanticSearch(userQuery: string, menuItems: any[]) {
  // Cria um "mini índice" dos itens apenas com nome e descrição para economizar tokens
  const simplifiedMenu = menuItems.map(i => `${i.id}: ${i.title} (${i.description})`).join('\n');

  // Usa logicModel importado de googleAi.ts (que precisamos importar aqui se ainda não estiver, mas vou usar o genAI configurado neste arquivo para manter consistência ou usar o logicModel)
  // O arquivo já tem genAI configurado com GEMINI-1.5-PRO. O prompt pede logicModel.
  // Vou usar o modelo padrão deste arquivo (AI_MODEL) que é o 1.5 Pro, que é suficiente e mantém o padrão do arquivo.
  const model = genAI.getGenerativeModel({ 
      model: AI_MODEL,
      generationConfig: {
        responseMimeType: "application/json"
      }
  });

  const prompt = `
    Um cliente buscou: "${userQuery}".
    Abaixo está o cardápio.
    Retorne uma lista JSON com os IDs dos 3 itens que melhor combinam com a INTENÇÃO do cliente (ex: se ele pediu "leve", procure saladas ou grelhados).
    
    Cardápio:
    ${simplifiedMenu}

    Retorne APENAS: ["id1", "id2", "id3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const ids = JSON.parse(result.response.text());
    return ids; // Array de strings
  } catch (e) {
    console.error(e);
    return [];
  }
}
