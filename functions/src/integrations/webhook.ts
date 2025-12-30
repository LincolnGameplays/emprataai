/**
 * Delivery Hub Webhook - Unified entry point for external marketplaces
 * Receives orders from iFood, Rappi, UberEats and saves to Firestore
 */

import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import {normalizeExternalOrder} from "./adapters";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Segredos para validação de webhooks (colocar no .env)
const WEBHOOK_SECRETS: Record<string, string> = {
  IFOOD: process.env.IFOOD_WEBHOOK_SECRET || "",
  RAPPI: process.env.RAPPI_WEBHOOK_SECRET || "",
  UBER_EATS: process.env.UBEREATS_WEBHOOK_SECRET || "",
};

/**
 * Valida assinatura do webhook (HMAC)
 */
function validateSignature(
  source: string,
  payload: string,
  signature: string
): boolean {
  const secret = WEBHOOK_SECRETS[source];
  if (!secret) return true; // Se não tem secret configurado, aceita (dev mode)

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Delivery Hub Webhook
 * URL: /deliveryHubWebhook?source=IFOOD&rid=RESTAURANT_ID
 */
export const deliveryHubWebhook = onRequest(async (req, res) => {
  // Responde rápido para não dar timeout (iFood exige <5s)
  res.setTimeout(5000);

  const source = (req.query.source as string || "").toUpperCase();
  const restaurantId = req.query.rid as string;

  // Log de entrada
  console.log(`[HUB] Webhook recebido de ${source} para restaurante ${restaurantId}`);

  // Validações básicas
  if (!source || !restaurantId) {
    console.error("[HUB] Parâmetros faltando: source ou rid");
    res.status(400).send("Missing source or rid parameter");
    return;
  }

  // Validação de assinatura
  const signature = req.headers["x-signature"] as string ||
                   req.headers["x-ifood-signature"] as string ||
                   req.headers["x-rappi-signature"] as string || "";

  if (!validateSignature(source, JSON.stringify(req.body), signature)) {
    console.error("[HUB] Assinatura inválida");
    res.status(401).send("Invalid signature");
    return;
  }

  try {
    const payload = req.body;
    const eventType = payload.code || payload.event || payload.type || "ORDER";

    // Identificar tipo de evento
    console.log(`[HUB] Evento: ${eventType}`);

    // Processar apenas eventos de novo pedido
    const newOrderEvents = ["PLACED", "PLC", "NEW_ORDER", "ORDER_CREATED", "order.created"];
    if (!newOrderEvents.includes(eventType)) {
      // Outros eventos (CONFIRMED, CANCELLED, etc) - apenas logar
      console.log(`[HUB] Evento ignorado: ${eventType}`);
      res.status(200).send("Event ignored");
      return;
    }

    // Extrair dados do pedido (formato varia por marketplace)
    const orderPayload = payload.data || payload.order || payload;

    // Normalizar pedido para formato Emprata
    const normalizedOrder = normalizeExternalOrder(source, orderPayload, restaurantId);

    if (!normalizedOrder) {
      console.error(`[HUB] Falha ao normalizar pedido de ${source}`);
      res.status(400).send("Failed to normalize order");
      return;
    }

    // Verificar se pedido já existe (evitar duplicidade)
    const existingOrder = await db
      .collection("orders")
      .where("externalId", "==", normalizedOrder.externalId)
      .where("source", "==", source)
      .limit(1)
      .get();

    if (!existingOrder.empty) {
      console.log(`[HUB] Pedido ${normalizedOrder.externalId} já existe`);
      res.status(200).send("Order already exists");
      return;
    }

    // Salvar no Firestore
    const orderRef = db.collection("orders").doc();
    await orderRef.set({
      ...normalizedOrder,
      id: orderRef.id,
    });

    console.log(`[HUB] ✅ Pedido ${normalizedOrder.externalId} importado de ${source} -> ${orderRef.id}`);

    // Notificar restaurante
    await db
      .collection("users")
      .doc(restaurantId)
      .collection("notifications")
      .add({
        type: "NEW_ORDER",
        title: `🔔 Novo Pedido (${source})`,
        body: `Pedido #${normalizedOrder.externalId.slice(-6)} - R$ ${normalizedOrder.financials.total.toFixed(2)}`,
        orderId: orderRef.id,
        source,
        date: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });

    // 🎯 DICA: Aqui o Smart Batching vai acordar automaticamente!
    // O trigger em orders vai detectar o novo documento e agrupar com outros próximos

    res.status(200).send({
      success: true,
      orderId: orderRef.id,
      externalId: normalizedOrder.externalId,
    });
  } catch (error) {
    console.error("[HUB] Erro ao processar webhook:", error);
    res.status(500).send("Internal error");
  }
});

/**
 * Listar integrações disponíveis do restaurante
 */
export const getIntegrations = async (restaurantId: string) => {
  const integrations = await db
    .collection("users")
    .doc(restaurantId)
    .collection("integrations")
    .get();

  return integrations.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Salvar configuração de integração
 */
export const saveIntegration = async (
  restaurantId: string,
  source: string,
  config: {
    enabled: boolean;
    merchantId?: string;
    apiKey?: string;
    webhookUrl?: string;
  }
) => {
  await db
    .collection("users")
    .doc(restaurantId)
    .collection("integrations")
    .doc(source.toUpperCase())
    .set({
      source: source.toUpperCase(),
      ...config,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
};
