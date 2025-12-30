import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import {ASAAS_CONFIG, calculateEmprataFee} from "./constants";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

interface ChargeRequest {
  orderId: string; // ID interno do pedido
  amount: number;
  billingType: "PIX" | "CREDIT_CARD";
  customerData: {
    name: string;
    cpfCnpj: string;
  };
  restaurantId: string; // QUEM VAI RECEBER (Crucial)
}

export const financeCharge = onCall(async (request) => {
  const data = request.data as ChargeRequest;
  const auth = request.auth;

  // 1. Segurança Básica
  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");

  // 2. BUSCA SEGURA DA WALLET (O segredo do roteamento correto)
  // Nunca confiamos se o front mandar a wallet ID. Buscamos no nosso banco.
  const restaurantDoc = await db.collection("users").doc(data.restaurantId).get();
  const restaurantData = restaurantDoc.data();

  if (!restaurantData || !restaurantData.finance?.asaasWalletId) {
    console.error(`[CRITICAL] Tentativa de cobrança para restaurante sem Wallet: ${data.restaurantId}`);
    throw new HttpsError("failed-precondition", "Erro de configuração financeira do restaurante.");
  }

  const walletIdDestino = restaurantData.finance.asaasWalletId;

  // 3. Cálculo de Taxas e Split
  const plan = restaurantData.plan || "free";
  const {restaurantAmount} = calculateEmprataFee(data.amount, plan);

  try {
    // 4. Criação/Busca do Cliente (Comprador)
    const customerPayload = {
      name: data.customerData.name,
      cpfCnpj: data.customerData.cpfCnpj,
    };

    // Otimização: Tenta buscar cliente existente para não duplicar no Asaas
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

    // 5. O PAYLOAD DE COBRANÇA (Com Idempotência via externalReference)
    const paymentPayload = {
      customer: customerId,
      billingType: data.billingType,
      value: data.amount,
      dueDate: new Date().toISOString().split("T")[0],
      description: `Pedido ${data.orderId}`,
      externalReference: data.orderId,
      split: [
        {
          walletId: walletIdDestino, // DINHEIRO VAI PARA O RESTAURANTE
          fixedValue: restaurantAmount, // Valor já descontando a taxa da Emprata
        },
        // O Restante (Taxa Emprata) sobra na conta mãe automaticamente
      ],
    };

    const paymentRes = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/payments`,
      paymentPayload,
      {headers: {access_token: ASAAS_CONFIG.apiKey}}
    );

    const payment = paymentRes.data;

    // 6. Pix QrCode (se necessário)
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
    console.error("[CHARGE CRITICAL ERROR]", err.response?.data || err);
    throw new HttpsError("internal", "Falha ao processar transação financeira.");
  }
});

export const emptyPlaceholder = () => {
  return true;
};
