/**
 * Emprata.ai - Firebase Cloud Functions
 * Main Entry Point - Marketplace & Finance Edition
 * ✅ Usando Firebase Functions V2
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Inicializa Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// EXPORT ASAAS MODULES (Financeiro Completo)
// ============================================================================

export * from "./asaas/onboard";
export * from "./asaas/charge";
export * from "./asaas/webhook";   
export * from "./asaas/subscribe";
export * from "./asaas/wallet";
export * from "./asaas/documents";

// ============================================================================
// UTILS
// ============================================================================

// Função Auxiliar: Adicionar Créditos Manualmente
export const addCreditsManually = onCall(async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  
  const { userId, credits } = data;
  
  await db.collection("users").doc(userId).update({
    credits: admin.firestore.FieldValue.increment(credits),
    lastManualCredit: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return { success: true, message: `Added ${credits} credits` };
});