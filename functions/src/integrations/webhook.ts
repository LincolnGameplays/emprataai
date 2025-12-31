
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import axios from 'axios';
import { 
  normalizeiFoodOrder, 
  normalizeRappiOrder, 
  normalizeUberEatsOrder 
} from './adapters';

const db = admin.firestore();

// Variáveis de Ambiente (Configure no .env.emprataai)
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
  
  // 1. Se não tiver segredo configurado (Ambiente de Teste), aceita tudo
  if (!secret) return true;

  // 2. Se tiver segredo, mas não veio assinatura, rejeita
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // 3. Validação de tamanho para evitar erro do timingSafeEqual
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

export const deliveryHubWebhook = onRequest(async (req, res) => {
  const source = (req.query.source as string)?.toUpperCase(); // ?source=IFOOD ou ?source=UBER
  const restaurantId = req.query.rid as string;
  const signature = req.headers['x-signature'] as string || '';

  console.log(`[HUB] Recebido evento de ${source}`);

  // Validação de Assinatura (Segurança)
  // Nota: Em produção, você deve habilitar isso. Em teste, se não tiver env var, passa reto.
  if (req.rawBody && !validateSignature(source, req.rawBody.toString(), signature)) {
      console.warn(`[HUB SECURITY] Assinatura inválida para ${source}`);
      // res.status(401).send('Invalid Signature'); // Descomente em produção
  }

  try {
    let orderData = null;

    // --- ROTEAMENTO POR FONTE ---
    
    switch (source) {
        case 'IFOOD':
            // iFood manda o pedido completo no payload (em certos eventos)
            if (req.body.code === 'PLACED') {
                orderData = normalizeiFoodOrder(req.body.data, restaurantId);
            }
            break;

        case 'RAPPI':
            // Rappi manda order_created
            if (req.body.type === 'order_created') {
                orderData = normalizeRappiOrder(req.body.payload, restaurantId);
            }
            break;

        case 'UBER_EATS':
            // Uber manda apenas o resource_href (Link para buscar o pedido)
            // Evento: orders.notification
            if (req.body.event_type === 'orders.notification') {
                const resourceUrl = req.body.resource_href; 
                // BUSCAR DETALHES NA API DA UBER
                const uberRes = await axios.get(resourceUrl, {
                    headers: { 'Authorization': `Bearer ${UBER_TOKEN}` }
                });
                orderData = normalizeUberEatsOrder(uberRes.data, restaurantId);
            }
            break;
            
        case '99FOOD':
            // 99 Food (Exemplo genérico)
            if (req.body.status === 1) { // 1 = Novo
                // orderData = normalize99Order(req.body, restaurantId); // Use se tiver o adapter
                console.log('99Food adapter not implemented yet');
            }
            break;
            
        default:
            console.warn(`Fonte desconhecida: ${source}`);
    }

    // --- SALVAR NO FIRESTORE ---
    if (orderData) {
        // Usa ID externo como chave para evitar duplicidade
        await db.collection('orders').doc(orderData.externalId).set({
            ...orderData,
            integrated: true,
            integrationTime: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`[HUB] Pedido ${orderData.externalId} do ${orderData.source} salvo!`);
        
        // Dica: Aqui o seu "Smart Batching" vai detectar o novo pedido automaticamente
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('[HUB ERROR]', error);
    res.status(500).send('Erro na integração');
  }
});
