/**
 * Emprata.ai - Firebase Cloud Functions
 * Kirvano Webhook Integration v2.1 (Fixed Build)
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {defineString} from "firebase-functions/params";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const KIRVANO_OFFER_STARTER = defineString("KIRVANO_OFFER_STARTER", {
  description: "ID da oferta STARTER na Kirvano (pacote de 15 créditos)",
  default: "COLE_O_ID_DA_OFERTA_STARTER_AQUI",
});

const KIRVANO_OFFER_PRO = defineString("KIRVANO_OFFER_PRO", {
  description: "ID da oferta PRO na Kirvano (assinatura mensal)",  
  default: "COLE_O_ID_DA_OFERTA_PRO_AQUI",
});

const KIRVANO_WEBHOOK_SECRET = defineString("KIRVANO_WEBHOOK_SECRET", {
  description: "Token secreto para validar webhooks da Kirvano",
  default: "CHANGE_ME_IN_PRODUCTION",
});

const getOfferIds = () => ({
  starter: KIRVANO_OFFER_STARTER.value() || functions.config().kirvano?.offer_starter || "",
  pro: KIRVANO_OFFER_PRO.value() || functions.config().kirvano?.offer_pro || "",
});

const getWebhookSecret = () =>
  KIRVANO_WEBHOOK_SECRET.value() || functions.config().kirvano?.webhook_secret || "";

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

interface RewardConfig {
  credits: number;
  plan: "free" | "starter" | "pro";
  isSubscription: boolean;
  subscriptionDays?: number;
}

// ============================================================================
// MAIN WEBHOOK FUNCTION
// ============================================================================

export const kirvanoWebhook = functions.https.onRequest(async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📥 [${timestamp}] KIRVANO WEBHOOK RECEIVED`);
  console.log(`${"=".repeat(60)}`);

  // 1. METHOD VALIDATION
  if (req.method !== "POST") {
    console.warn("❌ Invalid method:", req.method);
    res.status(405).send("Method Not Allowed");
    return;
  }

  // 2. SECURITY VALIDATION
  const providedToken = req.query.token || req.headers["x-webhook-token"];
  const expectedToken = getWebhookSecret();

  if (expectedToken && expectedToken !== "CHANGE_ME_IN_PRODUCTION" && providedToken !== expectedToken) {
    console.warn("❌ Invalid webhook token");
    res.status(401).send("Unauthorized");
    return;
  }

  // 3. PARSE PAYLOAD
  const rawPayload = req.body;
  console.log("📋 Raw payload:", JSON.stringify(rawPayload, null, 2));

  const payload = normalizePayload(rawPayload);
  
  console.log("📋 Normalized payload:", {
    event: payload.event,
    externalId: payload.externalId,
    offerId: payload.offerId,
    transactionId: payload.transactionId,
  });

  // 4. EVENT VALIDATION
  const validEvents = ["sale.approved", "sale.completed", "purchase.approved"];
  const validStatuses = ["APPROVED", "PAID", "COMPLETE", "COMPLETED"];

  const isValidEvent = validEvents.includes(payload.event?.toLowerCase?.() || "");
  const isValidStatus = validStatuses.includes(payload.status?.toUpperCase?.() || "");

  if (!isValidEvent && !isValidStatus) {
    console.log("⏭️ Skipping event:", payload.event || payload.status);
    res.status(200).send({ success: true, message: "Event not processed" });
    return;
  }

  // 5. EXTRACT USER ID
  const userId = payload.externalId;

  if (!userId) {
    console.error("❌ CRITICAL: No external_id (user UID) in payload!");
    
    await db.collection("failed_webhooks").add({
      error: "Missing external_id",
      payload: rawPayload,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({ success: false, error: "No user ID provided" });
    return;
  }

  // 6. IDEMPOTENCY CHECK
  const transactionId = payload.transactionId;

  if (transactionId) {
    const paymentRef = db.collection("users").doc(userId).collection("payments").doc(transactionId);
    const existingPayment = await paymentRef.get();

    if (existingPayment.exists) {
      console.log(`⏭️ Transaction ${transactionId} already processed, skipping`);
      res.status(200).send({ 
        success: true, 
        message: "Transaction already processed",
        transactionId 
      });
      return;
    }
  }

  // 7. DETERMINE REWARD
  const offerIds = getOfferIds();
  const offerId = payload.offerId;
  
  let reward: RewardConfig;

  switch (offerId) {
    case offerIds.starter:
      console.log("🎁 Matched: STARTER offer");
      reward = {
        credits: 15,
        plan: "starter",
        isSubscription: false,
      };
      break;

    case offerIds.pro:
      console.log("🎁 Matched: PRO offer");
      reward = {
        credits: 50,
        plan: "pro",
        isSubscription: true,
        subscriptionDays: 30,
      };
      break;

    default:
      console.warn(`⚠️ Unknown offer ID: ${offerId}`);
      // Fallback
      reward = {
        credits: 10,
        plan: "free",
        isSubscription: false,
      };
  }

  console.log(`💰 Reward: +${reward.credits} credits, plan=${reward.plan}`);

  // 8. UPDATE FIRESTORE
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error(`❌ User not found: ${userId}`);
      
      await db.collection("failed_webhooks").add({
        userId,
        error: "User not found in Firestore",
        payload: rawPayload,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).send({ success: false, error: "User not found" });
      return;
    }

    // CORREÇÃO DO ERRO TS2314: Usando 'any' ou 'Record<string, any>'
    const updateData: Record<string, any> = {
      credits: admin.firestore.FieldValue.increment(reward.credits),
      lastPurchase: admin.firestore.FieldValue.serverTimestamp(),
    };

    const currentPlan = userDoc.data()?.plan?.toLowerCase() || "free";
    const planHierarchy = { free: 0, starter: 1, pro: 2 };
    
    if ((planHierarchy[reward.plan] || 0) > (planHierarchy[currentPlan as keyof typeof planHierarchy] || 0)) {
      updateData.plan = reward.plan.toUpperCase();
      console.log(`📈 Upgrading plan: ${currentPlan} -> ${reward.plan}`);
    }

    if (reward.isSubscription && reward.subscriptionDays) {
      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + reward.subscriptionDays);
      updateData.subscriptionRenewsAt = admin.firestore.Timestamp.fromDate(renewalDate);
    }

    await userRef.update(updateData);
    console.log(`✅ User ${userId} updated successfully`);

    // 9. RECORD PAYMENT
    if (transactionId) {
      await db.collection("users").doc(userId).collection("payments").doc(transactionId).set({
        transactionId,
        offerId,
        creditsAdded: reward.credits,
        planAssigned: reward.plan,
        amount: payload.amount,
        customerEmail: payload.customerEmail,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        rawPayload,
      });
    }

    await db.collection("transactions").add({
      userId,
      transactionId,
      offerId,
      creditsAdded: reward.credits,
      planAssigned: reward.plan,
      amount: payload.amount,
      customerEmail: payload.customerEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({
      success: true,
      userId,
      creditsAdded: reward.credits,
      plan: reward.plan,
      transactionId,
    });

  } catch (error) {
    console.error("❌ Error processing webhook:", error);

    await db.collection("failed_webhooks").add({
      userId,
      error: String(error),
      payload: rawPayload,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({ success: false, error: "Internal error" });
  }
});

// ============================================================================
// HELPER: Normalize Payload
// ============================================================================

interface NormalizedPayload {
  event?: string;
  status?: string;
  externalId?: string;
  offerId?: string;
  transactionId?: string;
  amount?: number;
  customerEmail?: string;
}

function normalizePayload(raw: any): NormalizedPayload {
  if (raw.event && raw.data) {
    const data = raw.data;
    return {
      event: raw.event,
      externalId: data.external_id,
      offerId: data.offer?.id || data.product?.id,
      transactionId: data.transaction?.id,
      amount: data.transaction?.amount,
      customerEmail: data.customer?.email,
    };
  }

  return {
    status: raw.status,
    externalId: raw.external_id,
    offerId: raw.offer_id || raw.product_id,
    transactionId: raw.transaction_id,
    amount: raw.amount,
    customerEmail: raw.customer_email || raw.customer?.email,
  };
}

// ============================================================================
// MANUAL CREDIT FUNCTION
// ============================================================================

export const addCreditsManually = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId, credits } = data;

  if (!userId || typeof credits !== "number") {
    throw new functions.https.HttpsError("invalid-argument", "userId and credits (number) required");
  }

  try {
    await db.collection("users").doc(userId).update({
      credits: admin.firestore.FieldValue.increment(credits),
      lastManualCredit: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Added ${credits} credits to ${userId}` };
  } catch (error) {
    throw new functions.https.HttpsError("internal", String(error));
  }
});