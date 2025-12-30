import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Raio máximo para agrupar pedidos (em km)
const BATCH_RADIUS_KM = 1.0;
// Janela de tempo para aguardar agrupamento (minutos) - TODO: implementar delay
// const BATCH_WINDOW_MINUTES = 8;
// Valores de entrega
const SINGLE_DELIVERY_FEE = 7.00;
const BATCH_DELIVERY_FEE = 10.00; // Para 2 pedidos

/**
 * Calcula distância entre dois pontos (Haversine)
 */
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Smart Batching - Agrupa pedidos próximos automaticamente
 */
export const smartBatch = onDocumentWritten(
  "orders/{orderId}",
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();

    // Só processa quando pedido muda para READY_FOR_PICKUP
    if (after?.status !== "READY_FOR_PICKUP") return;
    if (before?.status === "READY_FOR_PICKUP") return;

    const orderId = event.params.orderId;
    const restaurantId = after.restaurantId;
    const orderLocation = after.deliveryAddress?.coordinates;

    if (!restaurantId || !orderLocation) return;

    try {
      // Busca outros pedidos READY do mesmo restaurante
      const readyOrdersSnapshot = await db
        .collection("orders")
        .where("restaurantId", "==", restaurantId)
        .where("status", "==", "READY_FOR_PICKUP")
        .where("batchId", "==", null) // Ainda não agrupado
        .get();

      const candidates: Array<{
        id: string;
        distance: number;
        data: FirebaseFirestore.DocumentData;
      }> = [];

      readyOrdersSnapshot.forEach((doc) => {
        if (doc.id === orderId) return; // Ignora o próprio pedido

        const otherData = doc.data();
        const otherLocation = otherData.deliveryAddress?.coordinates;

        if (otherLocation) {
          const distance = calculateDistance(
            orderLocation.lat, orderLocation.lng,
            otherLocation.lat, otherLocation.lng
          );

          if (distance <= BATCH_RADIUS_KM) {
            candidates.push({id: doc.id, distance, data: otherData});
          }
        }
      });

      // Se encontrou pedidos próximos, cria rota agrupada
      if (candidates.length > 0) {
        // Ordena por distância (mais próximo primeiro)
        candidates.sort((a, b) => a.distance - b.distance);
        const closestOrder = candidates[0];

        // Cria batch ID único
        const batchId = `BATCH_${Date.now()}`;

        // Cria documento de rota
        const routeRef = db.collection("deliveryRoutes").doc(batchId);
        await routeRef.set({
          batchId,
          restaurantId,
          orderIds: [orderId, closestOrder.id],
          totalOrders: 2,
          totalFee: BATCH_DELIVERY_FEE,
          savingsVsSingle: (SINGLE_DELIVERY_FEE * 2) - BATCH_DELIVERY_FEE,
          status: "PENDING_DRIVER",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          estimatedRoute: {
            start: after.restaurantAddress,
            stops: [
              {orderId: closestOrder.id, address: closestOrder.data.deliveryAddress},
              {orderId, address: after.deliveryAddress},
            ],
            totalDistance: closestOrder.distance,
          },
        });

        // Atualiza os pedidos com o batchId
        const batch = db.batch();
        batch.update(db.collection("orders").doc(orderId), {
          batchId,
          batchPosition: 2,
        });
        batch.update(db.collection("orders").doc(closestOrder.id), {
          batchId,
          batchPosition: 1,
        });
        await batch.commit();

        console.log(
          `[SMART BATCH] Rota ${batchId} criada: ` +
          `Pedidos ${orderId} + ${closestOrder.id}, ` +
          `Distância: ${closestOrder.distance.toFixed(2)}km`
        );

        // Notifica restaurante
        await db.collection("users").doc(restaurantId).collection("notifications").add({
          type: "BATCH_CREATED",
          title: "🛵 Rota Agrupada Disponível",
          body: `2 pedidos próximos agrupados. Economia de R$ ${((SINGLE_DELIVERY_FEE * 2) - BATCH_DELIVERY_FEE).toFixed(2)}`,
          batchId,
          date: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        });
      }
    } catch (error) {
      console.error("[SMART BATCH ERROR]", error);
    }
  }
);

/**
 * Aceitar rota agrupada (chamado pelo motorista)
 * Ver: ./batchActions.ts
 */

