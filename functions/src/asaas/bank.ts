import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

interface BankInfoRequest {
  pixKey: string;
  pixKeyType: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP";
}

/**
 * Salva os dados bancários/Pix do usuário para saques futuros.
 * Aplica TRAVA DE SEGURANÇA DE 24H quando a chave é alterada.
 */
export const saveWithdrawAccount = onCall(async (request) => {
  const data = request.data as BankInfoRequest;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");
  if (!data.pixKey || !data.pixKeyType) {
    throw new HttpsError("invalid-argument", "Chave Pix inválida.");
  }

  try {
    const userRef = db.collection("users").doc(auth.uid);
    const userDoc = await userRef.get();
    const currentData = userDoc.data();

    // Verifica se houve mudança real na chave
    const currentKey = currentData?.finance?.withdrawTarget?.pixKey;
    const isNewKey = currentKey !== data.pixKey;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      "finance.withdrawTarget": {
        pixKey: data.pixKey,
        pixKeyType: data.pixKeyType,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    };

    let message = "Dados salvos com sucesso.";
    let locked = false;

    if (isNewKey) {
      // === TRAVA DE SEGURANÇA 24H ===
      const lockUntil = admin.firestore.Timestamp.fromMillis(Date.now() + 86400000); // 24h
      updateData["finance.securityLockUntil"] = lockUntil;

      message = "Dados atualizados. Por segurança, novos saques estão bloqueados por 24 horas.";
      locked = true;

      // Log de Auditoria de Segurança
      await userRef.collection("security_logs").add({
        event: "PIX_KEY_CHANGED",
        oldKeyMasked: currentKey ? "***" + currentKey.slice(-4) : null,
        newKeyMasked: "***" + data.pixKey.slice(-4),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notificação de Segurança
      await userRef.collection("notifications").add({
        type: "SECURITY_ALERT",
        title: "Chave Pix Alterada",
        body: "Sua chave Pix de saque foi alterada. Saques bloqueados por 24h por segurança.",
        date: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });
    }

    await userRef.update(updateData);

    return {success: true, message, locked};
  } catch (error) {
    console.error("[BANK SAVE ERROR]", error);
    throw new HttpsError("internal", "Erro ao salvar conta.");
  }
});

/**
 * Busca os dados bancários salvos do usuário.
 */
export const getWithdrawAccount = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");

  const userDoc = await db.collection("users").doc(auth.uid).get();
  const userData = userDoc.data();
  const withdrawTarget = userData?.finance?.withdrawTarget;
  const securityLock = userData?.finance?.securityLockUntil;

  // Calcula se está bloqueado
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
    exists: !!withdrawTarget,
    data: withdrawTarget || null,
    isLocked,
    hoursUntilUnlock,
  };
});
