/**
 * ⚡ ASAAS WEBHOOK - Payment Confirmation Handler ⚡
 * Receives notifications from Asaas when payment status changes
 * 
 * POST /api/webhook/asaas
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ASAAS_CONFIG, ASAAS_EVENTS } from './constants';

// Initialize if not already
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

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

  // Security: Verify webhook token
  const accessToken = req.headers['asaas-access-token'] || req.headers['access-token'];
  
  if (accessToken !== ASAAS_CONFIG.webhookToken && ASAAS_CONFIG.webhookToken) {
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
  const orderId = payment.externalReference;

  console.log(`[WEBHOOK] Event: ${event}, Payment: ${payment.id}, Order: ${orderId}`);

  try {
    // Handle different events
    switch (event) {
      case ASAAS_EVENTS.PAYMENT_RECEIVED:
      case ASAAS_EVENTS.PAYMENT_CONFIRMED:
        await handlePaymentConfirmed(orderId, payment);
        break;

      case ASAAS_EVENTS.PAYMENT_OVERDUE:
        await handlePaymentOverdue(orderId, payment);
        break;

      case ASAAS_EVENTS.PAYMENT_REFUNDED:
        await handlePaymentRefunded(orderId, payment);
        break;

      default:
        console.log(`[WEBHOOK] Unhandled event: ${event}`);
    }

    res.status(200).json({ received: true, event });
    
  } catch (error: any) {
    console.error('[WEBHOOK ERROR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ══════════════════════════════════════════════════════════════════

async function handlePaymentConfirmed(
  orderId: string | undefined,
  payment: AsaasWebhookPayload['payment']
) {
  if (!orderId) {
    console.warn('[WEBHOOK] No externalReference in payment');
    return;
  }

  // Find order by ID
  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    console.warn(`[WEBHOOK] Order not found: ${orderId}`);
    return;
  }

  const orderData = orderDoc.data()!;

  // Update order status
  await orderRef.update({
    status: 'preparing',
    paymentStatus: 'paid',
    paymentDate: payment.paymentDate || new Date().toISOString(),
    paymentNetValue: payment.netValue,
    isPaid: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[WEBHOOK] Order ${orderId} marked as PAID and PREPARING`);

  // Log to audit
  await db.collection('audit_logs').add({
    action: 'payment_confirmed',
    orderId,
    paymentId: payment.id,
    value: payment.value,
    netValue: payment.netValue,
    restaurantId: orderData.restaurantId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    severity: 'info',
  });

  // TODO: Send notification to restaurant (push/email)
}

async function handlePaymentOverdue(
  orderId: string | undefined,
  payment: AsaasWebhookPayload['payment']
) {
  if (!orderId) return;

  const orderRef = db.collection('orders').doc(orderId);
  
  await orderRef.update({
    paymentStatus: 'overdue',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[WEBHOOK] Order ${orderId} payment OVERDUE`);
}

async function handlePaymentRefunded(
  orderId: string | undefined,
  payment: AsaasWebhookPayload['payment']
) {
  if (!orderId) return;

  const orderRef = db.collection('orders').doc(orderId);
  
  await orderRef.update({
    status: 'cancelled',
    paymentStatus: 'refunded',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Log refund
  await db.collection('audit_logs').add({
    action: 'payment_refunded',
    orderId,
    paymentId: payment.id,
    value: payment.value,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    severity: 'warning',
  });

  console.log(`[WEBHOOK] Order ${orderId} REFUNDED`);
}
