import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { ASAAS_CONFIG } from './constants';

const db = admin.firestore();

// Tipos
interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

interface CreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

interface SubscriptionRequest {
  plan: 'STARTER' | 'GROWTH' | 'SCALE';
  billingType: 'PIX' | 'CREDIT_CARD';
  creditCard?: CreditCardData;
  creditCardHolder?: CreditCardHolderInfo;
}

const PLANS: Record<string, number> = {
  'STARTER': 97.00,
  'GROWTH': 197.00,
  'SCALE': 497.00
};

export const createSubscription = functions.https.onCall(async (request) => {
  const data = request.data as SubscriptionRequest;
  const auth = request.auth;

  if (!auth) throw new functions.https.HttpsError('unauthenticated', 'Login necessário');
  
  const uid = auth.uid;
  const { plan, billingType } = data;

  if (!PLANS[plan]) throw new functions.https.HttpsError('invalid-argument', 'Plano inválido');

  try {
    // 1. Busca dados do usuário
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userData) throw new functions.https.HttpsError('not-found', 'Usuário não encontrado');

    // 2. Garante o Cliente no Asaas
    let customerId = userData.asaasCustomerId;
    if (!customerId) {
      // Se não tiver, cria agora
      const customerRes = await axios.post(`${ASAAS_CONFIG.baseUrl}/customers`, {
        name: userData.name || `User ${uid}`,
        email: userData.email,
        cpfCnpj: userData.cpfCnpj || userData.cpf || '00000000000', 
        externalReference: uid
      }, { headers: { access_token: ASAAS_CONFIG.apiKey } });
      
      customerId = customerRes.data.id;
      await db.collection('users').doc(uid).update({ asaasCustomerId: customerId });
    }

    // 3. Monta Payload da Assinatura
    const subscriptionPayload: any = {
      customer: customerId,
      billingType: billingType,
      value: PLANS[plan],
      nextDueDate: new Date().toISOString().split('T')[0], // Cobra Hoje
      cycle: 'MONTHLY',
      description: `Assinatura EmprataAI - Plano ${plan}`,
      externalReference: uid
    };

    // Adiciona dados do Cartão se necessário
    if (billingType === 'CREDIT_CARD') {
      if (!data.creditCard || !data.creditCardHolder) {
        throw new functions.https.HttpsError('invalid-argument', 'Dados do cartão incompletos');
      }
      subscriptionPayload.creditCard = data.creditCard;
      subscriptionPayload.creditCardHolderInfo = data.creditCardHolder;
    }

    console.log(`[SUB] Criando assinatura ${plan} via ${billingType} para ${customerId}`);

    // 4. Cria a Assinatura
    const subRes = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/subscriptions`, 
      subscriptionPayload,
      { headers: { access_token: ASAAS_CONFIG.apiKey } }
    );
    const subscription = subRes.data;

    let pixData = null;

    // 5. Se for PIX, precisamos buscar o QRCode da primeira cobrança gerada
    if (billingType === 'PIX') {
      // Pequeno delay para garantir que o Asaas gerou a cobrança da assinatura
      await new Promise(r => setTimeout(r, 1000));

      // Busca a cobrança gerada por essa assinatura
      const paymentsRes = await axios.get(
        `${ASAAS_CONFIG.baseUrl}/subscriptions/${subscription.id}/payments`,
        { headers: { access_token: ASAAS_CONFIG.apiKey } }
      );

      const firstPayment = paymentsRes.data.data[0];

      if (firstPayment) {
        // Gera o QR Code para essa cobrança
        const qrRes = await axios.get(
          `${ASAAS_CONFIG.baseUrl}/payments/${firstPayment.id}/pixQrCode`,
          { headers: { access_token: ASAAS_CONFIG.apiKey } }
        );
        pixData = qrRes.data;
      }
    }

    return {
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      invoiceUrl: subscription.invoiceUrl, // Link da fatura
      pixCode: pixData?.payload || null,     // Copia e Cola
      pixImage: pixData?.encodedImage || null // Imagem Base64
    };

  } catch (error: any) {
    console.error('[SUB ERROR]', error.response?.data || error);
    const msg = error.response?.data?.errors?.[0]?.description || 'Erro ao processar assinatura.';
    throw new functions.https.HttpsError('internal', msg);
  }
});

// Mantém a função de cancelamento que criamos antes
export const cancelSubscription = functions.https.onCall(async (request) => {
   const data = request.data as { subscriptionId: string };
   if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Login necessário');
   
   await axios.delete(
      `${ASAAS_CONFIG.baseUrl}/subscriptions/${data.subscriptionId}`,
      { headers: { access_token: ASAAS_CONFIG.apiKey } }
   );
   return { success: true };
});
