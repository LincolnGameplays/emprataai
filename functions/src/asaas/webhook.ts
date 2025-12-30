/**
 * ⚡ ASAAS WEBHOOK - Unified Payment Handler ⚡
 * Handles both:
 * - SaaS Subscriptions (100% to Emprata)
 * - Pizza Sales with Split (commission to Emprata, rest to restaurant)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ASAAS_CONFIG, ASAAS_EVENTS } from './constants';

// Initialize if not already
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ══════════════════════════════════════════════════════════════════
// PLAN DETECTION BY VALUE
// ══════════════════════════════════════════════════════════════════

function detectPlanFromValue(value: number): { plan: string; credits: number } {
  if (value >= 390) return { plan: 'SCALE', credits: 500 };
  if (value >= 190) return { plan: 'GROWTH', credits: 200 };
  if (value >= 90) return { plan: 'STARTER', credits: 50 };
  return { plan: 'FREE', credits: 0 };
}

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

interface AsaasWebhookPayload {
  event: string;
  payment: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    billingType: string;
    status: string;
    dueDate: string;
    paymentDate?: string;
    externalReference?: string;
    description?: string;
    invoiceUrl?: string;
    subscription?: string; // Subscription ID if recurring
  };
}

// ══════════════════════════════════════════════════════════════════
// MAIN WEBHOOK HANDLER
// ══════════════════════════════════════════════════════════════════

export const asaasWebhook = functions.https.onRequest(async (req, res) => {
  // Only accept POST
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Security: Verify webhook token (optional but recommended)
  const accessToken = req.headers['asaas-access-token'] || req.headers['access-token'];
  
  if (ASAAS_CONFIG.webhookToken && accessToken !== ASAAS_CONFIG.webhookToken) {
    console.warn('[WEBHOOK] Invalid token received');
    res.status(401).send('Unauthorized');
    return;
  }

  const payload: AsaasWebhookPayload = req.body;
  
  if (!payload || !payload.event || !payload.payment) {
    res.status(400).send('Invalid payload');
    return;
  }

  const { event, payment } = payload;
  const externalRef = payment.externalReference;
  const isSubscription = !!payment.subscription || payment.description?.includes('Assinatura');

  console.log(`[WEBHOOK] Event: ${event}, Payment: ${payment.id}, ` +
              `Ref: ${externalRef}, IsSubscription: ${isSubscription}`);

  try {
    // ════════════════════════════════════════════════════════════
    // PAYMENT CONFIRMED
    // ════════════════════════════════════════════════════════════
    if (event === ASAAS_EVENTS.PAYMENT_RECEIVED || event === ASAAS_EVENTS.PAYMENT_CONFIRMED) {
      
      // TYPE A: SaaS Subscription Payment
      if (isSubscription && externalRef) {
        await handleSubscriptionPayment(externalRef, payment);
        res.json({ received: true, type: 'subscription' });
        return;
      }

      // TYPE B: Restaurant Order (Split Payment)
      if (externalRef && !isSubscription) {
        await handleOrderPayment(externalRef, payment);
        res.json({ received: true, type: 'order' });
        return;
      }
    }

    // ════════════════════════════════════════════════════════════
    // PAYMENT OVERDUE
    // ════════════════════════════════════════════════════════════
    if (event === ASAAS_EVENTS.PAYMENT_OVERDUE && externalRef) {
      if (isSubscription) {
        await handleSubscriptionOverdue(externalRef);
      } else {
        await handleOrderOverdue(externalRef);
      }
      res.json({ received: true, type: 'overdue' });
      return;
    }

    // ════════════════════════════════════════════════════════════
    // PAYMENT REFUNDED
    // ════════════════════════════════════════════════════════════
    if (event === ASAAS_EVENTS.PAYMENT_REFUNDED && externalRef) {
      await handleRefund(externalRef, payment, isSubscription);
      res.json({ received: true, type: 'refund' });
      return;
    }

    // Unhandled event
    console.log(`[WEBHOOK] Unhandled event: ${event}`);
    res.json({ received: true });

  } catch (error: any) {
    console.error('[WEBHOOK ERROR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// HANDLER: SaaS Subscription Payment
// ══════════════════════════════════════════════════════════════════

async function handleSubscriptionPayment(
  userId: string,
  payment: AsaasWebhookPayload['payment']
) {
  const { plan, credits } = detectPlanFromValue(payment.value);

  console.log(`[SaaS] User ${userId} paid R$${payment.value} → Plan: ${plan}, Credits: ${credits}`);

  // Calculate next renewal (30 days from now)
  const renewsAt = new Date();
  renewsAt.setDate(renewsAt.getDate() + 30);

  await db.collection('users').doc(userId).update({
    plan: plan.toLowerCase(),
    credits: admin.firestore.FieldValue.increment(credits),
    'subscription.status': 'active',
    'subscription.lastPaymentAt': admin.firestore.FieldValue.serverTimestamp(),
    'subscription.renewsAt': admin.firestore.Timestamp.fromDate(renewsAt),
    'subscription.lastPaymentValue': payment.value,
  });

  // Audit log
  await db.collection('audit_logs').add({
    action: 'subscription_payment',
    userId,
    paymentId: payment.id,
    value: payment.value,
    plan,
    credits,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    severity: 'info',
  });

  console.log(`[SaaS] User ${userId} upgraded to ${plan} with ${credits} credits`);
}

// ══════════════════════════════════════════════════════════════════
// HANDLER: Restaurant Order Payment (Split)
// ══════════════════════════════════════════════════════════════════

async function handleOrderPayment(
  orderId: string,
  payment: AsaasWebhookPayload['payment']
) {
  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    console.warn(`[WEBHOOK] Order not found: ${orderId}`);
    return;
  }

  const orderData = orderDoc.data()!;

  await orderRef.update({
    status: 'preparing',
    paymentStatus: 'paid',
    paymentDate: payment.paymentDate || new Date().toISOString(),
    paymentNetValue: payment.netValue,
    isPaid: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[ORDER] Order ${orderId} marked as PAID and PREPARING`);

  // Audit log
  await db.collection('audit_logs').add({
    action: 'order_payment_confirmed',
    orderId,
    paymentId: payment.id,
    value: payment.value,
    netValue: payment.netValue,
    restaurantId: orderData.restaurantId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    severity: 'info',
  });
}

// ══════════════════════════════════════════════════════════════════
// HANDLER: Subscription Overdue
// ══════════════════════════════════════════════════════════════════

async function handleSubscriptionOverdue(userId: string) {
  await db.collection('users').doc(userId).update({
    'subscription.status': 'overdue',
  });

  console.log(`[SaaS] User ${userId} subscription OVERDUE`);
}

// ══════════════════════════════════════════════════════════════════
// HANDLER: Order Overdue
// ══════════════════════════════════════════════════════════════════

async function handleOrderOverdue(orderId: string) {
  await db.collection('orders').doc(orderId).update({
    paymentStatus: 'overdue',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[ORDER] Order ${orderId} payment OVERDUE`);
}

// ══════════════════════════════════════════════════════════════════
// HANDLER: Refund
// ══════════════════════════════════════════════════════════════════

async function handleRefund(
  refId: string,
  payment: AsaasWebhookPayload['payment'],
  isSubscription: boolean
) {
  if (isSubscription) {
    // Downgrade to free on refund
    await db.collection('users').doc(refId).update({
      plan: 'free',
      'subscription.status': 'refunded',
    });
    console.log(`[SaaS] User ${refId} subscription REFUNDED, downgraded to free`);
  } else {
    await db.collection('orders').doc(refId).update({
      status: 'cancelled',
      paymentStatus: 'refunded',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`[ORDER] Order ${refId} REFUNDED and cancelled`);
  }

  // Audit log
  await db.collection('audit_logs').add({
    action: isSubscription ? 'subscription_refunded' : 'order_refunded',
    refId,
    paymentId: payment.id,
    value: payment.value,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    severity: 'warning',
  });
}
