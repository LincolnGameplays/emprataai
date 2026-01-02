/**
 * 🏪 RESTAURANT APPROVAL SERVICE - Anti-Fraud Protection
 * 
 * Modelo de aprovação manual para:
 * - Evitar golpes de cadastros fake
 * - Garantir qualidade dos parceiros
 * - Controlar crescimento orgânico
 */

import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type RestaurantStatus = 
  | 'pending_approval'   // Aguardando análise
  | 'approved'           // Liberado para operar
  | 'rejected'           // Recusado
  | 'suspended';         // Suspenso temporariamente

export interface RestaurantApproval {
  restaurantId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessName: string;
  cnpj?: string;
  address: string;
  status: RestaurantStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  documents?: {
    cnpjCard?: string;
    addressProof?: string;
    ownerDocument?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// APPROVAL WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Request restaurant approval (called on signup)
 */
export async function requestRestaurantApproval(
  restaurantId: string,
  ownerId: string,
  data: {
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    businessName: string;
    cnpj?: string;
    address: string;
  }
): Promise<void> {
  const approval: RestaurantApproval = {
    restaurantId,
    ownerId,
    ...data,
    status: 'pending_approval',
    requestedAt: new Date(),
  };

  // Save to approvals collection
  await setDoc(doc(db, 'restaurant_approvals', restaurantId), approval);

  // Update restaurant document status
  await updateDoc(doc(db, 'restaurants', restaurantId), {
    approvalStatus: 'pending_approval',
    isPublic: false, // Hidden until approved
    updatedAt: serverTimestamp()
  });

  console.log(`[Approval] Restaurant ${restaurantId} requested approval`);
}

/**
 * Check if restaurant is approved
 */
export async function isRestaurantApproved(restaurantId: string): Promise<boolean> {
  const approvalDoc = await getDoc(doc(db, 'restaurant_approvals', restaurantId));
  
  if (!approvalDoc.exists()) {
    // Legacy restaurants without approval doc are considered approved
    return true;
  }
  
  return approvalDoc.data().status === 'approved';
}

/**
 * Get restaurant approval status
 */
export async function getApprovalStatus(restaurantId: string): Promise<RestaurantApproval | null> {
  const approvalDoc = await getDoc(doc(db, 'restaurant_approvals', restaurantId));
  
  if (!approvalDoc.exists()) return null;
  
  return approvalDoc.data() as RestaurantApproval;
}

/**
 * Approve restaurant (Admin only)
 */
export async function approveRestaurant(
  restaurantId: string,
  adminId: string,
  notes?: string
): Promise<void> {
  await updateDoc(doc(db, 'restaurant_approvals', restaurantId), {
    status: 'approved',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminId,
    reviewNotes: notes || 'Aprovado',
  });

  // Make restaurant public
  await updateDoc(doc(db, 'restaurants', restaurantId), {
    approvalStatus: 'approved',
    isPublic: true,
    approvedAt: serverTimestamp()
  });

  console.log(`[Approval] Restaurant ${restaurantId} APPROVED by ${adminId}`);
}

/**
 * Reject restaurant (Admin only)
 */
export async function rejectRestaurant(
  restaurantId: string,
  adminId: string,
  reason: string
): Promise<void> {
  await updateDoc(doc(db, 'restaurant_approvals', restaurantId), {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminId,
    reviewNotes: reason,
  });

  // Keep restaurant hidden
  await updateDoc(doc(db, 'restaurants', restaurantId), {
    approvalStatus: 'rejected',
    isPublic: false,
  });

  console.log(`[Approval] Restaurant ${restaurantId} REJECTED: ${reason}`);
}

/**
 * Suspend restaurant (Admin only)
 */
export async function suspendRestaurant(
  restaurantId: string,
  adminId: string,
  reason: string
): Promise<void> {
  await updateDoc(doc(db, 'restaurant_approvals', restaurantId), {
    status: 'suspended',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminId,
    reviewNotes: reason,
  });

  // Hide restaurant
  await updateDoc(doc(db, 'restaurants', restaurantId), {
    approvalStatus: 'suspended',
    isPublic: false,
  });

  console.log(`[Approval] Restaurant ${restaurantId} SUSPENDED: ${reason}`);
}

/**
 * Get all pending approvals (Admin dashboard)
 */
export async function getPendingApprovals(): Promise<RestaurantApproval[]> {
  const q = query(
    collection(db, 'restaurant_approvals'),
    where('status', '==', 'pending_approval'),
    orderBy('requestedAt', 'asc')
  );

  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => doc.data() as RestaurantApproval);
}

// ═══════════════════════════════════════════════════════════════════════════
// WITHDRAWAL PROTECTION
// ═══════════════════════════════════════════════════════════════════════════

export const WITHDRAWAL_CONFIG = {
  /** Saldo mínimo para permitir saque */
  MIN_BALANCE: 10.00,
  
  /** Taxa de saque (se houver) */
  WITHDRAWAL_FEE: 0.00,
  
  /** Valor mínimo por saque */
  MIN_WITHDRAWAL_AMOUNT: 20.00,
  
  /** Valor máximo por saque (anti-fraude) */
  MAX_WITHDRAWAL_AMOUNT: 10000.00,
  
  /** Dias de espera após primeiro pedido */
  HOLDING_PERIOD_DAYS: 1,
};

export interface WithdrawalRequest {
  id: string;
  userId: string;
  restaurantId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  pixKey?: string;
  bankInfo?: {
    bank: string;
    agency: string;
    account: string;
  };
  requestedAt: Date;
  processedAt?: Date;
  error?: string;
}

/**
 * Validate withdrawal request
 */
export function validateWithdrawal(
  currentBalance: number,
  requestedAmount: number
): { valid: boolean; error?: string } {
  // Check minimum balance
  if (currentBalance < WITHDRAWAL_CONFIG.MIN_BALANCE) {
    return { 
      valid: false, 
      error: `Saldo mínimo para saque: R$ ${WITHDRAWAL_CONFIG.MIN_BALANCE.toFixed(2)}` 
    };
  }

  // Check minimum amount
  if (requestedAmount < WITHDRAWAL_CONFIG.MIN_WITHDRAWAL_AMOUNT) {
    return { 
      valid: false, 
      error: `Valor mínimo de saque: R$ ${WITHDRAWAL_CONFIG.MIN_WITHDRAWAL_AMOUNT.toFixed(2)}` 
    };
  }

  // Check maximum amount
  if (requestedAmount > WITHDRAWAL_CONFIG.MAX_WITHDRAWAL_AMOUNT) {
    return { 
      valid: false, 
      error: `Valor máximo de saque: R$ ${WITHDRAWAL_CONFIG.MAX_WITHDRAWAL_AMOUNT.toFixed(2)}` 
    };
  }

  // Check if would leave minimum balance
  const balanceAfter = currentBalance - requestedAmount - WITHDRAWAL_CONFIG.WITHDRAWAL_FEE;
  if (balanceAfter < 0) {
    const maxWithdrawal = currentBalance - WITHDRAWAL_CONFIG.WITHDRAWAL_FEE;
    return { 
      valid: false, 
      error: `Valor máximo disponível: R$ ${maxWithdrawal.toFixed(2)}` 
    };
  }

  return { valid: true };
}

/**
 * Create withdrawal request
 */
export async function requestWithdrawal(
  userId: string,
  restaurantId: string,
  amount: number,
  pixKey: string
): Promise<WithdrawalRequest> {
  const id = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const fee = WITHDRAWAL_CONFIG.WITHDRAWAL_FEE;
  
  const request: WithdrawalRequest = {
    id,
    userId,
    restaurantId,
    amount,
    fee,
    netAmount: amount - fee,
    status: 'pending',
    pixKey,
    requestedAt: new Date(),
  };

  await setDoc(doc(db, 'withdrawal_requests', id), request);

  return request;
}

/**
 * Get withdrawal history
 */
export async function getWithdrawalHistory(
  restaurantId: string,
  limit = 10
): Promise<WithdrawalRequest[]> {
  const q = query(
    collection(db, 'withdrawal_requests'),
    where('restaurantId', '==', restaurantId),
    orderBy('requestedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  
  return snapshot.docs.slice(0, limit).map(doc => doc.data() as WithdrawalRequest);
}
