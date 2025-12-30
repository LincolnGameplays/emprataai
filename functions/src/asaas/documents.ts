import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import FormData from 'form-data'; // ✅ CORREÇÃO: Import padrão, sem "import * as"
import { ASAAS_CONFIG } from './constants';

const db = admin.firestore();

interface DocumentUploadRequest {
  type: 'IDENTIFICATION' | 'SELFIE'; 
  fileBase64: string; 
  fileName: string;
}

export const financeUploadDocuments = functions.https.onCall(async (request) => {
  const data = request.data as DocumentUploadRequest;
  const auth = request.auth;

  if (!auth) throw new functions.https.HttpsError('unauthenticated', 'Login necessário');

  try {
    // 1. Pega o ID da conta Asaas do usuário
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const asaasAccountId = userDoc.data()?.finance?.asaasAccountId;

    if (!asaasAccountId) {
      throw new functions.https.HttpsError('failed-precondition', 'Conta Asaas não encontrada.');
    }

    // 2. Converte Base64 de volta para Buffer (Arquivo)
    // O Frontend manda: "data:image/png;base64,iVBOR..."
    // Precisamos remover o prefixo se existir
    const base64Data = data.fileBase64.includes('base64,') 
      ? data.fileBase64.split('base64,')[1] 
      : data.fileBase64;

    const fileBuffer = Buffer.from(base64Data, 'base64');

    // 3. Prepara o FormData
    const form = new FormData();
    form.append('file', fileBuffer, { filename: data.fileName });
    form.append('type', data.type);

    console.log(`[DOCS] Enviando ${data.type} para conta ${asaasAccountId}...`);

    // 4. Envia para o Asaas
    const response = await axios.post(
      `${ASAAS_CONFIG.baseUrl}/accounts/${asaasAccountId}/documents`,
      form,
      {
        headers: {
          ...form.getHeaders(), // Headers obrigatórios para multipart/form-data
          'access_token': ASAAS_CONFIG.apiKey // Usa a chave Mestra para enviar docs da subconta
        }
      }
    );

    // 5. Atualiza status no Firestore
    const updateField = data.type === 'SELFIE' ? 'docSelfieSent' : 'docIdSent';
    
    await db.collection('users').doc(auth.uid).update({
      [`finance.documents.${updateField}`]: true,
      'finance.documents.lastUpdate': admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, id: response.data.id, status: response.data.status };

  } catch (error: any) {
    console.error('[UPLOAD ERROR]', error.response?.data || error.message);
    throw new functions.https.HttpsError('internal', 'Erro ao enviar documento para o Asaas.');
  }
});
