/**
 * Utilitários de Segurança para Operações Financeiras
 * Implementa validações anti-fraude e proteção contra race conditions.
 */
import * as admin from "firebase-admin";
import stringSimilarity from "string-similarity";

const db = admin.firestore();

/**
 * Normaliza string para comparação (remove acentos, espaços extras, lowercase).
 * @param {string} str - String a ser normalizada.
 * @returns {string} String normalizada.
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, " ") // Remove espaços extras
    .trim();
}

/**
 * Valida se a chave Pix pertence ao mesmo titular cadastrado.
 * Usa comparação de similaridade de strings (Jaro-Winkler).
 *
 * @param {string} userFullName - Nome completo do usuário cadastrado.
 * @param {string} bankOwnerName - Nome retornado pelo banco/Asaas.
 * @returns {{valid: boolean, similarity: number, reason?: string}} Resultado da validação.
 */
export function validateNameOwnership(
  userFullName: string,
  bankOwnerName: string
): {valid: boolean; similarity: number; reason?: string} {
  const normalizedUser = normalizeString(userFullName);
  const normalizedBank = normalizeString(bankOwnerName);

  // 1. Checagem de contenção (se um nome está dentro do outro)
  const containsName =
    normalizedBank.includes(normalizedUser) ||
    normalizedUser.includes(normalizedBank);

  // 2. Checagem de similaridade (0 a 1)
  const similarity = stringSimilarity.compareTwoStrings(
    normalizedUser,
    normalizedBank
  );

  // Regra: Deve conter o nome OU ter 80% de similaridade
  if (containsName || similarity >= 0.8) {
    return {valid: true, similarity};
  }

  return {
    valid: false,
    similarity,
    reason: `Titularidade inválida. A conta pertence a "${bankOwnerName}", mas seu cadastro é "${userFullName}".`,
  };
}

/**
 * Gera uma chave de idempotência única para evitar duplicidade de transações.
 * @param {string} userId - ID do usuário.
 * @param {string} operation - Tipo de operação (withdraw, charge, etc).
 * @returns {string} Chave de idempotência.
 */
export function generateIdempotencyKey(
  userId: string,
  operation: string
): string {
  return `${userId}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Executa um saque de forma atômica usando Firestore Transaction.
 * Previne race conditions e double-spending.
 *
 * @param {string} userId - ID do usuário.
 * @param {number} amount - Valor a ser sacado.
 * @param {object} withdrawTarget - Dados do destino do saque.
 * @returns {Promise<{success: boolean, newBalance: number, logId: string}>}
 */
export async function executeAtomicWithdraw(
  userId: string,
  amount: number,
  withdrawTarget: {pixKey: string; pixKeyType: string}
): Promise<{success: boolean; newBalance: number; logId: string}> {
  const userRef = db.collection("users").doc(userId);
  const logRef = db.collection("transactions").doc();

  const result = await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error("Usuário não encontrado");
    }

    const userData = userDoc.data();
    const currentBalance = userData?.wallet?.balance || 0;

    // 1. Validação de Saldo (dentro da transação)
    if (currentBalance < amount) {
      throw new Error("Saldo insuficiente para saque.");
    }

    // 2. Calcular novo saldo
    const newBalance = currentBalance - amount;

    // 3. Atualizar saldo (atômico)
    transaction.update(userRef, {
      "wallet.balance": newBalance,
      "wallet.lastWithdraw": admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Criar registro de auditoria
    transaction.set(logRef, {
      userId,
      type: "WITHDRAW",
      amount,
      previousBalance: currentBalance,
      newBalance,
      status: "PROCESSING",
      pixKey: withdrawTarget.pixKey,
      pixKeyType: withdrawTarget.pixKeyType,
      idempotencyKey: generateIdempotencyKey(userId, "withdraw"),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {newBalance, logId: logRef.id};
  });

  return {
    success: true,
    newBalance: result.newBalance,
    logId: result.logId,
  };
}

/**
 * Calcula o split de forma segura (percentuais definidos pelo backend, não frontend).
 *
 * @param {string} plan - Plano do usuário (FREE, STARTER, GROWTH, SCALE).
 * @returns {{platformFeePercent: number, restaurantPercent: number}}
 */
export function calculateSecureSplit(plan: string): {
  platformFeePercent: number;
  restaurantPercent: number;
} {
  // TAXAS HARDCODED - NUNCA vindas do frontend
  const feeTable: Record<string, number> = {
    FREE: 4.99,
    STARTER: 3.99,
    GROWTH: 2.99,
    SCALE: 1.99,
  };

  const platformFeePercent = feeTable[plan.toUpperCase()] || feeTable.FREE;
  const restaurantPercent = 100 - platformFeePercent;

  return {
    platformFeePercent,
    restaurantPercent,
  };
}

/**
 * Verifica se há uma transação pendente para evitar duplicate requests.
 *
 * @param {string} userId - ID do usuário.
 * @param {string} type - Tipo de transação (WITHDRAW, CHARGE).
 * @param {number} timeWindowMs - Janela de tempo em ms (default: 30 segundos).
 * @returns {Promise<boolean>} True se há transação pendente.
 */
export async function hasPendingTransaction(
  userId: string,
  type: string,
  timeWindowMs: number = 30000
): Promise<boolean> {
  const threshold = new Date(Date.now() - timeWindowMs);

  const pending = await db
    .collection("transactions")
    .where("userId", "==", userId)
    .where("type", "==", type)
    .where("status", "==", "PROCESSING")
    .where("createdAt", ">=", threshold)
    .limit(1)
    .get();

  return !pending.empty;
}
