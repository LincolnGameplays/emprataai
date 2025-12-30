/**
 * Emprata.ai - Firebase Cloud Functions
 * Main Entry Point - Marketplace & Finance Edition
 * ✅ Usando Firebase Functions V2
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";

// ============================================================================
// OTIMIZAÇÃO DE QUOTA (Evita erro de CPU Exceeded)
// ============================================================================
setGlobalOptions({
  maxInstances: 10,      // No máximo 10 cópias rodando (padrão é 100)
  concurrency: 80,       // 1 CPU atende 80 chamadas simultâneas
  memory: "256MiB",      // Memória mínima
  cpu: 1,                // 1 vCPU apenas
  region: "southamerica-east1", // São Paulo
});

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
export * from "./asaas/bank";
export * from "./asaas/security";

// ============================================================================
// EXPORT AI MODULES (Inteligência Artificial)
// ============================================================================

export * from "./ai/dynamicMenu";

// ============================================================================
// EXPORT KITCHEN MODULES (Controle de Cozinha)
// ============================================================================

export * from "./kitchen/throttle";

// ============================================================================
// EXPORT LOGISTICS MODULES (Otimização de Entregas)
// ============================================================================

export {smartBatch} from "./logistics/smartBatch";
export {acceptBatchRoute, getAvailableBatchRoutes} from "./logistics/batchActions";

// ============================================================================
// EXPORT INTEGRATIONS MODULES (iFood, Rappi, UberEats)
// ============================================================================

export {deliveryHubWebhook} from "./integrations/webhook";

// ============================================================================
// UTILS
// ============================================================================

export const addCreditsManually = onCall(async (request) => {
  const {data, auth} = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {userId, credits} = data;

  await db.collection("users").doc(userId).update({
    credits: admin.firestore.FieldValue.increment(credits),
    lastManualCredit: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {success: true, message: `Added ${credits} credits`};
});

// ============================================================================
// PROFIT ANALYTICS (Estatísticas de Lucro)
// ============================================================================

export const getProfitAnalytics = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");

  const {startDate, endDate} = request.data as {startDate?: string; endDate?: string};

  try {
    // Busca estatísticas diárias
    let query = db
      .collection("users")
      .doc(auth.uid)
      .collection("daily_stats")
      .orderBy("date", "desc")
      .limit(30);

    if (startDate) {
      query = query.where("date", ">=", startDate);
    }
    if (endDate) {
      query = query.where("date", "<=", endDate);
    }

    const snapshot = await query.get();

    const dailyData = snapshot.docs.map((doc) => doc.data());

    // Calcula totais
    const totals = dailyData.reduce((acc, day) => ({
      totalSales: acc.totalSales + (day.totalSales || 0),
      totalRevenue: acc.totalRevenue + (day.totalRevenue || 0),
      totalCosts: acc.totalCosts + (day.totalCosts || 0),
      totalProfit: acc.totalProfit + (day.totalProfit || 0),
      ordersCount: acc.ordersCount + (day.ordersCount || 0),
    }), {totalSales: 0, totalRevenue: 0, totalCosts: 0, totalProfit: 0, ordersCount: 0});

    const avgProfitMargin = totals.totalRevenue > 0
      ? (totals.totalProfit / totals.totalRevenue) * 100
      : 0;

    return {
      dailyData,
      totals: {
        ...totals,
        avgProfitMargin: parseFloat(avgProfitMargin.toFixed(1)),
      },
    };
  } catch (error) {
    console.error("[PROFIT ANALYTICS ERROR]", error);
    throw new HttpsError("internal", "Erro ao buscar análises");
  }
});