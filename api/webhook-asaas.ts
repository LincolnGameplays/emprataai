/**
 * 🔐 WEBHOOK ASAAS - Secure Subscription Updates
 * 
 * This endpoint is called by Asaas when payment is confirmed.
 * Uses Firebase Admin SDK to bypass Firestore rules and update subscription.
 * 
 * Security:
 * - Validates webhook secret token
 * - Only processes confirmed/received payments
 * - Uses Admin SDK (bypasses client rules)
 * 
 * Required Environment Variables (Vercel):
 * - ASAAS_WEBHOOK_SECRET: Token configured in Asaas webhook settings
 * - FIREBASE_PROJECT_ID: From Firebase service account JSON
 * - FIREBASE_CLIENT_EMAIL: From Firebase service account JSON  
 * - FIREBASE_PRIVATE_KEY: From Firebase service account JSON (with \n replaced)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE ADMIN SDK INITIALIZATION (Singleton)
// ═══════════════════════════════════════════════════════════════════════════

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.error('[Webhook] Missing Firebase Admin credentials');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  }
}

const db = admin.apps.length ? admin.firestore() : null;

// ═══════════════════════════════════════════════════════════════════════════
// PLAN MAPPING BASED ON PAYMENT VALUE
// ═══════════════════════════════════════════════════════════════════════════

function getPlanFromValue(value: number): 'STARTER' | 'GROWTH' | 'BLACK' {
  if (value >= 290) return 'BLACK';      // R$ 299.90
  if (value >= 140) return 'GROWTH';     // R$ 149.90
  return 'STARTER';                       // Free tier
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, asaas-access-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 1. SECURITY: Validate webhook is from Asaas
  // ═══════════════════════════════════════════════════════════════════════
  
  const asaasToken = req.headers['asaas-access-token'] as string;
  const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;
  
  if (!webhookSecret || asaasToken !== webhookSecret) {
    console.error('[Webhook] Unauthorized - Invalid token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. CHECK DATABASE CONNECTION
  // ═══════════════════════════════════════════════════════════════════════
  
  if (!db) {
    console.error('[Webhook] Firebase Admin not initialized');
    return res.status(500).json({ error: 'Database connection failed' });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. PARSE WEBHOOK PAYLOAD
  // ═══════════════════════════════════════════════════════════════════════
  
  const { event, payment } = req.body;
  
  console.log(`[Webhook] Received event: ${event}`);

  // Only process confirmed payments
  const VALID_EVENTS = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];
  
  if (!VALID_EVENTS.includes(event)) {
    console.log(`[Webhook] Ignoring event: ${event}`);
    return res.status(200).json({ received: true, ignored: true });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. EXTRACT USER ID FROM PAYMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  // externalReference should be the Firebase UID, set when creating subscription
  const userId = payment?.externalReference;
  const value = payment?.value || 0;
  const subscriptionId = payment?.subscription || payment?.id;

  if (!userId) {
    console.error('[Webhook] Payment missing externalReference (userId)');
    return res.status(400).json({ error: 'Payment missing user reference' });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. UPDATE USER SUBSCRIPTION (Admin SDK - Bypasses Rules)
  // ═══════════════════════════════════════════════════════════════════════
  
  try {
    const newPlan = getPlanFromValue(value);
    
    await db.collection('users').doc(userId).update({
      subscription: {
        plan: newPlan,
        status: 'active',
        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
        provider: 'asaas',
        subscriptionId: subscriptionId,
        value: value
      },
      // Also update legacy 'plan' field for backwards compatibility
      plan: newPlan,
      
      // ════════════════════════════════════════════════════════════════════
      // EMPRATA JOURNEY - Faturamento Verificado (Só pagamentos online)
      // Essa atualização NUNCA acontece no frontend, garantindo segurança
      // ════════════════════════════════════════════════════════════════════
      'stats.verifiedRevenue': admin.firestore.FieldValue.increment(value),
      'stats.lifetimeRevenue': admin.firestore.FieldValue.increment(value),
      'stats.lastOnlineSale': admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[Webhook] ✅ User ${userId} upgraded to ${newPlan} (R$ ${value})`);
    
    return res.status(200).json({ 
      received: true, 
      userId: userId,
      newPlan: newPlan 
    });

  } catch (error: any) {
    console.error('[Webhook] Error updating Firebase:', error.message);
    return res.status(500).json({ error: 'Failed to update subscription' });
  }
}
