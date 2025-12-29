/**
 * ⚡ ASAAS PAYMENT MODULE - Constants & Fee Structure ⚡
 * Marketplace with Split Payments for EmprataAI
 */

// ══════════════════════════════════════════════════════════════════
// API CONFIGURATION
// ══════════════════════════════════════════════════════════════════

export const ASAAS_CONFIG = {
  // Sandbox: https://sandbox.asaas.com/api/v3
  // Production: https://api.asaas.com/v3
  baseUrl: process.env.ASAAS_SANDBOX === 'true' 
    ? 'https://sandbox.asaas.com/api/v3' 
    : 'https://api.asaas.com/v3',
  apiKey: process.env.ASAAS_API_KEY || '',
  webhookToken: process.env.ASAAS_WEBHOOK_TOKEN || '',
};

// ══════════════════════════════════════════════════════════════════
// FEE STRUCTURE BY PLAN
// ══════════════════════════════════════════════════════════════════

export type UserPlan = 'starter' | 'growth' | 'scale' | 'free';

interface FeeStructure {
  percentageFee: number; // Decimal (0.0399 = 3.99%)
  fixedFee: number;      // BRL
  label: string;
}

export const PLAN_FEES: Record<UserPlan, FeeStructure> = {
  free: {
    percentageFee: 0.0499, // 4.99%
    fixedFee: 1.49,
    label: '4.99% + R$ 1,49',
  },
  starter: {
    percentageFee: 0.0399, // 3.99%
    fixedFee: 0.99,
    label: '3.99% + R$ 0,99',
  },
  growth: {
    percentageFee: 0.0249, // 2.49%
    fixedFee: 0.50,
    label: '2.49% + R$ 0,50',
  },
  scale: {
    percentageFee: 0.0149, // 1.49%
    fixedFee: 0,
    label: '1.49% (Sem taxa fixa)',
  },
};

// ══════════════════════════════════════════════════════════════════
// CALCULATE EMPRATA FEE
// ══════════════════════════════════════════════════════════════════

/**
 * Calculates the Emprata marketplace fee based on user plan
 */
export function calculateEmprataFee(
  amount: number,
  plan: UserPlan
): { emprataFee: number; restaurantAmount: number } {
  const fees = PLAN_FEES[plan] || PLAN_FEES.free;
  
  const emprataFee = (amount * fees.percentageFee) + fees.fixedFee;
  const restaurantAmount = amount - emprataFee;
  
  return {
    emprataFee: Math.round(emprataFee * 100) / 100,       // Round to cents
    restaurantAmount: Math.round(restaurantAmount * 100) / 100,
  };
}

// ══════════════════════════════════════════════════════════════════
// WEBHOOK EVENT TYPES
// ══════════════════════════════════════════════════════════════════

export const ASAAS_EVENTS = {
  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  PAYMENT_DELETED: 'PAYMENT_DELETED',
} as const;

export type AsaasEvent = keyof typeof ASAAS_EVENTS;
