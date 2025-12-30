import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Configurações do Throttling
const THROTTLE_CONFIG = {
  maxPreparingOrders: 15,       // Limite antes de ativar throttle
  normalDeliveryTime: 40,       // Tempo normal (minutos)
  throttledDeliveryTime: 70,    // Tempo em pico (minutos)
  complexItemThreshold: 20,     // Tempo de preparo para considerar "complexo"
};

/**
 * Neural Kitchen Throttling
 * Monitora pedidos PREPARING e ajusta automaticamente:
 * - Tempo de entrega estimado
 * - Disponibilidade de itens complexos
 */
export const kitchenThrottle = onDocumentWritten(
  "orders/{orderId}",
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();

    // Só processa se houve mudança de status
    if (after?.status === before?.status) return;

    const restaurantId = after?.restaurantId || before?.restaurantId;
    if (!restaurantId) return;

    try {
      // Conta pedidos ativos (PREPARING ou READY_FOR_PICKUP)
      const activeOrdersSnapshot = await db
        .collection("orders")
        .where("restaurantId", "==", restaurantId)
        .where("status", "in", ["PREPARING", "READY_FOR_PICKUP"])
        .get();

      const activeCount = activeOrdersSnapshot.size;
      const isThrottled = activeCount >= THROTTLE_CONFIG.maxPreparingOrders;

      // Calcula tempo de entrega baseado na carga
      let estimatedDeliveryTime = THROTTLE_CONFIG.normalDeliveryTime;
      let throttleLevel: "NORMAL" | "BUSY" | "OVERLOADED" = "NORMAL";

      if (activeCount >= THROTTLE_CONFIG.maxPreparingOrders) {
        estimatedDeliveryTime = THROTTLE_CONFIG.throttledDeliveryTime;
        throttleLevel = "OVERLOADED";
      } else if (activeCount >= THROTTLE_CONFIG.maxPreparingOrders * 0.7) {
        estimatedDeliveryTime = 55; // Intermediário
        throttleLevel = "BUSY";
      }

      // Atualiza status da cozinha no documento do restaurante
      await db.collection("users").doc(restaurantId).update({
        "kitchenStatus": {
          activeOrders: activeCount,
          isThrottled,
          throttleLevel,
          estimatedDeliveryTime,
          blockComplexItems: isThrottled,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

      console.log(
        `[KITCHEN THROTTLE] Restaurant ${restaurantId}: ` +
        `${activeCount} pedidos ativos, ` +
        `Nível: ${throttleLevel}, ` +
        `Tempo estimado: ${estimatedDeliveryTime}min`
      );

      // Se entrou em modo throttle, notifica o restaurante
      if (isThrottled && throttleLevel === "OVERLOADED") {
        await db.collection("users").doc(restaurantId).collection("notifications").add({
          type: "KITCHEN_OVERLOAD",
          title: "🔥 Cozinha em Alta Demanda",
          body: `${activeCount} pedidos ativos. Tempo de entrega aumentado automaticamente para ${estimatedDeliveryTime}min.`,
          date: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        });
      }
    } catch (error) {
      console.error("[KITCHEN THROTTLE ERROR]", error);
    }
  }
);

/**
 * Função auxiliar para consultar status atual da cozinha
 */
export const getKitchenStatus = async (restaurantId: string) => {
  const userDoc = await db.collection("users").doc(restaurantId).get();
  return userDoc.data()?.kitchenStatus || {
    activeOrders: 0,
    isThrottled: false,
    throttleLevel: "NORMAL",
    estimatedDeliveryTime: THROTTLE_CONFIG.normalDeliveryTime,
    blockComplexItems: false,
  };
};
