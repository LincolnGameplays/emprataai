/**
 * ⚡ ASAAS ONBOARD - Subconta Creation ⚡
 * Creates a wallet/subaccount for the restaurant in Asaas
 * 
 * POST /api/finance/onboard
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { ASAAS_CONFIG } from './constants';

// Initialize if not already
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

interface OnboardRequest {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  province: string; // Bairro
  city: string;
  state: string; // UF
  companyType?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION';
}

// ══════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ══════════════════════════════════════════════════════════════════

// CORRIGIDO: Assinatura (request)
export const financeOnboard = functions.https.onCall(async (request) => {
  const data = request.data as OnboardRequest;
  const auth = request.auth;

  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const uid = auth.uid;
  
  // Validate required fields
  const required = ['name', 'email', 'cpfCnpj', 'phone', 'postalCode', 'address', 'addressNumber', 'city', 'state'];
  for (const field of required) {
    if (!data[field as keyof OnboardRequest]) {
      throw new functions.https.HttpsError('invalid-argument', `Campo obrigatório: ${field}`);
    }
  }

  // Check if already onboarded
  const userDoc = await db.collection('users').doc(uid).get();
  const existingAsaasId = userDoc.data()?.finance?.asaasAccountId;
  
  if (existingAsaasId) {
    return { 
      success: true, 
      accountId: existingAsaasId,
      message: 'Conta já estava ativa' 
    };
  }

  try {
    // 1. Cria a subconta no Asaas
    const response = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/accounts`,
      {
        name: data.name,
        email: data.email,
        loginEmail: data.email,
        cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
        phone: data.phone.replace(/\D/g, ''),
        mobilePhone: data.phone.replace(/\D/g, ''),
        postalCode: data.postalCode.replace(/\D/g, ''),
        address: data.address,
        addressNumber: data.addressNumber,
        province: data.province || 'Centro',
        city: data.city,
        state: data.state,
        companyType: data.companyType || 'MEI',
        country: 'BR'
      },
      {
        headers: {
          'access_token': ASAAS_CONFIG.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const asaasAccount = response.data;

    // 2. Salva o ID da carteira (walletId) no Firestore do usuário
    const walletId = asaasAccount.walletId || asaasAccount.id;

    await db.collection('users').doc(uid).set({
      finance: {
        asaasAccountId: asaasAccount.id,
        asaasWalletId: walletId,
        asaasApiKey: asaasAccount.apiKey, // Their individual key
        onboardedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
      }
    }, { merge: true });

    console.log(`[ASAAS] Account created for user ${uid}: ${asaasAccount.id}`);

    return {
      success: true,
      accountId: asaasAccount.id,
      walletId: walletId,
      message: 'Conta Asaas criada com sucesso'
    };

  } catch (error: any) {
    console.error('[ASAAS ONBOARD ERROR]', error.response?.data || error.message);

    const errorMessage = error.response?.data?.errors?.[0]?.description 
      || error.message 
      || 'Falha ao criar conta financeira';

    throw new functions.https.HttpsError('internal', errorMessage);
  }
});
