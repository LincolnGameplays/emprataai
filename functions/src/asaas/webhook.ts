// ✅ IMPORTAÇÃO V2
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {ASAAS_CONFIG} from "./constants";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export const financeWebhook = onRequest(async (req, res) => {
  const token = req.headers["asaas-access-token"];

  if (token !== ASAAS_CONFIG.webhookToken) {
    console.error("[WEBHOOK] Token inválido:", token);
    res.status(401).send("Unauthorized");
    return;
  }

  const event = req.body;
  console.log("[WEBHOOK] Evento recebido:", event.event, event.payment?.id);

  try {
    switch (event.event) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED":
      await handlePaymentReceived(event.payment);
      break;

    case "PAYMENT_REFUNDED":
      await handlePaymentRefunded(event.payment);
      break;

    case "TRANSFER_RECEIVED":
      await handleTransferReceived(event.transfer);
      break;

    default:
      console.log("[WEBHOOK] Evento ignorado:", event.event);
    }

    res.status(200).send({received: true});
  } catch (error) {
    console.error("[WEBHOOK ERROR]", error);
    res.status(500).send("Internal Error");
  }
});

/**
 * Processa pagamento recebido e atualiza pedidos/assinaturas.
 * @param {object} payment - Objeto de pagamento do Asaas.
 * @return {Promise<void>} Promise vazia.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentReceived(payment: any): Promise<void> {
  const externalRef = payment.externalReference;
  if (!externalRef) return;

  // Se for ORDER (Pedido Marketplace)
  if (!externalRef.startsWith("SUB_")) {
    const orderRef = db.collection("orders").doc(externalRef);
    const orderDoc = await orderRef.get();

    if (orderDoc.exists) {
      await orderRef.update({
        status: "PAID",
        paymentStatus: "APPROVED",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentId: payment.id,
      });
      console.log(`[WEBHOOK] Pedido ${externalRef} pago.`);

      // ✅ NOVO: Notificação em Tempo Real para o Restaurante
      const restaurantId = orderDoc.data()?.restaurantId;
      if (restaurantId) {
        await db.collection("users").doc(restaurantId).collection("notifications").add({
          type: "SALE_APPROVED",
          amount: payment.value,
          orderId: externalRef,
          date: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        });
        console.log(`[WEBHOOK] Notificação enviada para restaurante ${restaurantId}`);
      }
    }
  } else {
    // Se for ASSINATURA (SUB_)
    const userId = externalRef.replace("SUB_", "");
    console.log(`[WEBHOOK] Assinatura do usuário ${userId} paga.`);

    // Atualiza status da assinatura no Firestore
    await db.collection("users").doc(userId).update({
      "subscription.status": "active",
      "subscription.lastPayment": admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Processa reembolso de pagamento.
 * @param {object} payment - Objeto de pagamento do Asaas.
 * @return {Promise<void>} Promise vazia.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentRefunded(payment: any): Promise<void> {
  const externalRef = payment.externalReference;
  if (externalRef && !externalRef.startsWith("SUB_")) {
    await db.collection("orders").doc(externalRef).update({
      status: "REFUNDED",
      paymentStatus: "REFUNDED",
    });
  }
}

/**
 * Processa transferência recebida via Pix.
 * @param {object} transfer - Objeto de transferência do Asaas.
 * @return {Promise<void>} Promise vazia.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTransferReceived(transfer: any): Promise<void> {
  console.log("[WEBHOOK] Transferência recebida:", transfer?.id, transfer?.value);
  // Implementar lógica se necessário para rastrear transferências diretas
}
