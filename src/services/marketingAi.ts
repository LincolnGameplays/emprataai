/**
 * 🧠 Marketing AI Service - Neural Message Personalization
 * 
 * Uses Gemini AI to rewrite marketing messages for each customer,
 * avoiding WhatsApp bans (identical mass messages get flagged)
 * and increasing conversion through personalization.
 */

import { logicModel, getAiInsight } from './googleAi';
import { safeRequest } from './apiClient';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CustomerProfile {
  name: string;
  phone?: string;
  favoriteDish: string;
  lastOrderDays: number; // Days since last order
  totalOrders?: number;
  averageTicket?: number;
}

export interface CampaignConfig {
  baseMessage: string;
  customers: CustomerProfile[];
  sendWindow: { start: number; end: number }; // Hours (10-20)
  dailyLimit: number;
}

export interface PersonalizedMessage {
  customer: CustomerProfile;
  message: string;
  scheduledTime: Date;
  status: 'pending' | 'sent' | 'failed';
}

// ═══════════════════════════════════════════════════════════════════════════
// NEURAL MESSAGE PERSONALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rewrites a base message for a specific customer using AI
 * Creates unique variations to avoid WhatsApp spam detection
 */
export async function personalizeMessage(
  baseMessage: string, 
  customer: CustomerProfile
): Promise<string> {
  const prompt = `
    ATUE COMO UM ASSISTENTE DE MARKETING DE RESTAURANTE.
    
    Mensagem Base do Dono: "${baseMessage}"
    
    Cliente Alvo:
    - Nome: ${customer.name}
    - Prato Favorito: ${customer.favoriteDish}
    - Não compra há: ${customer.lastOrderDays} dias
    ${customer.totalOrders ? `- Total de Pedidos: ${customer.totalOrders}` : ''}
    
    SUA MISSÃO:
    Reescreva a mensagem base para torná-la pessoal e irresistível para ESTE cliente específico.
    1. Use o nome dele.
    2. Mencione o prato favorito para dar fome.
    3. Mantenha o tom da mensagem original (Promoção, Aviso, Saudade).
    4. NÃO seja longo. Máximo 2 frases.
    5. Use emojis com moderação.
    6. Seja natural, como uma conversa entre amigos.
    
    Responda APENAS com a mensagem reescrita, sem aspas.
  `;

  return safeRequest(
    async () => {
      const result = await logicModel.generateContent(prompt);
      return result.response.text().trim();
    },
    "Erro na personalização",
    { fallback: baseMessage, silent: true }
  );
}

/**
 * Batch personalize messages for multiple customers
 */
export async function batchPersonalize(
  baseMessage: string,
  customers: CustomerProfile[]
): Promise<PersonalizedMessage[]> {
  const results: PersonalizedMessage[] = [];
  
  for (const customer of customers) {
    const message = await personalizeMessage(baseMessage, customer);
    results.push({
      customer,
      message,
      scheduledTime: new Date(),
      status: 'pending'
    });
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// CAMPAIGN SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface CampaignSuggestion {
  type: 'winback' | 'promotion' | 'launch' | 'loyalty';
  title: string;
  template: string;
  targetDays?: number; // For winback: days since last order
}

export const CAMPAIGN_TEMPLATES: CampaignSuggestion[] = [
  {
    type: 'winback',
    title: '🔙 Recuperar Cliente Sumido',
    template: 'Faz tempo que você não vem nos visitar! Sentimos sua falta. Que tal um desconto especial?',
    targetDays: 30
  },
  {
    type: 'promotion',
    title: '🔥 Promoção Relâmpago',
    template: 'Só hoje! Promoção especial que você não vai querer perder.',
  },
  {
    type: 'launch',
    title: '🆕 Lançamento de Produto',
    template: 'Temos novidade no cardápio! Você vai amar experimentar.',
  },
  {
    type: 'loyalty',
    title: '💎 Cliente VIP',
    template: 'Você é especial para nós! Temos uma oferta exclusiva para clientes fiéis.',
  }
];

/**
 * Get smart campaign suggestion based on customer data
 */
export async function getSuggestedCampaign(
  customers: CustomerProfile[]
): Promise<CampaignSuggestion> {
  // Find customers who haven't ordered in 30+ days
  const dormantCount = customers.filter(c => c.lastOrderDays >= 30).length;
  const dormantPercentage = (dormantCount / customers.length) * 100;
  
  if (dormantPercentage > 40) {
    return CAMPAIGN_TEMPLATES.find(t => t.type === 'winback')!;
  }
  
  // Default to promotion
  return CAMPAIGN_TEMPLATES.find(t => t.type === 'promotion')!;
}
