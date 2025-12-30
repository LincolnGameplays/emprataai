/**
 * ⚡ ASAAS ONBOARD - Subconta Creation ⚡
 * Creates a wallet/subaccount for the restaurant in Asaas
 * * POST /api/finance/onboard
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
  state: string;
  companyType?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION';
}

// ══════════════════════════════════════════════════════════════════
// MAIN FUNCTION (CORRIGIDO PARA V2: request)
// ══════════════════════════════════════════════════════════════════

// Observe que agora recebemos (request) e extraímos data/auth de dentro dele
export const financeOnboard = functions.https.onCall(async (request) => {
  const data = request.data as OnboardRequest;
  const auth = request.auth;

  // 1. Auth check
  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const uid = auth.uid;
  
  // 2. Validate required fields
  // Nota: 'province' (Bairro) não é obrigatório na validação, mas enviamos 'Centro' como fallback
  const required = ['name', 'email', 'cpfCnpj', 'phone', 'postalCode', 'address', 'addressNumber', 'city', 'state'];
  
  for (const field of required) {
    // Verifica se o campo existe e não é vazio
    if (!data[field as keyof OnboardRequest]) {
      console.error(`[ONBOARD] Missing field: ${field}`, data);
      throw new functions.https.HttpsError('invalid-argument', `Campo obrigatório: ${field}`);
    }
  }

  // 3. Check if already onboarded
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
    console.log(`[ONBOARD] Creating account for ${data.email}...`);

    // 4. Create Asaas subaccount
    const response = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/accounts`,
      {
        name: data.name,
        email: data.email,
        loginEmail: data.email, // O restaurante fará login com esse email
        cpfCnpj: data.cpfCnpj.replace(/\D/g, ''), // Remove formatação (pontos/traços)
        phone: data.phone.replace(/\D/g, ''),
        mobilePhone: data.phone.replace(/\D/g, ''),
        postalCode: data.postalCode.replace(/\D/g, ''),
        address: data.address,
        addressNumber: data.addressNumber,
        province: data.province || 'Centro', // Fallback obrigatório se vazio
        city: 0, // 0 deixa o Asaas inferir pelo CEP (mais seguro se não tiver o ID da cidade)
        state: data.state,
        companyType: data.companyType || 'MEI',
      },
      {
        headers: {
          'access_token': ASAAS_CONFIG.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const asaasAccount = response.data;
    
    // 5. Save to Firestore
    await db.collection('users').doc(uid).set({
      finance: {
        asaasAccountId: asaasAccount.id,
        asaasWalletId: asaasAccount.walletId || asaasAccount.id, // Fallback para ID se walletId vier null
        asaasApiKey: asaasAccount.apiKey || null, // Chave individual da subconta (se disponível)
        onboardedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
      }
    }, { merge: true });

    console.log(`[ASAAS] Account created for user ${uid}: ${asaasAccount.id}`);

    return {
      success: true,
      accountId: asaasAccount.id,
      walletId: asaasAccount.walletId,
      message: 'Conta ativada com sucesso!'
    };

  } catch (error: any) {
    console.error('[ASAAS ONBOARD ERROR]', error.response?.data || error.message);

    // Tenta extrair a mensagem de erro específica do Asaas
    const errorMessage = error.response?.data?.errors?.[0]?.description 
      || error.message 
      || 'Erro ao criar conta financeira';

    throw new functions.https.HttpsError('internal', errorMessage);
  }
});
