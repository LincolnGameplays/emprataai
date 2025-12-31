
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import axios from 'axios';
import { 
  normalizeiFoodOrder, 
  normalizeRappiOrder, 
  normalizeUberEatsOrder 
} from './adapters';

// --- CORREÇÃO DE INICIALIZAÇÃO ---
// Garante que o Admin SDK esteja iniciado antes de chamar firestore()
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Variáveis de Ambiente
const UBER_TOKEN = process.env.UBER_EATS_TOKEN;
const WEBHOOK_SECRETS: Record<string, string | undefined> = {
  IFOOD: process.env.IFOOD_WEBHOOK_SECRET,
  RAPPI: process.env.RAPPI_WEBHOOK_SECRET,
  UBER_EATS: process.env.UBER_WEBHOOK_SECRET,
};

function validateSignature(
  source: string,
  payload: string,
  signature: string
): boolean {
  const secret = WEBHOOK_SECRETS[source];
  if (!secret) return true; // Aceita se não tiver segredo (Teste)
  if (!signature) return false; // Rejeita se tiver segredo mas não assinatura

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

export const deliveryHubWebhook = onRequest(async (req, res) => {
  const source = (req.query.source as string)?.toUpperCase();
  const restaurantId = req.query.rid as string;
  const signature = req.headers['x-signature'] as string || '';

  console.log(`[HUB] Recebido evento de ${source}`);

  // Validação de segurança (Apenas loga aviso por enquanto)
  if (req.rawBody && !validateSignature(source, req.rawBody.toString(), signature)) {
      console.warn(`[HUB SECURITY] Assinatura inválida para ${source}`);
  }

  try {
    let orderData = null;

    // --- PROTEÇÃO CONTRA PAYLOAD VAZIO ---
    if (!req.body) {
       console.error('[HUB] Body vazio');
       res.status(400).send('Empty body');
       return;
    }

    switch (source) {
        case 'IFOOD':
            // Verifica se o evento é de novo pedido
            if (req.body.code === 'PLACED' || req.body.code === 'CONCLUDED') {
                if (req.body.data) {
                    orderData = normalizeiFoodOrder(req.body.data, restaurantId);
                } else {
                    console.warn('[HUB] iFood PLACED sem dados:', req.body);
                }
            }
            break;

        case 'RAPPI':
            if (req.body.type === 'order_created') {
                orderData = normalizeRappiOrder(req.body.payload, restaurantId);
            }
            break;

        case 'UBER_EATS':
            if (req.body.event_type === 'orders.notification') {
                const resourceUrl = req.body.resource_href; 
                if (resourceUrl && UBER_TOKEN) {
                    const uberRes = await axios.get(resourceUrl, {
                        headers: { 'Authorization': `Bearer ${UBER_TOKEN}` }
                    });
                    orderData = normalizeUberEatsOrder(uberRes.data, restaurantId);
                }
            }
            break;
            
        case '99FOOD':
            if (req.body.status === 1) { 
                console.log('[HUB] 99Food recebido (adapter pendente)');
            }
            break;
            
        default:
            console.warn(`Fonte desconhecida: ${source}`);
    }

    if (orderData) {
        // Usa ID externo como chave para evitar duplicidade
        await db.collection('orders').doc(orderData.externalId).set({
            ...orderData,
            integrated: true,
            integrationTime: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`[HUB] ✅ Pedido ${orderData.externalId} salvo com sucesso!`);
    }

    // Responde 200 OK (Texto simples é mais seguro para webhooks universais)
    res.status(200).send('OK');

  } catch (error) {
    console.error('[HUB CRITICAL ERROR]', error);
    // Retorna 200 mesmo com erro para o iFood não ficar tentando reenviar infinitamente se for erro de lógica
    // Mas loga o erro no console do Firebase para você ver
    res.status(500).send('Server Error');
  }
});
