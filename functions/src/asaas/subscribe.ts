// ✅ IMPORTAÇÃO V2
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { ASAAS_CONFIG } from './constants';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

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
  plan: 'STARTER' | 'GROWTH';
  billingType: 'PIX' | 'CREDIT_CARD';
  creditCard?: CreditCardData;
  creditCardHolder?: CreditCardHolderInfo;
}

const PLANS: Record<string, number> = {
  'STARTER': 97.00,
  'GROWTH': 197.00
};

export const createSubscription = onCall(async (request) => {
  const data = request.data as SubscriptionRequest;
  const auth = request.auth;

  if (!auth) throw new HttpsError('unauthenticated', 'Login necessário');
  
  const uid = auth.uid;
  const { plan, billingType } = data;

  if (!PLANS[plan]) throw new HttpsError('invalid-argument', 'Plano inválido');

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userData) throw new HttpsError('not-found', 'Usuário não encontrado');

    let customerId = userData.asaasCustomerId;
    if (!customerId) {
      const customerRes = await axios.post(`${ASAAS_CONFIG.baseUrl}/customers`, {
        name: userData.name || `User ${uid}`,
        email: userData.email,
        cpfCnpj: userData.cpfCnpj || userData.cpf || '00000000000', 
        externalReference: uid
      }, { headers: { access_token: ASAAS_CONFIG.apiKey } });
      
      customerId = customerRes.data.id;
      await db.collection('users').doc(uid).update({ asaasCustomerId: customerId });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionPayload: any = {
      customer: customerId,
      billingType: billingType,
      value: PLANS[plan],
      nextDueDate: new Date().toISOString().split('T')[0], 
      cycle: 'MONTHLY',
      description: `Assinatura EmprataAI - Plano ${plan}`,
      externalReference: uid
    };

    if (billingType === 'CREDIT_CARD') {
      if (!data.creditCard || !data.creditCardHolder) {
        throw new HttpsError('invalid-argument', 'Dados do cartão incompletos');
      }
      subscriptionPayload.creditCard = data.creditCard;
      subscriptionPayload.creditCardHolderInfo = data.creditCardHolder;
    }

    const subRes = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/subscriptions`, 
      subscriptionPayload,
      { headers: { access_token: ASAAS_CONFIG.apiKey } }
    );
    const subscription = subRes.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pixData: any = null;

    if (billingType === 'PIX') {
      await new Promise(r => setTimeout(r, 1000));
      const paymentsRes = await axios.get(
        `${ASAAS_CONFIG.baseUrl}/subscriptions/${subscription.id}/payments`,
        { headers: { access_token: ASAAS_CONFIG.apiKey } }
      );
      const firstPayment = paymentsRes.data.data[0];
      if (firstPayment) {
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
      invoiceUrl: subscription.invoiceUrl, 
      pixCode: pixData?.payload || null,     
      pixImage: pixData?.encodedImage || null 
    };

  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('[SUB ERROR]', err.response?.data || err);
    const msg = err.response?.data?.errors?.[0]?.description || 'Erro ao processar assinatura.';
    throw new HttpsError('internal', msg);
  }
});

export const cancelSubscription = onCall(async (request) => {
   const data = request.data as { subscriptionId: string };
   const auth = request.auth;

   if (!auth) throw new HttpsError('unauthenticated', 'Login necessário');
   
   try {
     await axios.delete(
        `${ASAAS_CONFIG.baseUrl}/subscriptions/${data.subscriptionId}`,
        { headers: { access_token: ASAAS_CONFIG.apiKey } }
     );
     return { success: true };
   } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      console.error(err);
      throw new HttpsError('internal', 'Erro ao cancelar');
   }
});
