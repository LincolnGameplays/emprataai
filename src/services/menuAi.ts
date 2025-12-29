/**
 * Menu AI Service - Gemini-powered Intelligence V2
 * Enhances menu descriptions, auto-organizes, and suggests order bumps
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIOrganizeResponse } from "../types/menu";
import type { AISmartOrganizeResponse } from "../types/orders";

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

