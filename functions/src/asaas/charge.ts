import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { ASAAS_CONFIG, calculateEmprataFee } from './constants';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

interface ChargeRequest {
  orderId: string;
  amount: number;
  billingType: 'PIX' | 'CREDIT_CARD';
  customerData: {
    name: string;
    cpfCnpj: string;
    email?: string;
    phone?: string;
  };
  restaurantId: string; // ID do dono do prato (para Split)
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolder?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

export const financeCharge = functions.https.onCall(async (request) => {
  const data = request.data as ChargeRequest;
  const auth = request.auth;

  // 1. Validação de Auth
  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login necessário para checkout.');
  }

  // 2. Validação de Campos
  if (!data.orderId || !data.amount || !data.restaurantId) {
    throw new functions.https.HttpsError('invalid-argument', 'Dados do pedido incompletos (ID, Valor ou Restaurante faltando).');
  }

  try {
    // 3. Busca dados do Restaurante para o Split
    const restaurantDoc = await db.collection('users').doc(data.restaurantId).get();
    
    if (!restaurantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Restaurante não encontrado.');
    }

    const restaurantData = restaurantDoc.data();
    const walletId = restaurantData?.finance?.asaasWalletId;

    if (!walletId) {
      throw new functions.https.HttpsError('failed-precondition', 'Este restaurante ainda não ativou a conta financeira.');
    }

    // 4. Calcula Taxas
    // Se o restaurante não tiver plano definido, assume 'free'
    const plan = restaurantData?.plan || 'free'; 
    const { emprataFee, restaurantAmount } = calculateEmprataFee(data.amount, plan);

    console.log(`[CHARGE] Pedido ${data.orderId} | Total: ${data.amount} | Split Restaurante: ${restaurantAmount} (Wallet: ${walletId})`);

    // 5. Prepara Payload do Asaas
    const payload: any = {
      customer: await getOrCreateCustomer(data.customerData),
      billingType: data.billingType,
      value: data.amount,
      dueDate: new Date().toISOString().split('T')[0], // Vence hoje
      description: `Pedido #${data.orderId.slice(0, 8)} - EmprataAI`,
      externalReference: data.orderId,
      // O SPLIT É O SEGREDO DO MARKETPLACE
      split: [
        {
          walletId: walletId,
          fixedValue: restaurantAmount, // O restaurante recebe o valor já descontada a taxa da Emprata
          percentualValue: undefined // Garantindo que não envie porcentagem
        }
      ],
      postalService: false
    };

    // Se for Cartão, adiciona dados
    if (data.billingType === 'CREDIT_CARD') {
      if (!data.creditCard || !data.creditCardHolder) {
        throw new functions.https.HttpsError('invalid-argument', 'Dados do cartão incompletos.');
      }
      payload.creditCard = data.creditCard;
      payload.creditCardHolderInfo = data.creditCardHolder;
    }

    // 6. Envia para o Asaas
    const response = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/payments`,
      payload,
      { headers: { 'access_token': ASAAS_CONFIG.apiKey } }
    );

    const payment = response.data;

    // Se for Pix, busca o QRCode imediatamente
    let pixData = null;
    if (data.billingType === 'PIX') {
       const qrResponse = await axios.get(
         `${ASAAS_CONFIG.baseUrl}/payments/${payment.id}/pixQrCode`,
         { headers: { 'access_token': ASAAS_CONFIG.apiKey } }
       );
       pixData = qrResponse.data;
    }

    // 7. Atualiza o Pedido no Firestore
    await db.collection('orders').doc(data.orderId).update({
      paymentId: payment.id,
      paymentStatus: 'pending',
      paymentMethod: data.billingType,
      paymentUrl: payment.invoiceUrl, // Link da Fatura
      pixCode: pixData?.payload || null,
      pixImage: pixData?.encodedImage || null,
      financial: {
         total: data.amount,
         platformFee: emprataFee,
         restaurantReceive: restaurantAmount
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      paymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,
      pixCode: pixData?.payload,
      pixImage: pixData?.encodedImage
    };

  } catch (error: any) {
    console.error('[CHARGE ERROR]', error.response?.data || error);
    const msg = error.response?.data?.errors?.[0]?.description || error.message || 'Erro no processamento do pagamento.';
    throw new functions.https.HttpsError('internal', msg);
  }
});

// Função auxiliar para não duplicar clientes no Asaas
async function getOrCreateCustomer(customerData: any) {
  // Simplificação: Busca pelo CPF/CNPJ direto na API do Asaas
  // Em produção, ideal salvar o ID do customer no perfil do usuário do app
  try {
     const cleanCpf = customerData.cpfCnpj.replace(/\D/g, '');
     
     // 1. Tenta buscar
     const search = await axios.get(
       `${ASAAS_CONFIG.baseUrl}/customers?cpfCnpj=${cleanCpf}`,
       { headers: { 'access_token': ASAAS_CONFIG.apiKey } }
     );

     if (search.data.data && search.data.data.length > 0) {
       return search.data.data[0].id;
     }

     // 2. Se não achar, cria
     const create = await axios.post(
       `${ASAAS_CONFIG.baseUrl}/customers`,
       {
         name: customerData.name,
         cpfCnpj: cleanCpf,
         email: customerData.email || `cliente_${cleanCpf}@emprata.ai`,
         mobilePhone: customerData.phone
       },
       { headers: { 'access_token': ASAAS_CONFIG.apiKey } }
     );
     
     return create.data.id;

  } catch (e) {
    console.error('Erro ao gerenciar cliente Asaas:', e);
    throw new functions.https.HttpsError('internal', 'Erro no cadastro do cliente financeiro.');
  }
}
