/**
 * ⚡ ASAAS CHARGE - Pix/Card Payment with Split ⚡
 * Generates payment with automatic fee split between Emprata and Restaurant
 * 
 * POST /api/finance/charge
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { ASAAS_CONFIG, calculateEmprataFee, UserPlan } from './constants';

// Initialize if not already
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

interface ChargeRequest {
  orderId: string;
  amount: number;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  customerData: {
    name: string;
    cpfCnpj: string;
    email?: string;
    phone?: string;
  };
  restaurantId: string; // UID of restaurant owner
  description?: string;
  dueDate?: string; // YYYY-MM-DD, default: today
}

interface SplitRule {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
}

// ══════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ══════════════════════════════════════════════════════════════════

export const financeCharge = functions.https.onCall(async (data: ChargeRequest, context) => {
  // Validate input
  if (!data.orderId || !data.amount || !data.restaurantId) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'orderId, amount and restaurantId are required'
    );
  }

  if (data.amount < 5) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Valor mínimo para cobrança é R$ 5,00'
    );
  }

  try {
    // Get restaurant data
    const restaurantDoc = await db.collection('users').doc(data.restaurantId).get();
    
    if (!restaurantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Restaurante não encontrado');
    }

    const restaurantData = restaurantDoc.data()!;
    const walletId = restaurantData.finance?.asaasWalletId;
    const plan: UserPlan = restaurantData.plan || 'free';

    if (!walletId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Restaurante não possui conta de pagamento ativa'
      );
    }

    // Calculate fees
    const { emprataFee, restaurantAmount } = calculateEmprataFee(data.amount, plan);
    
    // ════════════════════════════════════════════════════════════════
    // AI FRAUD GUARD - Risk Assessment
    // ════════════════════════════════════════════════════════════════
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let fraudScore = 0;
    
    // Risk factor: High value orders
    if (data.amount > 300) {
      fraudScore += 30;
      riskLevel = 'medium';
    }
    if (data.amount > 800) {
      fraudScore += 40;
      riskLevel = 'high';
    }
    
    // Risk factor: First order (could add check for new customer)
    // In production, you'd check customer history here
    
    console.log(`[FRAUD GUARD] Order ${data.orderId}: Score ${fraudScore}, Risk: ${riskLevel}`);
    
    console.log(`[CHARGE] Order ${data.orderId}: Total ${data.amount}, ` +
                `Emprata Fee: ${emprataFee}, Restaurant: ${restaurantAmount}`);

    // Build split rules
    const split: SplitRule[] = [
      {
        walletId: walletId,
        fixedValue: restaurantAmount, // Restaurant gets this
      }
    ];

    // Build payment payload
    const paymentPayload = {
      // Customer
      customer: data.customerData.cpfCnpj.replace(/\D/g, ''),
      customerName: data.customerData.name,
      
      // Payment details
      billingType: data.billingType || 'PIX',
      value: data.amount,
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      description: data.description || `Pedido #${data.orderId.slice(-6).toUpperCase()}`,
      
      // External reference for webhook
      externalReference: data.orderId,
      
      // Split configuration
      split: split,
      
      // Pix settings
      ...(data.billingType === 'PIX' && {
        postalService: false,
      }),
    };

    // Create payment in Asaas
    const response = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/payments`,
      paymentPayload,
      {
        headers: {
          'access_token': ASAAS_CONFIG.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const payment = response.data;

    // If PIX, get the QR code
    let pixData = null;
    if (data.billingType === 'PIX') {
      const pixResponse = await axios.get(
        `${ASAAS_CONFIG.baseUrl}/payments/${payment.id}/pixQrCode`,
        {
          headers: {
            'access_token': ASAAS_CONFIG.apiKey,
          },
        }
      );
      pixData = pixResponse.data;
    }

    // Update order with payment info
    const ordersQuery = await db.collection('orders')
      .where('__name__', '==', data.orderId)
      .limit(1)
      .get();

    if (!ordersQuery.empty) {
      await ordersQuery.docs[0].ref.update({
        paymentId: payment.id,
        paymentStatus: 'pending',
        paymentMethod: data.billingType.toLowerCase(),
        paymentUrl: payment.invoiceUrl,
        emprataFee: emprataFee,
        restaurantAmount: restaurantAmount,
        fraudScore: fraudScore,
        riskLevel: riskLevel,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log(`[CHARGE] Payment created: ${payment.id}`);

    return {
      success: true,
      paymentId: payment.id,
      status: payment.status,
      value: payment.value,
      dueDate: payment.dueDate,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
      // Pix specific
      pixCopyPaste: pixData?.payload,
      pixQrCode: pixData?.encodedImage, // Base64
      // Fee breakdown
      fees: {
        total: data.amount,
        emprataFee,
        restaurantAmount,
        plan,
      },
      // Fraud Guard
      riskLevel,
      fraudScore,
    };

  } catch (error: any) {
    console.error('[ASAAS CHARGE ERROR]', error.response?.data || error.message);

    const errorMessage = error.response?.data?.errors?.[0]?.description 
      || error.message 
      || 'Erro ao gerar cobrança';

    throw new functions.https.HttpsError('internal', errorMessage);
  }
});
