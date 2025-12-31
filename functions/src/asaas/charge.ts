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
    phone?: string;
  };
  restaurantId: string;
  card?: {
    holder: string;
    number: string;
    expiry: string;
    cvv: string;
  };
}

export const financeCharge = onCall(async (request) => {
  const data = request.data as ChargeRequest;
  const auth = request.auth;

  // 1. Segurança: Usuário precisa estar logado
  if (!auth) throw new HttpsError("unauthenticated", "Login necessário");

  // 2. Validação: Restaurante existe?
  const restaurantDoc = await db.collection("users").doc(data.restaurantId).get();

  if (!restaurantDoc.exists) {
    throw new HttpsError("not-found", "Restaurante não encontrado.");
  }

  // NOTA: No modelo Agregador, NÃO verificamos asaasWalletId nem fazemos Split.
  // O dinheiro entra integralmente na conta da API Key (Sua conta Mestra).

  try {
    // 3. Gestão do Cliente no Asaas (Evita duplicação buscando por CPF)
    const customerPayload = {
      name: data.customerData.name,
      cpfCnpj: data.customerData.cpfCnpj,
      phone: data.customerData.phone,
    };

    let customerId;

    try {
      const customerSearch = await axios.get(
        `${ASAAS_CONFIG.baseUrl}/customers?cpfCnpj=${data.customerData.cpfCnpj}`,
        {headers: {access_token: ASAAS_CONFIG.apiKey}}
      );

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
    } catch (err) {
      console.error("Erro ao buscar/criar cliente Asaas:", err);
      throw new Error("Erro ao registrar cliente no sistema financeiro.");
    }

    // 4. Criação da Cobrança (Pix ou Cartão)
    const paymentPayload: any = {
      customer: customerId,
      billingType: data.billingType,
      value: data.amount,
      dueDate: new Date().toISOString().split("T")[0],
      description: `Pedido ${data.orderId}`,
      externalReference: data.orderId,
      remoteIp: request.rawRequest.ip, // Crucial para Antifraude do Asaas
      // split: [] <--- REMOVIDO: O dinheiro cai 100% pra você
    };

    // Adiciona dados do Cartão se for Crédito
    if (data.billingType === "CREDIT_CARD" && data.card) {
      paymentPayload.creditCard = {
        holderName: data.card.holder,
        number: data.card.number.replace(/\s/g, ""),
        expiryMonth: data.card.expiry.split("/")[0],
        expiryYear: "20" + data.card.expiry.split("/")[1],
        ccv: data.card.cvv,
      };
      
      paymentPayload.creditCardHolderInfo = {
        name: data.customerData.name,
        email: `${data.restaurantId}@emprata.ai`, // Email fake ou real do cliente
        cpfCnpj: data.customerData.cpfCnpj,
        postalCode: "00000000", // Ideal coletar endereço para evitar chargeback
        phone: data.customerData.phone || "00000000000",
      };
    }

    const paymentRes = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/payments`,
      paymentPayload,
      {headers: {access_token: ASAAS_CONFIG.apiKey}}
    );

    const payment = paymentRes.data;

    // 5. Se for PIX, recupera o QR Code / Copia e Cola
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

    // Extrai mensagem de erro detalhada do Asaas se existir
    const asaasError = err.response?.data?.errors?.[0]?.description;
    const msg = asaasError || "Falha ao processar transação financeira.";

    throw new HttpsError("internal", msg);
  }
});
