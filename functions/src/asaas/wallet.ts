import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import {ASAAS_CONFIG} from "./constants";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Taxa fixa de saque (Cobre o custo do Pix Asaas + seu lucro)
const WITHDRAW_FEE = 5.00;

// ==================================================================
// 1. VER SALDO (Leitura Segura)
// ==================================================================
export const financeGetBalance = onCall(async (request) => {
  // SEGURANÇA 1: Requer autenticação
  const auth = request.auth;
  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");

  try {
    // SEGURANÇA 2: Busca dados APENAS do ID logado (auth.uid)
    // Impossível ler saldo de outro usuário
    const userDoc = await db.collection("users").doc(auth.uid).get();
    const userData = userDoc.data();

    const available = userData?.wallet?.balance || 0;
    const pixKey = userData?.finance?.withdrawTarget?.pixKey;

    // Verifica trava de segurança (Troca de chave recente)
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

    return {
      available,
      withdrawFee: WITHDRAW_FEE,
      hasWithdrawAccount: !!pixKey,
      pixKey: pixKey || null,
      isLocked,
      hoursUntilUnlock,
    };
  } catch (error) {
    console.error(error);
    throw new HttpsError("internal", "Erro ao buscar saldo.");
  }
});

// ==================================================================
// 2. REALIZAR SAQUE (Transação Blindada)
// ==================================================================
export const financeWithdraw = onCall(async (request) => {
  const data = request.data as { amount: number };
  const auth = request.auth;

  // SEGURANÇA 1: Autenticação
  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");

  // SEGURANÇA 2: Referência forçada ao próprio usuário
  const userRef = db.collection("users").doc(auth.uid);

  // SEGURANÇA 3: Atomicidade (Transação do Banco de Dados)
  // Nada entra ou sai enquanto isso roda. Evita "duplo clique".
  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const userData = userDoc.data();

    if (!userData) throw new HttpsError("not-found", "Usuário inválido");

    const currentBalance = userData.wallet?.balance || 0;
    const withdrawTarget = userData.finance?.withdrawTarget;

    // Validação: Tem chave Pix?
    if (!withdrawTarget?.pixKey) {
      throw new HttpsError("failed-precondition", "Chave Pix não configurada.");
    }

    // Validação: Trava de 24h ativa?
    if (userData.finance?.securityLockUntil) {
      const lockDate = userData.finance.securityLockUntil.toDate();
      if (new Date() < lockDate) {
        throw new HttpsError(
          "permission-denied",
          "Saque bloqueado por segurança (Alteração recente de chave)."
        );
      }
    }

    // Validação: Tem saldo suficiente?
    const totalDebit = data.amount + WITHDRAW_FEE;
    if (currentBalance < totalDebit) {
      throw new HttpsError(
        "failed-precondition",
        `Saldo insuficiente. Necessário: R$ ${totalDebit.toFixed(2)}`
      );
    }

    // === AÇÃO DE RISCO: Transferir Dinheiro Real ===
    // Usamos a chave Mestra da Plataforma para enviar o Pix
    let transferId;
    try {
      const transferPayload = {
        value: data.amount, // Valor líquido para o cliente
        operationType: "PIX",
        pixAddressKey: withdrawTarget.pixKey,
        pixAddressKeyType: withdrawTarget.pixKeyType,
        description: "Saque Plataforma",
      };

      const response = await axios.post(
        `${ASAAS_CONFIG.baseUrl}/transfers`,
        transferPayload,
        {headers: {access_token: ASAAS_CONFIG.apiKey}} // <--- Chave Mestra
      );
      transferId = response.data.id;
    } catch (apiError: any) {
      console.error("Erro Asaas:", apiError.response?.data);
      const msg = apiError.response?.data?.errors?.[0]?.description || "Erro na transferência bancária.";
      throw new HttpsError("internal", msg);
    }

    // === ATUALIZAÇÃO SEGURA DO SALDO ===
    // Se chegou aqui, o dinheiro saiu da conta. Precisamos descontar agora.
    const newBalance = parseFloat((currentBalance - totalDebit).toFixed(2));

    transaction.update(userRef, {
      "wallet.balance": newBalance,
      "wallet.lastWithdraw": admin.firestore.FieldValue.serverTimestamp(),
    });

    // Cria registro imutável no extrato
    const statementRef = userRef.collection("finance_statement").doc();
    transaction.set(statementRef, {
      type: "WITHDRAW",
      amount: totalDebit, // Valor total debitado (Saque + Taxa)
      netValue: data.amount,
      fee: WITHDRAW_FEE,
      target: withdrawTarget.pixKey,
      asaasTransferId: transferId,
      description: "Saque Pix Realizado",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return {success: true, message: "Saque realizado com sucesso!"};
});

// ==================================================================
// 3. EXTRATO (Leitura Segura)
// ==================================================================
export const financeGetStatement = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");

  try {
    const snapshot = await db
      .collection("users")
      .doc(auth.uid)
      .collection("finance_statement")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const data = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        type: d.type,
        value: d.amount,
        description: d.description,
        date: d.createdAt?.toDate()?.toLocaleDateString("pt-BR") || "",
      };
    });

    return {data};
  } catch (error) {
    throw new HttpsError("internal", "Erro ao buscar extrato.");
  }
});
