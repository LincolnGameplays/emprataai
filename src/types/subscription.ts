/**
 * 🛡️ Subscription Types - Rigorous Plan Access Control
 * 
 * Military-grade feature gating based on Cost vs. Value matrix:
 * - STARTER: Hook the owner with essential operations
 * - GROWTH: Solve logistics and financial pain points  
 * - BLACK: Pure AI-powered profits and automation
 */

export type PlanTier = 'STARTER' | 'GROWTH' | 'BLACK';

// ═══════════════════════════════════════════════════════════════════════════
// PLAN HIERARCHY (Who outranks who)
// ═══════════════════════════════════════════════════════════════════════════

export const PLAN_LEVELS: Record<PlanTier, number> = {
  'STARTER': 1,
  'GROWTH': 2,
  'BLACK': 3
};

export const PLAN_HIERARCHY: PlanTier[] = ['STARTER', 'GROWTH', 'BLACK'];

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSIONS MATRIX (Feature -> Minimum Required Plan)
// ═══════════════════════════════════════════════════════════════════════════

export const PERMISSIONS = {
  // ──────────────────────────────────────────────────────────────────────────
  // 🏰 STARTER (The "Hook") - Free, addicts the operation
  // Cost: Low (basic reads/writes) | Strategy: Once KDS is used, they can't leave
  // ──────────────────────────────────────────────────────────────────────────
  'manage_menu': 'STARTER',
  'receive_orders': 'STARTER',
  'kitchen_screen': 'STARTER',
  'basic_payments': 'STARTER',
  'staff_management': 'STARTER',
  'link_bio': 'STARTER',
  'order_kanban': 'STARTER',
  'view_wallet': 'STARTER',      // 💰 VER SALDO E SACAR (Correção Crítica do Loop de Frustração)

  // ──────────────────────────────────────────────────────────────────────────
  // 🚀 GROWTH (Professional Operations)
  // Cost: Medium (GPS writes, reports) | Strategy: Solve logistics pain
  // ──────────────────────────────────────────────────────────────────────────
  'driver_app_access': 'GROWTH',
  'gps_tracking': 'GROWTH',
  'dispatch_console': 'GROWTH',
  'rain_mode': 'GROWTH',
  'table_qr_code': 'GROWTH',
  'pos_terminal': 'GROWTH',
  'financial_overview': 'GROWTH',
  'basic_reports': 'GROWTH',

  // ──────────────────────────────────────────────────────────────────────────
  // 💎 BLACK (Supreme Intelligence)
  // Cost: High (AI tokens, complex processing) | Strategy: Features pay for themselves
  // ──────────────────────────────────────────────────────────────────────────
  'ai_insights': 'BLACK',
  'emprata_brain': 'BLACK',
  'advanced_analytics': 'BLACK',
  'crm_automation': 'BLACK',
  'sales_forecasting': 'BLACK',
  'profit_guardian': 'BLACK',
  'demand_prediction': 'BLACK',
  'dre_reports': 'BLACK',
  'vip_support': 'BLACK',
  'financial_analytics': 'BLACK' // 📊 DRE, Gráficos e Inteligência de Lucro
} as const; // 'as const' locks values for TypeScript

// ═══════════════════════════════════════════════════════════════════════════
// PLAN FEES (Taxas por venda - Transparência para o usuário)
// ═══════════════════════════════════════════════════════════════════════════

export const PLAN_FEES: Record<PlanTier, number> = {
  STARTER: 0.12, // 12% por venda - Sem mensalidade
  GROWTH: 0.09,  // 9% por venda - R$ 149,90/mês
  BLACK: 0.06    // 6% por venda - R$ 299,90/mês (Melhor para alto volume)
};

export type FeatureKey = keyof typeof PERMISSIONS;

// ═══════════════════════════════════════════════════════════════════════════
// PLAN DETAILS (For UI display)
// ═══════════════════════════════════════════════════════════════════════════

export interface PlanDetails {
  label: string;
  price: number;
  color: string;
  bgColor: string;
  features: string[];
  description: string;
  badge?: string;
}

export const PLANS: Record<PlanTier, PlanDetails> = {
  STARTER: {
    label: 'Starter',
    price: 0,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500',
    description: 'Comece grátis',
    features: [
      'Cardápio Digital',
      'Gestor de Pedidos',
      'Cozinha (KDS)',
      'Pagamento Online',
      'Gestão de Equipe'
    ]
  },
  GROWTH: {
    label: 'Growth',
    price: 149.90,
    color: 'text-green-400',
    bgColor: 'bg-green-500',
    description: 'Para crescer',
    badge: 'Popular',
    features: [
      'Tudo do Starter',
      'App do Motorista (GPS)',
      'Modo Chuva',
      'QR Code de Mesa',
      'Terminal PDV',
      'Relatórios Financeiros'
    ]
  },
  BLACK: {
    label: 'Emprata Black',
    price: 299.90,
    color: 'text-purple-400',
    bgColor: 'bg-purple-600',
    description: 'Potência máxima',
    badge: 'AI Power',
    features: [
      'Tudo do Growth',
      'EmprataBrain (IA)',
      'Previsão de Demanda',
      'Guardião de Lucro',
      'CRM Automático',
      'Suporte VIP'
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION CHECK FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a user's plan has permission for a feature
 */
export function hasPermission(userPlan: PlanTier, feature: FeatureKey): boolean {
  const userLevel = PLAN_LEVELS[userPlan || 'STARTER'];
  const requiredLevel = PLAN_LEVELS[PERMISSIONS[feature]];
  return userLevel >= requiredLevel;
}

/**
 * Check if plan A is >= plan B in hierarchy
 */
export function isPlanAtLeast(userPlan: PlanTier, requiredPlan: PlanTier): boolean {
  const userIndex = PLAN_HIERARCHY.indexOf(userPlan);
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlan);
  return userIndex >= requiredIndex;
}

/**
 * Get the minimum plan required for a feature
 */
export function getRequiredPlan(feature: FeatureKey): PlanTier {
  return PERMISSIONS[feature];
}

/**
 * Get all features available for a plan
 */
export function getFeaturesForPlan(plan: PlanTier): FeatureKey[] {
  const planLevel = PLAN_LEVELS[plan];
  return (Object.entries(PERMISSIONS) as [FeatureKey, PlanTier][])
    .filter(([_, requiredPlan]) => PLAN_LEVELS[requiredPlan] <= planLevel)
    .map(([feature]) => feature);
}

// Legacy export for backwards compatibility
export const FEATURE_GATES: Record<string, PlanTier> = PERMISSIONS;
