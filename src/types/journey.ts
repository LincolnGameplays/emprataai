/**
 * 🚀 EMPRATA JOURNEY - Sistema de Gamificação Realista
 * 
 * Estratégia "Pé no Chão" / Digital First:
 * - Níveis iniciais: Recompensas digitais (Custo Zero)
 * - Níveis Elite: Recompensas físicas (apenas quando gerou receita 10x)
 * - Benefícios operacionais: Taxas menores, saques mais rápidos
 * 
 * Dois pilares:
 * - Owner Journey: Baseado em faturamento VERIFICADO (só online)
 * - Foodie Journey: Baseado em número de pedidos
 */

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type JourneyLevel = 'STARTER' | 'VALIDATED' | 'BUILDER' | 'SCALER' | 'PRO' | 'LEGEND';

export type RewardType = 'DIGITAL_CERTIFICATE' | 'VIP_COMMUNITY' | 'FEATURE_UNLOCK' | 'PHYSICAL_PLAQUE' | 'TROPHY' | null;

export interface OwnerLevel {
  id: JourneyLevel;
  label: string;
  threshold: number;
  benefits: string[];
  icon: string;
  color: string;
  bgGradient: string;
  feeDiscount: number;
  reward: string | null;
  rewardType: RewardType;
  rewardDescription?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// OWNER JOURNEY - Jornada Realista e Escalável
// ════════════════════════════════════════════════════════════════════════════

export const OWNER_JOURNEY: OwnerLevel[] = [
  {
    id: 'STARTER',
    label: 'Início da Jornada',
    threshold: 0,
    benefits: ['Acesso à Plataforma', 'Suporte via Ticket'],
    icon: '🌱',
    color: 'text-gray-500',
    bgGradient: 'from-gray-600 to-gray-800',
    feeDiscount: 0,
    reward: null,
    rewardType: null
  },
  {
    id: 'VALIDATED',
    label: 'Negócio Validado',
    threshold: 10000, // R$ 10k (Provou que o delivery funciona)
    benefits: ['Selo de Verificado', 'Certificado Digital de Validação'],
    icon: '🛡️',
    color: 'text-blue-400',
    bgGradient: 'from-blue-600 to-blue-800',
    feeDiscount: 0,
    reward: 'Certificado Digital (Para Instagram)',
    rewardType: 'DIGITAL_CERTIFICATE',
    rewardDescription: 'Poste no Stories e ganhe reconhecimento!'
  },
  {
    id: 'BUILDER',
    label: 'Emprata Builder',
    threshold: 50000, // R$ 50k
    benefits: ['Saque Prioritário (D+1)', 'Acesso ao Grupo VIP no WhatsApp'],
    icon: '🧱',
    color: 'text-orange-400',
    bgGradient: 'from-orange-600 to-orange-800',
    feeDiscount: 0,
    reward: 'Convite Comunidade VIP',
    rewardType: 'VIP_COMMUNITY',
    rewardDescription: 'Networking com outros donos de sucesso'
  },
  {
    id: 'SCALER',
    label: 'Emprata Scaler',
    threshold: 150000, // R$ 150k
    benefits: ['Taxa Reduzida (-0.5%)', 'Desbloqueio do Módulo CRM Avançado'],
    icon: '🚀',
    color: 'text-gray-200',
    bgGradient: 'from-gray-400 to-gray-600',
    feeDiscount: 0.005, // -0.5%
    reward: 'Upgrade de Funcionalidade',
    rewardType: 'FEATURE_UNLOCK',
    rewardDescription: 'CRM Avançado desbloqueado automaticamente'
  },
  {
    id: 'PRO',
    label: 'Emprata Pro',
    threshold: 500000, // R$ 500k (Meio Milhão)
    benefits: ['Taxa Reduzida (-1.0%)', 'Gerente de Contas Dedicado'],
    icon: '🥇',
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-500 to-yellow-700',
    feeDiscount: 0.01, // -1%
    reward: 'PLACA FÍSICA 500K',
    rewardType: 'PHYSICAL_PLAQUE',
    rewardDescription: 'Placa exclusiva enviada para seu restaurante'
  },
  {
    id: 'LEGEND',
    label: 'Lenda do Delivery',
    threshold: 1000000, // R$ 1 Milhão
    benefits: ['Taxa Personalizada', 'Mentoria com Fundadores'],
    icon: '💎',
    color: 'text-purple-500',
    bgGradient: 'from-purple-600 to-purple-900',
    feeDiscount: 0.015, // -1.5%
    reward: 'TROFÉU 1 MILHÃO + Jantar',
    rewardType: 'TROPHY',
    rewardDescription: 'Troféu exclusivo + jantar com os fundadores'
  }
];

// ════════════════════════════════════════════════════════════════════════════
// CUSTOMER JOURNEY (Para clientes - Foodie Journey)
// ════════════════════════════════════════════════════════════════════════════

export interface CustomerLevel {
  id: string;
  label: string;
  ordersRequired: number;
  discount: number; // Desconto fixo em R$ por pedido
  icon: string;
  color: string;
}

export const CUSTOMER_JOURNEY: CustomerLevel[] = [
  { id: 'VISITOR', label: 'Visitante', ordersRequired: 0, discount: 0, icon: '👋', color: 'text-gray-400' },
  { id: 'FOODIE', label: 'Foodie', ordersRequired: 5, discount: 1, icon: '🍴', color: 'text-green-400' },
  { id: 'CRITIC', label: 'Crítico Gastronômico', ordersRequired: 20, discount: 2, icon: '⭐', color: 'text-purple-400' },
  { id: 'MASTER', label: 'Emprata Master', ordersRequired: 50, discount: 5, icon: '👑', color: 'text-yellow-400' },
];

// ════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Retorna o nível atual do dono baseado no faturamento verificado
 */
export function getOwnerLevel(verifiedRevenue: number): OwnerLevel {
  return [...OWNER_JOURNEY].reverse().find(lvl => verifiedRevenue >= lvl.threshold) || OWNER_JOURNEY[0];
}

/**
 * Retorna o próximo nível a ser alcançado
 */
export function getNextOwnerLevel(verifiedRevenue: number): OwnerLevel | null {
  return OWNER_JOURNEY.find(lvl => verifiedRevenue < lvl.threshold) || null;
}

/**
 * Calcula o progresso percentual para o próximo nível
 */
export function getOwnerProgress(verifiedRevenue: number): { percent: number; remaining: number } {
  const current = getOwnerLevel(verifiedRevenue);
  const next = getNextOwnerLevel(verifiedRevenue);
  
  if (!next) return { percent: 100, remaining: 0 };
  
  const rangeStart = current.threshold;
  const rangeEnd = next.threshold;
  const progress = verifiedRevenue - rangeStart;
  const range = rangeEnd - rangeStart;
  
  return {
    percent: Math.min(100, Math.max(0, (progress / range) * 100)),
    remaining: rangeEnd - verifiedRevenue
  };
}

/**
 * Retorna o nível atual do cliente baseado em pedidos
 */
export function getCustomerLevel(orderCount: number): CustomerLevel {
  return [...CUSTOMER_JOURNEY].reverse().find(lvl => orderCount >= lvl.ordersRequired) || CUSTOMER_JOURNEY[0];
}

/**
 * Retorna o próximo nível do cliente
 */
export function getNextCustomerLevel(orderCount: number): CustomerLevel | null {
  return CUSTOMER_JOURNEY.find(lvl => orderCount < lvl.ordersRequired) || null;
}

/**
 * Calcula desconto na taxa para um dono baseado no nível
 * @returns Taxa final (ex: 0.085 se taxa base é 9% e tem 0.5% desconto)
 */
export function calculateOwnerFee(baseFee: number, verifiedRevenue: number): number {
  const level = getOwnerLevel(verifiedRevenue);
  return Math.max(0, baseFee - level.feeDiscount);
}

/**
 * Verifica se o usuário tem direito a uma recompensa específica
 */
export function hasRewardUnlocked(verifiedRevenue: number, rewardType: RewardType): boolean {
  const level = getOwnerLevel(verifiedRevenue);
  const levelIndex = OWNER_JOURNEY.findIndex(l => l.id === level.id);
  
  return OWNER_JOURNEY.slice(0, levelIndex + 1).some(l => l.rewardType === rewardType);
}

/**
 * Retorna todas as recompensas disponíveis para o usuário
 */
export function getUnlockedRewards(verifiedRevenue: number): OwnerLevel[] {
  const level = getOwnerLevel(verifiedRevenue);
  const levelIndex = OWNER_JOURNEY.findIndex(l => l.id === level.id);
  
  return OWNER_JOURNEY.slice(0, levelIndex + 1).filter(l => l.reward !== null);
}
