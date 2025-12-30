import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { ASAAS_CONFIG } from './constants';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Taxa de transferência Pix do Asaas
const TRANSFER_FEE = 5.00;

// === APRIMORAMENTO: Dashboard Financeiro Completo ===
export const financeGetBalance = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError('unauthenticated', 'Login necessário');

  try {
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const userData = userDoc.data();
    
    // Prioriza chave própria, senão usa a mestra (fallback para subcontas)
    const apiKey = userData?.finance?.asaasApiKey || ASAAS_CONFIG.apiKey;
    const headers = { access_token: apiKey };

    // Verifica se tem trava de segurança ativa
    const securityLock = userData?.finance?.securityLockUntil;
    let isLocked = false;
    let hoursUntilUnlock = 0;

    if (securityLock) {
      const lockDate = securityLock.toDate();
      const now = new Date();
      if (now < lockDate) {
        isLocked = true;
        hoursUntilUnlock = Math.ceil((lockDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      }
    }

    // 1. Busca Saldo Disponível (Líquido)
    const balanceReq = axios.get(`${ASAAS_CONFIG.baseUrl}/finance/balance`, { headers });

    // 2. Busca estatísticas de pagamentos para calcular "A Receber"
    const statsReq = axios.get(`${ASAAS_CONFIG.baseUrl}/finance/payment/statistics`, { 
      headers,
      params: { status: 'CONFIRMED', billingType: 'CREDIT_CARD' }
    }).catch(() => ({ data: { netValue: 0 } })); // Fallback se endpoint não existir

    const [balanceRes, statsRes] = await Promise.all([balanceReq, statsReq]);

    return {
      available: balanceRes.data.balance,           // Pode sacar AGORA
      toReceive: statsRes.data.netValue || 0,       // Vendas no crédito aguardando liberação
      pending: 0,
      withdrawFee: TRANSFER_FEE,
      hasWithdrawAccount: !!userData?.finance?.withdrawTarget,
      
      // Info de Segurança
      isLocked,
      hoursUntilUnlock
    };

  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('[BALANCE ERROR]', err.response?.data || err);
    return { available: 0, toReceive: 0, pending: 0, withdrawFee: TRANSFER_FEE, error: 'Erro ao carregar saldo' };
  }
});

/**
 * Busca o extrato financeiro detalhado do Asaas.
 */
export const financeGetStatement = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError('unauthenticated', 'Login necessário');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { limit = 10, offset = 0 } = request.data as any;

  try {
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const apiKey = userDoc.data()?.finance?.asaasApiKey;

    if (!apiKey) throw new HttpsError('failed-precondition', 'Conta não vinculada.');

    const response = await axios.get(
      `${ASAAS_CONFIG.baseUrl}/financialTransactions`,
      { headers: { access_token: apiKey }, params: { limit, offset } }
    );

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: response.data.data.map((item: any) => ({
        id: item.id,
        value: item.value,
        balance: item.balance,
        type: item.type,
        date: item.date,
        description: item.description
      })),
      hasMore: response.data.hasMore
    };

  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('[STATEMENT ERROR]', err);
    throw new HttpsError('internal', 'Erro ao buscar extrato.');
  }
});

interface WithdrawRequest {
  amount: number;
}

/**
 * Realiza um saque via Pix para a conta bancária cadastrada.
 * Inclui verificação de trava de segurança de 24h.
 */
export const financeWithdraw = onCall(async (request) => {
  const data = request.data as WithdrawRequest;
  const auth = request.auth;

  if (!auth) throw new HttpsError('unauthenticated', 'Login necessário');

  try {
    const userRef = db.collection('users').doc(auth.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    const apiKey = userData?.finance?.asaasApiKey;
    const withdrawTarget = userData?.finance?.withdrawTarget;

    // === TRAVA DE SEGURANÇA 24H ===
    const securityLock = userData?.finance?.securityLockUntil;
    
    if (securityLock) {
      const lockDate = securityLock.toDate();
      const now = new Date();
      
      if (now < lockDate) {
        const hoursLeft = Math.ceil((lockDate.getTime() - now.getTime()) / (1000 * 60 * 60));
        throw new HttpsError(
          'permission-denied', 
          `Saque bloqueado por segurança (Alteração de Chave Pix). Tente em ${hoursLeft} horas.`
        );
      }
    }
    // ==============================

    // Validações
    if (!apiKey) {
       throw new HttpsError('failed-precondition', 'Conta financeira não ativa.');
    }
    if (!withdrawTarget || !withdrawTarget.pixKey) {
       throw new HttpsError('failed-precondition', 'Configure sua conta de recebimento antes de sacar.');
    }

    // Verifica Saldo em tempo real
    const balanceRes = await axios.get(
      `${ASAAS_CONFIG.baseUrl}/finance/balance`, 
      { headers: { access_token: apiKey } }
    );
    const available = balanceRes.data.balance;

    if (available < (data.amount + TRANSFER_FEE)) {
      throw new HttpsError(
        'failed-precondition', 
        `Saldo insuficiente. Taxa de saque: R$ ${TRANSFER_FEE.toFixed(2)}`
      );
    }

    // Executa a Transferência Pix Externa
    const transferPayload = {
       value: data.amount,
       operationType: 'PIX',
       pixAddressKey: withdrawTarget.pixKey,
       pixAddressKeyType: withdrawTarget.pixKeyType,
       description: 'Saque EmprataAI'
    };

    const response = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/transfers`, 
      transferPayload, 
      { headers: { access_token: apiKey } }
    );

    // Registra no Histórico
    await userRef.collection('transactions').add({
      type: 'withdraw_out',
      amount: data.amount,
      fee: TRANSFER_FEE,
      target: withdrawTarget.pixKey,
      status: 'processing',
      asaasId: response.data.id,
      date: admin.firestore.FieldValue.serverTimestamp()
    });

    // === NOTIFICAÇÃO DE SEGURANÇA ===
    const maskedKey = '***' + withdrawTarget.pixKey.slice(-4);
    await userRef.collection('notifications').add({
      type: 'WITHDRAW_REQUESTED',
      title: 'Saque Realizado',
      body: `Saque de R$ ${data.amount.toFixed(2)} enviado para Pix ${maskedKey}.`,
      amount: data.amount,
      date: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    // ================================

    return { 
      success: true, 
      transferId: response.data.id,
      message: `Saque de R$ ${data.amount.toFixed(2)} solicitado!`,
      fee: TRANSFER_FEE
    };

  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('[WITHDRAW ERROR]', err.response?.data || err);
    const msg = err.response?.data?.errors?.[0]?.description || err.message || 'Erro ao processar saque.';
    throw new HttpsError('internal', msg);
  }
});
