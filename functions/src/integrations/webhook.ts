
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import axios from 'axios';
import { 
  normalizeiFoodOrder, 
  normalizeRappiOrder, 
  normalizeUberEatsOrder 
} from './adapters';

// Inicialização segura do Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configuração de Segredos (Variáveis de Ambiente)
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
  if (!secret) return true; // Modo teste (sem segredo configurado)
  if (!signature) return false;

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
  // REMOVIDO: res.setTimeout(5000); -> Isso causa erro em Cloud Functions V2

  const source = (req.query.source as string)?.toUpperCase();
  const restaurantId = req.query.rid as string;
  const signature = req.headers['x-signature'] as string || '';

  // Conecta ao DB dentro da função para garantir que o app já iniciou
  const db = admin.firestore();

  console.log(`[HUB] Recebido evento de ${source}`);

  // 1. Validação de Parâmetros
  if (!source || !restaurantId) {
    console.error("[HUB] Parâmetros faltando");
    res.status(400).send("Missing source or rid parameter");
    return;
  }

  // 2. Validação de Assinatura
  if (req.rawBody && !validateSignature(source, req.rawBody.toString(), signature)) {
      console.warn(`[HUB SECURITY] Assinatura inválida para ${source}`);
      // Em produção, descomente: res.status(401).send('Invalid Signature');
  }

  try {
    // 3. Proteção contra Body Vazio
    if (!req.body) {
       console.error('[HUB] Body vazio');
       res.status(400).send('Empty body');
       return;
    }

    let orderData = null;

    switch (source) {
        case 'IFOOD':
            // O iFood manda 'PLACED' ou 'CONCLUDED'
            if (req.body.code === 'PLACED' || req.body.code === 'CONCLUDED') {
                if (req.body.data) {
                    orderData = normalizeiFoodOrder(req.body.data, restaurantId);
                } else {
                    console.warn('[HUB] iFood PLACED sem dados. Ignorando.');
                }
            } else {
                // Eventos de polling ou keepalive
                console.log(`[HUB] Evento iFood ignorado: ${req.body.code}`);
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
            
        default:
            console.warn(`Fonte desconhecida: ${source}`);
    }

    // 4. Salvar no Firestore
    if (orderData) {
        await db.collection('orders').doc(orderData.externalId).set({
            ...orderData,
            integrated: true,
            integrationTime: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`[HUB] ✅ Pedido ${orderData.externalId} salvo com sucesso!`);
        
        // Retorna JSON com sucesso para o iFood processar
        res.status(200).json({ success: true });
        return;
    }

    // Se não for pedido novo, retorna OK apenas
    res.status(200).send('OK');

  } catch (error: any) {
    console.error('[HUB CRITICAL ERROR]', error);
    // Retorna erro formatado para evitar que o iFood ache que é erro de parse
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
