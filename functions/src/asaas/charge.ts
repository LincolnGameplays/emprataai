import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import {ASAAS_CONFIG} from "./constants";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

interface ChargeRequest {
  orderId: string;
  amount: number;
  billingType: "PIX" | "CREDIT_CARD";
  customerData: {
    name: string;
    cpfCnpj: string;
  };
  restaurantId: string;
}

export const financeCharge = onCall(async (request) => {
  const data = request.data as ChargeRequest;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");

  // 1. Validação Básica (Sem exigir Asaas Wallet ID - Modelo Agregador)
  const restaurantDoc = await db.collection("users").doc(data.restaurantId).get();
  if (!restaurantDoc.exists) {
    throw new HttpsError("not-found", "Restaurante não encontrado.");
  }

  // NÃO VERIFICAMOS MAIS O asaasWalletId POIS É MODELO AGREGADOR
  // O dinheiro cai na conta dona da API Key (Sua conta Mestra)
  // O Webhook cuida de dar o saldo virtual para o restaurante

  try {
    // 2. Busca/Criação do Cliente
    const customerPayload = {
      name: data.customerData.name,
      cpfCnpj: data.customerData.cpfCnpj,
    };

    const customerSearch = await axios.get(
      `${ASAAS_CONFIG.baseUrl}/customers?cpfCnpj=${data.customerData.cpfCnpj}`,
      {headers: {access_token: ASAAS_CONFIG.apiKey}}
    );

    let customerId;
    if (customerSearch.data.data?.length > 0) {
      customerId = customerSearch.data.data[0].id;
    } else {
      const newCustomer = await axios.post(
        `${ASAAS_CONFIG.baseUrl}/customers`,
        customerPayload,
        {headers: {access_token: ASAAS_CONFIG.apiKey}}
      );
      customerId = newCustomer.data.id;
    }

    // 3. COBRANÇA SIMPLIFICADA (SEM SPLIT)
    // O dinheiro cai na conta dona da API Key (Sua conta Mestra)
    const paymentPayload = {
      customer: customerId,
      billingType: data.billingType,
      value: data.amount,
      dueDate: new Date().toISOString().split("T")[0],
      description: `Pedido ${data.orderId}`,
      externalReference: data.orderId,
      // split: [...] <--- REMOVIDO: O dinheiro entra todo pra você, o Webhook calcula o repasse.
    };

    const paymentRes = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/payments`,
      paymentPayload,
      {headers: {access_token: ASAAS_CONFIG.apiKey}}
    );

    const payment = paymentRes.data;

    // 4. Pix QrCode
    let pixData = null;
    if (data.billingType === "PIX") {
      const qrRes = await axios.get(
        `${ASAAS_CONFIG.baseUrl}/payments/${payment.id}/pixQrCode`,
        {headers: {access_token: ASAAS_CONFIG.apiKey}}
      );
      pixData = qrRes.data;
    }

    return {
      success: true,
      paymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,
      pixCode: pixData?.payload || null,
      pixImage: pixData?.encodedImage || null,
    };
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error("[CHARGE ERROR]", err.response?.data || err);
    // Retorna erro específico do Asaas se disponível
    const msg = err.response?.data?.errors?.[0]?.description ||
                err.response?.data?.message ||
                "Falha ao processar transação financeira.";
    throw new HttpsError("internal", msg);
  }
});
