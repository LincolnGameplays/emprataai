// ✅ IMPORTAÇÃO V2 CORRETA
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import {ASAAS_CONFIG} from "./constants";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

interface OnboardRequest {
  name: string;
  email: string;
  cpfCnpj: string;
  birthDate?: string;
  companyType: string;
  incomeValue: number;
  phone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  province: string;
  city: string;
  state: string;
}

interface LinkAccountRequest {
  apiKey: string;
}

// ✅ Usamos 'onCall' direto (V2)
export const financeOnboard = onCall(async (request) => {
  const data = request.data as OnboardRequest;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "User must be logged in");

  const required = [
    "name", "email", "cpfCnpj", "phone", "postalCode",
    "address", "addressNumber", "incomeValue",
  ];

  for (const field of required) {
    if (!data[field as keyof OnboardRequest]) {
      throw new HttpsError("invalid-argument", `Campo obrigatório faltando: ${field}`);
    }
  }

  try {
    const payload = {
      name: data.name,
      email: data.email,
      loginEmail: data.email,
      cpfCnpj: data.cpfCnpj.replace(/\D/g, ""),
      birthDate: data.birthDate,
      companyType: data.companyType || "MEI",
      incomeValue: data.incomeValue,
      phone: data.phone.replace(/\D/g, ""),
      mobilePhone: data.phone.replace(/\D/g, ""),
      postalCode: data.postalCode.replace(/\D/g, ""),
      address: data.address,
      addressNumber: data.addressNumber,
      province: data.province || "Centro",
      state: data.state,
      country: "BR",
    };

    console.log("[ONBOARD] Payload enviando ao Asaas:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/accounts`,
      payload,
      {headers: {"access_token": ASAAS_CONFIG.apiKey}}
    );

    const asaasAccount = response.data;

    await db.collection("users").doc(auth.uid).set({
      finance: {
        asaasAccountId: asaasAccount.id,
        asaasWalletId: asaasAccount.walletId || asaasAccount.id,
        asaasApiKey: asaasAccount.apiKey || null,
        status: "active",
        onboardedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    }, {merge: true});

    return {success: true, accountId: asaasAccount.id};
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error("[ONBOARD ERROR]", err.response?.data || err.message);
    const apiError = err.response?.data?.errors?.[0]?.description;
    const errorMessage = apiError || err.message || "Erro ao criar conta financeira";
    throw new HttpsError("internal", errorMessage);
  }
});

export const financeUnlinkAccount = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");

  try {
    await db.collection("users").doc(auth.uid).update({
      finance: admin.firestore.FieldValue.delete(),
    });
    return {success: true, message: "Conta desvinculada com sucesso."};
  } catch (error: unknown) {
    console.error("[UNLINK ERROR]", error);
    throw new HttpsError("internal", "Erro ao desvincular conta.");
  }
});

export const financeLinkExistingAccount = onCall(async (request) => {
  const data = request.data as LinkAccountRequest;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");

  if (!data.apiKey || !data.apiKey.trim().startsWith("$")) {
    throw new HttpsError(
      "invalid-argument",
      "Chave de API inválida (deve começar com $)."
    );
  }

  try {
    console.log(`[LINK] Tentando vincular conta para usuário ${auth.uid}...`);

    const response = await axios.get(
      `${ASAAS_CONFIG.baseUrl}/myAccount`,
      {headers: {"access_token": data.apiKey.trim()}}
    );

    const accountData = response.data;
    const walletId = accountData.walletId || accountData.id;

    await db.collection("users").doc(auth.uid).set({
      finance: {
        asaasAccountId: accountData.id,
        asaasWalletId: walletId,
        asaasApiKey: data.apiKey.trim(),
        status: "active",
        onboardedAt: admin.firestore.FieldValue.serverTimestamp(),
        linkedExisting: true,
        documents: {
          docIdSent: true,
          docSelfieSent: true,
          lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
    }, {merge: true});

    return {
      success: true,
      accountId: accountData.id,
      tradingName: accountData.tradingName || accountData.companyName,
    };
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error("[LINK ERROR]", err.response?.data || err.message);

    if (err.response?.status === 401) {
      throw new HttpsError("permission-denied", "Chave de API incorreta ou revogada.");
    }
    throw new HttpsError("internal", "Erro ao vincular conta. Verifique a chave.");
  }
});
