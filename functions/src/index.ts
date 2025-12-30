/**
 * Emprata.ai - Firebase Cloud Functions
 * Main Entry Point - Marketplace & Finance Edition
 */

import * as functions from "firebase-functions";
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

// ============================================================================
// UTILS
// ============================================================================

// Função Auxiliar: Adicionar Créditos Manualmente
export const addCreditsManually = functions.https.onCall(async (request) => {
  // Extrai dados e auth do objeto request unificado (Sintaxe v2/Compatível)
  const { data, auth } = request;

  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }
  
  const { userId, credits } = data;
  
  await db.collection("users").doc(userId).update({
    credits: admin.firestore.FieldValue.increment(credits),
    lastManualCredit: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return { success: true, message: `Added ${credits} credits` };
});