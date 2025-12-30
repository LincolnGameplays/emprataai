/**
 * Emprata.ai - Firebase Cloud Functions
 * Main Entry Point with CORS & Asaas Module Exports
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { defineString } from "firebase-functions/params";
import * as cors from "cors";

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ══════════════════════════════════════════════════════════════════
// CORS Configuration - Multiple localhost ports + Production
// ══════════════════════════════════════════════════════════════════

const corsHandler = cors({ 
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "https://emprataai.vercel.app",
    "https://emprata-ai.web.app",
    "https://emprata.app"
  ] 
});

// ══════════════════════════════════════════════════════════════════
// ASAAS FINANCIAL MODULE EXPORTS
// ══════════════════════════════════════════════════════════════════

export * from "./asaas/onboard";
export * from "./asaas/charge";
export * from "./asaas/webhook";
export * from "./asaas/subscribe";

// ══════════════════════════════════════════════════════════════════
// KIRVANO LEGACY (Keeping for backwards compatibility)
// ══════════════════════════════════════════════════════════════════

const KIRVANO_OFFER_STARTER = defineString("KIRVANO_OFFER_STARTER", {
  description: "ID da oferta STARTER na Kirvano",
  default: "30cef9d1-c08e-49ed-b361-2862f182485f",
});

const KIRVANO_OFFER_PRO = defineString("KIRVANO_OFFER_PRO", {
  description: "ID da oferta PRO na Kirvano",
  default: "b26facd0-9585-4b17-8b68-d58aaf659939",
});

const KIRVANO_WEBHOOK_SECRET = defineString("KIRVANO_WEBHOOK_SECRET", {
  description: "Token secreto para validar webhooks da Kirvano",
  default: "CHANGE_ME_IN_PRODUCTION",
});

const getOfferIds = () => ({
  starter: KIRVANO_OFFER_STARTER.value() || "",
  pro: KIRVANO_OFFER_PRO.value() || "",
});

const getWebhookSecret = () => KIRVANO_WEBHOOK_SECRET.value() || "";

// ══════════════════════════════════════════════════════════════════
// KIRVANO WEBHOOK (Legacy - deprecated in favor of Asaas)
// ══════════════════════════════════════════════════════════════════

interface RewardConfig {
  credits: number;
  plan: "free" | "starter" | "pro";
  isSubscription: boolean;
  subscriptionDays?: number;
}

export const kirvanoWebhook = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📥 [${timestamp}] KIRVANO WEBHOOK RECEIVED (LEGACY)`);
    console.log(`${"=".repeat(60)}`);

    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const providedToken = req.query.token || req.headers["x-webhook-token"];
    const expectedToken = getWebhookSecret();

    if (expectedToken && expectedToken !== "CHANGE_ME_IN_PRODUCTION" && providedToken !== expectedToken) {
      res.status(401).send("Unauthorized");
      return;
    }

    const rawPayload = req.body;
    const payload = normalizePayload(rawPayload);

    const validEvents = ["sale.approved", "sale.completed", "purchase.approved"];
    const validStatuses = ["APPROVED", "PAID", "COMPLETE", "COMPLETED"];

    const isValidEvent = validEvents.includes(payload.event?.toLowerCase?.() || "");
    const isValidStatus = validStatuses.includes(payload.status?.toUpperCase?.() || "");

    if (!isValidEvent && !isValidStatus) {
      res.status(200).send({ success: true, message: "Event not processed" });
      return;
    }

    let userId: string;
    const externalId = payload.externalId;
    const customerEmail = payload.customerEmail;

    try {
      if (externalId) {
        userId = externalId;
      } else if (customerEmail) {
        try {
          const userRecord = await admin.auth().getUserByEmail(customerEmail);
          userId = userRecord.uid;
        } catch (emailError: any) {
          if (emailError.code === "auth/user-not-found") {
            const newUser = await admin.auth().createUser({
              email: customerEmail,
              emailVerified: true,
            });
            userId = newUser.uid;
            await db.collection("users").doc(userId).set({
              email: customerEmail,
              credits: 0,
              plan: "FREE",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              autoCreated: true,
            });
          } else {
            throw emailError;
          }
        }
      } else {
        await db.collection("failed_webhooks").add({
          error: "Missing both external_id and customer email",
          payload: rawPayload,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).send({ success: false, error: "No user identifier" });
        return;
      }
    } catch (error) {
      console.error("User resolution error:", error);
      res.status(200).send({ success: false, error: "User resolution failed" });
      return;
    }

    const transactionId = payload.transactionId;

    if (transactionId) {
      const paymentRef = db.collection("users").doc(userId).collection("payments").doc(transactionId);
      const existingPayment = await paymentRef.get();
      if (existingPayment.exists) {
        res.status(200).send({ success: true, message: "Already processed" });
        return;
      }
    }

    const offerIds = getOfferIds();
    const offerId = payload.offerId;
    let reward: RewardConfig;

    switch (offerId) {
      case offerIds.starter:
      case "30cef9d1-c08e-49ed-b361-2862f182485f":
        reward = { credits: 50, plan: "starter", isSubscription: true, subscriptionDays: 30 };
        break;
      case offerIds.pro:
      case "b26facd0-9585-4b17-8b68-d58aaf659939":
        reward = { credits: 200, plan: "pro", isSubscription: true, subscriptionDays: 30 };
        break;
      default:
        reward = { credits: 50, plan: "starter", isSubscription: false };
    }

    try {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        await userRef.set({
          email: customerEmail || "unknown@emprata.ai",
          credits: 0,
          plan: "FREE",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      const updateData: Record<string, any> = {
        credits: admin.firestore.FieldValue.increment(reward.credits),
        lastPurchase: admin.firestore.FieldValue.serverTimestamp(),
      };

      const currentPlan = userDoc.data()?.plan?.toLowerCase() || "free";
      const planHierarchy = { free: 0, starter: 1, pro: 2 };

      if ((planHierarchy[reward.plan] || 0) > (planHierarchy[currentPlan as keyof typeof planHierarchy] || 0)) {
        updateData.plan = reward.plan.toUpperCase();
      }

      if (reward.isSubscription && reward.subscriptionDays) {
        const renewalDate = new Date();
        renewalDate.setDate(renewalDate.getDate() + reward.subscriptionDays);
        updateData.subscriptionRenewsAt = admin.firestore.Timestamp.fromDate(renewalDate);
      }

      await userRef.update(updateData);

      if (transactionId) {
        await db.collection("users").doc(userId).collection("payments").doc(transactionId).set({
          transactionId,
          offerId,
          creditsAdded: reward.credits,
          planAssigned: reward.plan,
          amount: payload.amount,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      res.status(200).send({
        success: true,
        userId,
        creditsAdded: reward.credits,
        plan: reward.plan,
      });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(200).send({ success: false, error: "Internal error" });
    }
  });
});

// ══════════════════════════════════════════════════════════════════
// HELPER: Normalize Payload
// ══════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════
// MANUAL CREDIT FUNCTION (Admin utility)
// ══════════════════════════════════════════════════════════════════

export const addCreditsManually = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId, credits } = data;

  if (!userId || typeof credits !== "number") {
    throw new functions.https.HttpsError("invalid-argument", "userId and credits required");
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