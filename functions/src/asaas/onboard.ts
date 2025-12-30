/**
 * ⚡ ASAAS ONBOARD - Subconta Creation ⚡
 * Creates a wallet/subaccount for the restaurant in Asaas
 * POST /api/finance/onboard
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { ASAAS_CONFIG } from './constants';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ══════════════════════════════════════════════════════════════════
// TYPES (Atualizado com todos os campos possíveis)
// ══════════════════════════════════════════════════════════════════

interface OnboardRequest {
  name: string;
  email: string;
  cpfCnpj: string;
  birthDate?: string; // Obrigatório para CPF/MEI (YYYY-MM-DD)
  companyType: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION' | 'UNKNOWN';
  phone: string;
  incomeValue?: number; // Renda estimada
  postalCode: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  city: string; // Se possível enviar o ID da cidade IBGE, melhor, mas nome funciona na maioria
  state: string;
}

// ══════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ══════════════════════════════════════════════════════════════════

export const financeOnboard = functions.https.onCall(async (request) => {
  const data = request.data as OnboardRequest;
  const auth = request.auth;

  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  // 1. Validação de Campos Obrigatórios
  const required = ['name', 'email', 'cpfCnpj', 'phone', 'postalCode', 'address', 'addressNumber', 'city', 'state', 'companyType'];
  
  for (const field of required) {
    if (!data[field as keyof OnboardRequest]) {
      throw new functions.https.HttpsError('invalid-argument', `Campo obrigatório faltando: ${field}`);
    }
  }

  // Validação Condicional: Nascimento é obrigatório para Pessoa Física ou MEI
  const isPerson = data.cpfCnpj.replace(/\D/g, '').length === 11;
  if ((isPerson || data.companyType === 'MEI') && !data.birthDate) {
    throw new functions.https.HttpsError('invalid-argument', 'Data de nascimento é obrigatória para CPF ou MEI.');
  }

  try {
    const uid = auth.uid;

    // 2. Prepara payload para o Asaas
    const payload = {
      name: data.name,
      email: data.email,
      loginEmail: data.email,
      cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
      birthDate: data.birthDate, // Formato esperado: 'YYYY-MM-DD'
      companyType: data.companyType || (isPerson ? 'INDIVIDUAL' : 'LIMITED'),
      phone: data.phone.replace(/\D/g, ''),
      mobilePhone: data.phone.replace(/\D/g, ''),
      incomeValue: data.incomeValue || 5000, // Valor padrão se não informado
      postalCode: data.postalCode.replace(/\D/g, ''),
      address: data.address,
      addressNumber: data.addressNumber,
      complement: data.complement || '',
      province: data.province || 'Centro',
      city: 0, // 0 para deixar o Asaas inferir pelo CEP
      state: data.state,
      country: 'BR'
    };

    console.log(`[ONBOARD] Enviando para Asaas:`, payload);

    // 3. Cria a conta
    const response = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/accounts`,
      payload,
      {
        headers: {
          'access_token': ASAAS_CONFIG.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const asaasAccount = response.data;
    
    // 4. Salva no Firestore
    await db.collection('users').doc(uid).set({
      finance: {
        asaasAccountId: asaasAccount.id,
        asaasWalletId: asaasAccount.walletId || asaasAccount.id,
        asaasApiKey: asaasAccount.apiKey || null,
        companyType: data.companyType,
        onboardedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        errors: null // Limpa erros anteriores se houver
      }
    }, { merge: true });

    return {
      success: true,
      accountId: asaasAccount.id,
      message: 'Conta ativada com sucesso!'
    };

  } catch (error: any) {
    console.error('[ASAAS ONBOARD ERROR]', error.response?.data || error.message);
    
    // Extrai mensagem amigável do Asaas
    const apiError = error.response?.data?.errors?.[0]?.description;
    const errorMessage = apiError || error.message || 'Erro ao criar conta financeira';

    throw new functions.https.HttpsError('internal', errorMessage);
  }
});
