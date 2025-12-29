/**
 * Emprata.ai - Firebase Cloud Functions
 * Kirvano Webhook Integration v2.1 (Fixed Build)
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {defineString} from "firebase-functions/params";
import * as cors from "cors";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

// Configuração de CORS para aceitar Localhost e Vercel
const corsHandler = cors({ 
  origin: [
    "http://localhost:5173", 
    "https://emprataai.vercel.app", // Domínio da Vercel
    "https://emprata-ai.web.app"
  ] 
});

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const KIRVANO_OFFER_STARTER = defineString("KIRVANO_OFFER_STARTER", {
  description: "ID da oferta STARTER na Kirvano (pacote de 50 créditos - R$ 97/mês)",
  default: "30cef9d1-c08e-49ed-b361-2862f182485f",
});

const KIRVANO_OFFER_PRO = defineString("KIRVANO_OFFER_PRO", {
  description: "ID da oferta PRO na Kirvano (200 créditos - R$ 197/mês)",  
  default: "b26facd0-9585-4b17-8b68-d58aaf659939",
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

  // 5. INTELLIGENT USER RESOLUTION (3-Tier Fallback)
  let userId: string;
  const externalId = payload.externalId;
  const customerEmail = payload.customerEmail;

  console.log(`🔍 User Resolution - external_id: ${externalId || 'NONE'}, email: ${customerEmail || 'NONE'}`);

  try {
    // TIER 1: Use external_id if provided (logged-in user flow)
    if (externalId) {
      console.log(`✅ TIER 1: Using external_id: ${externalId}`);
      userId = externalId;
    } 
    // TIER 2: Lookup user by email (guest checkout with existing account)
    else if (customerEmail) {
      console.log(`🔍 TIER 2: Attempting email lookup for: ${customerEmail}`);
      
      try {
        const userRecord = await admin.auth().getUserByEmail(customerEmail);
        userId = userRecord.uid;
        console.log(`✅ TIER 2: Found existing user by email: ${userId}`);
      } catch (emailError: any) {
        // TIER 3: Create new user (first-time buyer, no account)
        if (emailError.code === 'auth/user-not-found') {
          console.log(`🆕 TIER 3: User not found, creating new account for: ${customerEmail}`);
          
          const newUser = await admin.auth().createUser({
            email: customerEmail,
            emailVerified: true,
          });
          
          userId = newUser.uid;
          console.log(`✅ TIER 3: Auto-created user: ${userId}`);
          
          // Initialize user document in Firestore
          await db.collection("users").doc(userId).set({
            email: customerEmail,
            credits: 0,
            plan: "FREE",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            autoCreated: true,
          });
          
        } else {
          throw emailError; // Re-throw unexpected errors
        }
      }
    } 
    // FAILURE: No identifier available
    else {
      console.error("❌ CRITICAL: No external_id OR customer email in payload!");
      
      await db.collection("failed_webhooks").add({
        error: "Missing both external_id and customer email",
        payload: rawPayload,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).send({ success: false, error: "No user identifier provided" });
      return;
    }

  } catch (error) {
    console.error("❌ Error during user resolution:", error);
    
    await db.collection("failed_webhooks").add({
      error: `User resolution failed: ${String(error)}`,
      payload: rawPayload,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({ success: false, error: "User resolution failed" });
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
    case "30cef9d1-c08e-49ed-b361-2862f182485f": // Hardcoded fallback
      console.log("🎁 Matched: STARTER offer (50 credits)");
      reward = {
        credits: 50, // UPDATED: Was 15, now 50 for churn reduction
        plan: "starter",
        isSubscription: true,
        subscriptionDays: 30,
      };
      break;

    case offerIds.pro:
    case "b26facd0-9585-4b17-8b68-d58aaf659939": // Hardcoded fallback
      console.log("🎁 Matched: PRO offer (200 credits)");
      reward = {
        credits: 200, // UPDATED: Was 50, now 200 for churn reduction
        plan: "pro",
        isSubscription: true,
        subscriptionDays: 30,
      };
      break;

    default:
      console.warn(`⚠️ Unknown offer ID: ${offerId}`);
      // Fallback - generous default to prevent complaints
      reward = {
        credits: 50,
        plan: "starter",
        isSubscription: false,
      };
  }

  console.log(`💰 Reward: +${reward.credits} credits, plan=${reward.plan}`);

  // 8. UPDATE FIRESTORE
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    // If user document doesn't exist, create it (edge case for auto-created users)
    if (!userDoc.exists) {
      console.log(`📝 Creating Firestore document for user: ${userId}`);
      await userRef.set({
        email: customerEmail || "unknown@emprata.ai",
        credits: 0,
        plan: "FREE",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        autoCreated: !externalId, // Flag if created via email fallback
      });
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