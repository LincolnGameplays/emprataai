import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { ASAAS_CONFIG } from './constants';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

interface OnboardRequest {
  name: string;
  email: string;
  cpfCnpj: string;
  birthDate?: string;
  companyType: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION' | 'UNKNOWN';
  incomeValue: number;
  phone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  province: string;
  city: string; // Recebemos do front, mas não mandamos para o Asaas (usamos CEP)
  state: string;
}

export const financeOnboard = functions.https.onCall(async (request) => {
  const data = request.data as OnboardRequest;
  const auth = request.auth;

  if (!auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

  const required = ['name', 'email', 'cpfCnpj', 'phone', 'postalCode', 'address', 'addressNumber', 'incomeValue'];
  
  for (const field of required) {
    if (!data[field as keyof OnboardRequest]) {
      throw new functions.https.HttpsError('invalid-argument', `Campo obrigatório faltando: ${field}`);
    }
  }

  const isPerson = data.cpfCnpj.replace(/\D/g, '').length === 11;
  if ((isPerson || data.companyType === 'MEI') && !data.birthDate) {
     throw new functions.https.HttpsError('invalid-argument', 'Data de nascimento é obrigatória para CPF ou MEI.');
  }

  try {
    // PREPARAÇÃO DO PAYLOAD
    // IMPORTANTE: Não enviamos o campo 'city'. O Asaas deduz pelo 'postalCode'.
    // Enviar city: 0 causa erro de validação.
    
    const payload = {
      name: data.name,
      email: data.email,
      loginEmail: data.email,
      cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
      birthDate: data.birthDate,
      companyType: data.companyType || 'MEI',
      incomeValue: data.incomeValue,
      phone: data.phone.replace(/\D/g, ''),
      mobilePhone: data.phone.replace(/\D/g, ''),
      postalCode: data.postalCode.replace(/\D/g, ''),
      address: data.address,
      addressNumber: data.addressNumber,
      province: data.province || 'Centro',
      state: data.state,
      country: 'BR'
    };

    console.log('[ONBOARD] Payload enviando ao Asaas:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/accounts`,
      payload,
      { headers: { 'access_token': ASAAS_CONFIG.apiKey } }
    );

    const asaasAccount = response.data;
    
    await db.collection('users').doc(auth.uid).set({
      finance: {
        asaasAccountId: asaasAccount.id,
        asaasWalletId: asaasAccount.walletId || asaasAccount.id,
        asaasApiKey: asaasAccount.apiKey || null,
        status: 'active',
        onboardedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true });

    return { success: true, accountId: asaasAccount.id };

  } catch (error: any) {
    console.error('[ONBOARD ERROR]', error.response?.data || error.message);
    
    // Melhora a mensagem de erro para o frontend
    const apiError = error.response?.data?.errors?.[0]?.description;
    
    if (apiError === 'É necessário informar a cidade.') {
       throw new functions.https.HttpsError('invalid-argument', 'CEP inválido ou não encontrado na base do Asaas. Verifique o CEP.');
    }

    const errorMessage = apiError || error.message || 'Erro ao criar conta financeira';
    throw new functions.https.HttpsError('internal', errorMessage);
  }
});

// ADICIONE ISTO NO FINAL DO ARQUIVO:

export const financeUnlinkAccount = functions.https.onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new functions.https.HttpsError('unauthenticated', 'Login necessário');

  try {
    // Remove o objeto 'finance' do usuário.
    // Isso NÃO apaga a conta no Asaas (para manter histórico fiscal), 
    // mas desvincula do painel para permitir criar outra.
    await db.collection('users').doc(auth.uid).update({
      finance: admin.firestore.FieldValue.delete()
    });

    return { success: true, message: 'Conta desvinculada com sucesso.' };
  } catch (error: any) {
    console.error('[UNLINK ERROR]', error);
    throw new functions.https.HttpsError('internal', 'Erro ao desvincular conta.');
  }
});

// LINK EXISTING ACCOUNT
interface LinkAccountRequest {
  apiKey: string;
}

export const financeLinkExistingAccount = functions.https.onCall(async (request) => {
  const data = request.data as LinkAccountRequest;
  const auth = request.auth;

  if (!auth) throw new functions.https.HttpsError('unauthenticated', 'Login necessário');
  if (!data.apiKey || !data.apiKey.startsWith('$')) {
    throw new functions.https.HttpsError('invalid-argument', 'Chave de API inválida (deve começar com $).');
  }

  try {
    console.log(`[LINK] Tentando vincular conta para usuário ${auth.uid}...`);

    // 1. Testa a chave consultando os dados da conta comercial
    // GET /api/v3/myAccount
    const response = await axios.get(
      `${ASAAS_CONFIG.baseUrl}/myAccount`,
      { headers: { 'access_token': data.apiKey } }
    );

    const accountData = response.data;
    const walletId = accountData.walletId || accountData.id; // Fallback

    // 2. Salva no Firestore
    // Marcamos documentos como 'true' pois se a conta já existe, assumimos que já enviou docs pro Asaas
    await db.collection('users').doc(auth.uid).set({
      finance: {
        asaasAccountId: accountData.id,
        asaasWalletId: walletId,
        asaasApiKey: data.apiKey,
        status: 'active',
        onboardedAt: admin.firestore.FieldValue.serverTimestamp(),
        linkedExisting: true, // Flag para saber que foi vinculada
        documents: {
          docIdSent: true,
          docSelfieSent: true,
          lastUpdate: admin.firestore.FieldValue.serverTimestamp()
        }
      }
    }, { merge: true });

    return { 
      success: true, 
      accountId: accountData.id,
      tradingName: accountData.tradingName || accountData.companyName
    };

  } catch (error: any) {
    console.error('[LINK ERROR]', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
       throw new functions.https.HttpsError('permission-denied', 'Chave de API incorreta ou revogada.');
    }

    throw new functions.https.HttpsError('internal', 'Erro ao vincular conta. Verifique a chave.');
  }
});
