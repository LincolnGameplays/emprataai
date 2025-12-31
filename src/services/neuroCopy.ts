/**
 * ⚡ NEURO-COPYWRITING SERVICE ⚡
 * AI-powered menu description rewriting based on user mood/vibe
 * Creates dynamic, emotionally-targeted food descriptions
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key from environment
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export type UserVibe = 'comfort' | 'fitness' | 'energy' | 'late_night' | 'standard';

// ══════════════════════════════════════════════════════════════════
// VIBE PROMPTS
// ══════════════════════════════════════════════════════════════════

const VIBE_PROMPTS: Record<UserVibe, string> = {
  comfort: "Foco em conforto, calor, abraço, dia chuvoso, queijo derretido, aconchego.",
  fitness: "Foco em proteínas, saúde, leveza, energia limpa, sem culpa, pós-treino.",
  energy: "Foco em matar a fome brutal, exagero, tamanho GG, sabor intenso, fartura.",
  late_night: "Foco em larica da madrugada, gordura boa, prazer imediato, recompensa.",
  standard: "Descrição padrão."
};

// ══════════════════════════════════════════════════════════════════
// REWRITE DESCRIPTION
// ══════════════════════════════════════════════════════════════════

/**
 * Rewrites a food item description based on user's current vibe
 */
export async function rewriteDescription(
  itemName: string, 
  originalDesc: string, 
  vibe: UserVibe
): Promise<string> {
  if (vibe === 'standard' || !API_KEY) return originalDesc;

  // Cache to avoid redundant API calls
  const cacheKey = `neuro_${itemName.toLowerCase().replace(/\s/g, '_')}_${vibe}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      Atue como um Copywriter Gastronômico de elite especializado em Neuromarketing.
      
      Reescreva a descrição deste prato: "${itemName}" (Descrição atual: "${originalDesc || 'Delicioso'}").
      
      CONTEXTO/VIBE DO CLIENTE: ${VIBE_PROMPTS[vibe]}
      
      REGRAS:
      - Máximo 100 caracteres
      - Use 1-2 emojis relevantes
      - Seja extremamente persuasivo e sensorial
      - Use gatilhos emocionais (textura, aroma, satisfação)
      - Não invente ingredientes que não existem
      - Fale em português brasileiro coloquial
      
      Retorne APENAS o texto da nova descrição, sem aspas.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Cache for 24h
    localStorage.setItem(cacheKey, text);
    
    return text;
  } catch (error) {
    console.error("[NeuroCopy] Error:", error);
    return originalDesc;
  }

}

// ══════════════════════════════════════════════════════════════════
// GENERATE NEW DESCRIPTION (ZERO SHOT)
// ══════════════════════════════════════════════════════════════════

/**
 * Generates a fresh description for a new item name
 */
export async function generateNewDescription(
  itemName: string,
  vibe: UserVibe = 'standard'
): Promise<string> {
  if (!API_KEY) return "Delicioso prato da casa.";

  try {
    const prompt = `
      Atue como um Copywriter Gastronômico de elite.
      
      Crie uma descrição curta e viciante para o prato: "${itemName}".
      
      CONTEXTO/VIBE: ${VIBE_PROMPTS[vibe]}
      
      REGRAS:
      - Máximo 100 caracteres
      - Use 1 emoji
      - Foco em sabor e desejo
      - Português Brasileiro
      
      Retorne APENAS o texto.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error("[NeuroCopy] Error:", error);
    return "Uma deliciosa opção para você.";
  }
}

// ══════════════════════════════════════════════════════════════════
// BATCH REWRITE (Optimized)
// ══════════════════════════════════════════════════════════════════

interface MenuItem {
  id: string;
  title: string;
  description?: string;
}

/**
 * Rewrites multiple items in batch for efficiency
 */
export async function batchRewriteDescriptions(
  items: MenuItem[],
  vibe: UserVibe,
  maxItems: number = 10
): Promise<Record<string, string>> {
  if (vibe === 'standard' || !API_KEY) return {};

  const result: Record<string, string> = {};
  const itemsToProcess = items.slice(0, maxItems);

  // Process in parallel with limit
  const promises = itemsToProcess.map(async (item) => {
    const newDesc = await rewriteDescription(item.title, item.description || '', vibe);
    result[item.id] = newDesc;
  });

  await Promise.all(promises);
  return result;
}

// ══════════════════════════════════════════════════════════════════
// GET VIBE FROM CONTEXT
// ══════════════════════════════════════════════════════════════════

/**
 * Auto-detect recommended vibe based on time/weather
 */
export function getAutoVibe(): UserVibe {
  const hour = new Date().getHours();
  
  if (hour >= 23 || hour < 5) return 'late_night';
  if (hour >= 6 && hour < 10) return 'energy';
  if (hour >= 12 && hour < 14) return 'energy';
  
  return 'standard';
}

// ══════════════════════════════════════════════════════════════════
// VIBE METADATA (for UI)
// ══════════════════════════════════════════════════════════════════

export const VIBE_METADATA: Record<UserVibe, { emoji: string; label: string; color: string }> = {
  comfort: { emoji: '🌧️', label: 'Frio/Chuva', color: 'border-blue-500' },
  fitness: { emoji: '💪', label: 'Fitness', color: 'border-green-500' },
  energy: { emoji: '⚡', label: 'Fome Monstro', color: 'border-orange-500' },
  late_night: { emoji: '🌙', label: 'Larica', color: 'border-purple-500' },
  standard: { emoji: '☀️', label: 'Normal', color: 'border-white/20' }
};
