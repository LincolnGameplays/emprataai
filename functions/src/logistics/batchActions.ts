import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * Motorista aceita uma rota agrupada
 */
export const acceptBatchRoute = onCall(async (request) => {
  const auth = request.auth;
  const {batchId} = request.data as {batchId: string};

  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");
  if (!batchId) throw new HttpsError("invalid-argument", "Batch ID obrigatório");

  const routeRef = db.collection("deliveryRoutes").doc(batchId);

  await db.runTransaction(async (transaction) => {
    const routeDoc = await transaction.get(routeRef);

    if (!routeDoc.exists) {
      throw new HttpsError("not-found", "Rota não encontrada");
    }

    const routeData = routeDoc.data();
    if (routeData?.status !== "PENDING_DRIVER") {
      throw new HttpsError("already-exists", "Rota já foi aceita");
    }

    // Atualiza rota
    transaction.update(routeRef, {
      status: "ASSIGNED",
      driverId: auth.uid,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Atualiza todos os pedidos da rota
    for (const orderId of routeData.orderIds) {
      const orderRef = db.collection("orders").doc(orderId);
      transaction.update(orderRef, {
        status: "OUT_FOR_DELIVERY",
        driverId: auth.uid,
        dispatchedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

  return {success: true, message: "Rota aceita com sucesso!"};
});

/**
 * Lista rotas disponíveis para motorista
 */
export const getAvailableBatchRoutes = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");

  const snapshot = await db
    .collection("deliveryRoutes")
    .where("status", "==", "PENDING_DRIVER")
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const routes = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate()?.toISOString(),
  }));

  return {routes};
});
