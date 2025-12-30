import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { ASAAS_CONFIG } from './constants';

const db = admin.firestore();

// 1. CONSULTAR SALDO EM TEMPO REAL
export const financeGetBalance = functions.https.onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new functions.https.HttpsError('unauthenticated', 'Login necessário');

  try {
    // Busca a API Key da Subconta no Firestore
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const userData = userDoc.data();
    const subAccountApiKey = userData?.finance?.asaasApiKey;
    
    // REMOVIDO: const walletId = ... (não estava sendo usado e causava erro)

    if (!subAccountApiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'Conta financeira não configurada ou pendente.');
    }

    // Chama o Asaas usando a chave DA SUBCONTA
    const response = await axios.get(
      `${ASAAS_CONFIG.baseUrl}/finance/balance`,
      { 
        headers: { 'access_token': subAccountApiKey } 
      }
    );

    return {
      success: true,
      balance: response.data.balance, // Saldo disponível
      pending: response.data.confirmed, // Saldo futuro
      currency: 'BRL'
    };

  } catch (error: any) {
    console.error('[BALANCE ERROR]', error.response?.data || error);
    throw new functions.https.HttpsError('internal', 'Erro ao consultar saldo.');
  }
});

// 2. REALIZAR SAQUE (TRANSFERÊNCIA PIX)
interface WithdrawRequest {
  amount: number;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';
}

export const financeWithdraw = functions.https.onCall(async (request) => {
  const data = request.data as WithdrawRequest;
  const auth = request.auth;

  if (!auth) throw new functions.https.HttpsError('unauthenticated', 'Login necessário');

  if (data.amount <= 0) throw new functions.https.HttpsError('invalid-argument', 'Valor inválido');

  try {
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const subAccountApiKey = userDoc.data()?.finance?.asaasApiKey;

    if (!subAccountApiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'Conta não configurada.');
    }

    // 1. Inicia a transferência (Pix)
    const response = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/transfers`, 
      {
        value: data.amount,
        operationType: 'PIX',
        pixAddressKey: data.pixKey,
        pixAddressKeyType: data.pixKeyType,
        description: 'Saque EmprataAI',
        scheduleDate: null // Envia agora
      },
      { headers: { 'access_token': subAccountApiKey } }
    );

    const transfer = response.data;

    // 2. Registra no Firestore para histórico
    await db.collection('users').doc(auth.uid).collection('transactions').add({
      type: 'withdraw',
      amount: data.amount,
      status: transfer.status,
      asaasId: transfer.id,
      date: admin.firestore.FieldValue.serverTimestamp(),
      pixKey: data.pixKey
    });

    return {
      success: true,
      transferId: transfer.id,
      status: transfer.status,
      message: 'Saque solicitado com sucesso!'
    };

  } catch (error: any) {
    console.error('[WITHDRAW ERROR]', error.response?.data || error);
    
    const code = error.response?.data?.errors?.[0]?.code;
    if (code === 'INSUFFICIENT_FUNDS') {
        throw new functions.https.HttpsError('failed-precondition', 'Saldo insuficiente para realizar o saque.');
    }

    throw new functions.https.HttpsError('internal', 'Erro ao processar saque. Verifique a chave Pix.');
  }
});
