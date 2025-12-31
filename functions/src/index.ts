/**
 * Emprata.ai - Firebase Cloud Functions
 * Main Entry Point - Marketplace & Finance Edition
 * ✅ Usando Firebase Functions V2
 * ⚡ OTIMIZADO: Apenas funções essenciais para liberar quota
 */

import {onCall} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";

// ============================================================================
// OTIMIZAÇÃO DE QUOTA (Evita erro de CPU Exceeded)
// ============================================================================
setGlobalOptions({
  region: "southamerica-east1", // São Paulo 🇧🇷
  maxInstances: 10,
  concurrency: 80,
  memory: "512MiB",
  cpu: 1,
});

// Inicializa Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// ============================================================================
// MÓDULOS CRÍTICOS (ESSENCIAIS PARA O CHECKOUT)
// ============================================================================

export * from "./asaas/charge"; // ESSENCIAL: Cobrança Pix
export * from "./asaas/webhook"; // ESSENCIAL: Confirmação de Pagamento
export * from "./asaas/wallet"; // ESSENCIAL: Saldo e Saque
export * from "./asaas/bank"; // ESSENCIAL: Salvar Chave Pix

// ============================================================================
// INTEGRAÇÃO IFOOD/RAPPI (ESSENCIAL)
// ============================================================================

// 1. Importe explicitamente primeiro
import { deliveryHubWebhook as deliveryHubWebhookFn } from "./integrations/webhook";

// 2. Exporte com o nome que você quer na nuvem
export const deliveryHubWebhook = deliveryHubWebhookFn;

// ============================================================================
// NOTIFICAÇÕES & PEDIDOS
// ============================================================================
export {onOrderCreated} from "./orders/notifications";

// ============================================================================
// MÓDULOS SECUNDÁRIOS (DESATIVADOS PARA LIBERAR QUOTA)
// Descomente quando precisar, mas lembre de deletar as funções primeiro
// ============================================================================

// export * from "./asaas/onboard";    // Onboarding de subconta (não usado no modelo agregador)
// export * from "./asaas/subscribe";  // Assinaturas (pode fazer manual no painel)
// export * from "./asaas/documents";  // Upload de documentos (não precisa no agregador)
// export * from "./asaas/security";   // Funções de segurança extras
// export * from "./ai/dynamicMenu";   // Menu Dinâmico com IA (futuro)
// export * from "./kitchen/throttle"; // Kitchen Throttling (futuro)
// export {smartBatch} from "./logistics/smartBatch"; // Smart Batching (futuro)
// export {acceptBatchRoute, getAvailableBatchRoutes} from "./logistics/batchActions";

// ============================================================================
// FUNÇÃO MÍNIMA (Health Check)
// ============================================================================

export const healthCheck = onCall(async () => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    region: "southamerica-east1",
  };
});