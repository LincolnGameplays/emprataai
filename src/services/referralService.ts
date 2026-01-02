/**
 * 🎯 REFERRAL SERVICE - Sistema de Indicação Viral
 * 
 * Modelo de Cashback Financiado pelo Restaurante:
 * - Cliente A indica Cliente B
 * - Cliente B ganha R$ X de desconto (restaurante paga)
 * - Cliente A ganha R$ X de crédito (restaurante paga no futuro)
 * 
 * Custo para a plataforma: R$ 0,00
 */

import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const REFERRAL_CONFIG = {
  /** Cashback para quem indica (Cliente A) */
  REFERRER_REWARD: 5.00,
  
  /** Desconto para quem é indicado (Cliente B) */
  REFERRED_DISCOUNT: 5.00,
  
  /** Limite máximo de desconto por pedido (50% do total) */
  MAX_DISCOUNT_PERCENT: 0.5,
  
  /** Mínimo de pedido para usar cashback */
  MIN_ORDER_FOR_CASHBACK: 15.00,
  
  /** Validade do código de indicação em dias */
  CODE_VALIDITY_DAYS: 30,
  
  /** Máximo de indicações por restaurante por dia (anti-fraude) */
  MAX_REFERRALS_PER_DAY: 50,
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ReferralCode {
  code: string;
  referrerId: string;
  referrerName: string;
  restaurantId: string;
  createdAt: Date;
  expiresAt: Date;
  usageCount: number;
  maxUsages?: number;
  isActive: boolean;
}

export interface ReferralReward {
  id: string;
  userId: string;
  restaurantId: string;
  amount: number;
  type: 'referrer_bonus' | 'referred_discount';
  referralCode: string;
  usedAt?: Date;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
}

export interface CashbackWallet {
  userId: string;
  totalEarned: number;
  totalUsed: number;
  balance: number;
  lastUpdated: Date;
  rewards: {
    [restaurantId: string]: number; // Saldo por restaurante
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// REFERRAL CODE GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a unique referral code
 */
export function generateReferralCode(userId: string, restaurantSlug: string): string {
  const userPrefix = userId.slice(-4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${restaurantSlug.toUpperCase().slice(0, 4)}-${userPrefix}${random}`;
}

/**
 * Create or get existing referral code for a user
 */
export async function getOrCreateReferralCode(
  userId: string, 
  userName: string,
  restaurantId: string,
  restaurantSlug: string
): Promise<ReferralCode> {
  // Check if user already has an active code for this restaurant
  const codesRef = collection(db, 'referral_codes');
  const q = query(
    codesRef,
    where('referrerId', '==', userId),
    where('restaurantId', '==', restaurantId),
    where('isActive', '==', true)
  );
  
  const existing = await getDocs(q);
  
  if (!existing.empty) {
    return existing.docs[0].data() as ReferralCode;
  }
  
  // Create new code
  const code = generateReferralCode(userId, restaurantSlug);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFERRAL_CONFIG.CODE_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
  
  const referralCode: ReferralCode = {
    code,
    referrerId: userId,
    referrerName: userName,
    restaurantId,
    createdAt: now,
    expiresAt,
    usageCount: 0,
    isActive: true,
  };
  
  await setDoc(doc(db, 'referral_codes', code), referralCode);
  
  return referralCode;
}

// ═══════════════════════════════════════════════════════════════════════════
// REFERRAL VALIDATION & APPLICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate a referral code
 */
export async function validateReferralCode(
  code: string, 
  newUserId: string
): Promise<{ valid: boolean; error?: string; referralCode?: ReferralCode }> {
  const codeDoc = await getDoc(doc(db, 'referral_codes', code));
  
  if (!codeDoc.exists()) {
    return { valid: false, error: 'Código de indicação inválido' };
  }
  
  const referralCode = codeDoc.data() as ReferralCode;
  
  // Check if active
  if (!referralCode.isActive) {
    return { valid: false, error: 'Este código foi desativado' };
  }
  
  // Check expiration
  if (new Date() > new Date(referralCode.expiresAt)) {
    return { valid: false, error: 'Este código expirou' };
  }
  
  // Check self-referral
  if (referralCode.referrerId === newUserId) {
    return { valid: false, error: 'Você não pode usar seu próprio código' };
  }
  
  // Check if user already used a referral for this restaurant
  const existingReward = await getDocs(query(
    collection(db, 'referral_rewards'),
    where('userId', '==', newUserId),
    where('restaurantId', '==', referralCode.restaurantId),
    where('type', '==', 'referred_discount')
  ));
  
  if (!existingReward.empty) {
    return { valid: false, error: 'Você já usou um código neste restaurante' };
  }
  
  return { valid: true, referralCode };
}

/**
 * Apply referral rewards after first order
 */
export async function applyReferralRewards(
  code: string,
  newUserId: string,
  orderId: string
): Promise<void> {
  const codeDoc = await getDoc(doc(db, 'referral_codes', code));
  
  if (!codeDoc.exists()) return;
  
  const referralCode = codeDoc.data() as ReferralCode;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
  
  // Create reward for referrer (Cliente A)
  const referrerReward: ReferralReward = {
    id: `${code}-${referralCode.referrerId}-${Date.now()}`,
    userId: referralCode.referrerId,
    restaurantId: referralCode.restaurantId,
    amount: REFERRAL_CONFIG.REFERRER_REWARD,
    type: 'referrer_bonus',
    referralCode: code,
    createdAt: now,
    expiresAt,
    isUsed: false,
  };
  
  await setDoc(doc(db, 'referral_rewards', referrerReward.id), referrerReward);
  
  // Update wallet balance for referrer
  await updateWalletBalance(
    referralCode.referrerId, 
    referralCode.restaurantId, 
    REFERRAL_CONFIG.REFERRER_REWARD
  );
  
  // Increment usage count
  await updateDoc(doc(db, 'referral_codes', code), {
    usageCount: increment(1)
  });
  
  console.log(`[Referral] Applied rewards: ${referralCode.referrerName} gets R$ ${REFERRAL_CONFIG.REFERRER_REWARD}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// CASHBACK WALLET MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update user's cashback wallet
 */
async function updateWalletBalance(
  userId: string, 
  restaurantId: string, 
  amount: number
): Promise<void> {
  const walletRef = doc(db, 'cashback_wallets', userId);
  const walletDoc = await getDoc(walletRef);
  
  if (!walletDoc.exists()) {
    // Create new wallet
    await setDoc(walletRef, {
      userId,
      totalEarned: amount,
      totalUsed: 0,
      balance: amount,
      lastUpdated: serverTimestamp(),
      rewards: { [restaurantId]: amount }
    });
  } else {
    // Update existing wallet
    const currentBalance = walletDoc.data().rewards?.[restaurantId] || 0;
    await updateDoc(walletRef, {
      totalEarned: increment(amount),
      balance: increment(amount),
      lastUpdated: serverTimestamp(),
      [`rewards.${restaurantId}`]: currentBalance + amount
    });
  }
}

/**
 * Get user's cashback balance for a restaurant
 */
export async function getCashbackBalance(
  userId: string, 
  restaurantId: string
): Promise<number> {
  const walletDoc = await getDoc(doc(db, 'cashback_wallets', userId));
  
  if (!walletDoc.exists()) return 0;
  
  return walletDoc.data().rewards?.[restaurantId] || 0;
}

/**
 * Calculate applicable discount for an order
 */
export function calculateApplicableDiscount(
  orderTotal: number,
  availableCashback: number
): { discount: number; remaining: number } {
  // Minimum order check
  if (orderTotal < REFERRAL_CONFIG.MIN_ORDER_FOR_CASHBACK) {
    return { discount: 0, remaining: availableCashback };
  }
  
  // Max 50% of order
  const maxDiscount = orderTotal * REFERRAL_CONFIG.MAX_DISCOUNT_PERCENT;
  const discount = Math.min(availableCashback, maxDiscount);
  
  return {
    discount: Math.round(discount * 100) / 100,
    remaining: Math.round((availableCashback - discount) * 100) / 100
  };
}

/**
 * Use cashback on an order
 */
export async function useCashback(
  userId: string,
  restaurantId: string,
  amount: number,
  orderId: string
): Promise<boolean> {
  const walletRef = doc(db, 'cashback_wallets', userId);
  const walletDoc = await getDoc(walletRef);
  
  if (!walletDoc.exists()) return false;
  
  const currentBalance = walletDoc.data().rewards?.[restaurantId] || 0;
  
  if (currentBalance < amount) return false;
  
  // Deduct from wallet
  await updateDoc(walletRef, {
    totalUsed: increment(amount),
    balance: increment(-amount),
    lastUpdated: serverTimestamp(),
    [`rewards.${restaurantId}`]: currentBalance - amount
  });
  
  // Log usage
  await setDoc(doc(db, 'cashback_usage', `${orderId}-${Date.now()}`), {
    userId,
    restaurantId,
    amount,
    orderId,
    usedAt: serverTimestamp()
  });
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// REFERRAL LINK GENERATION (For Sharing)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate shareable referral link
 */
export function generateReferralLink(code: string, restaurantSlug: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://emprata.ai';
  
  return `${baseUrl}/${restaurantSlug}?ref=${code}`;
}

/**
 * Generate WhatsApp share message
 */
export function generateWhatsAppShareMessage(
  code: string, 
  restaurantName: string,
  link: string
): string {
  return encodeURIComponent(
    `🍕 Use meu código *${code}* e ganhe R$ ${REFERRAL_CONFIG.REFERRED_DISCOUNT} de desconto no ${restaurantName}!\n\n` +
    `👉 ${link}\n\n` +
    `#EmprataAI`
  );
}
