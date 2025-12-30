// ✅ IMPORTAÇÃO V2
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

interface DocUploadRequest {
  type: 'IDENTIFICATION' | 'SELFIE' | 'CNPJ';
  fileBase64: string; 
  fileName: string;
}

export const financeUploadDocuments = onCall(async (request) => {
  const data = request.data as DocUploadRequest;
  const auth = request.auth;

  if (!auth) throw new HttpsError('unauthenticated', 'Login necessário');

  try {
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const userData = userDoc.data();
    const accountId = userData?.finance?.asaasAccountId;

    if (!accountId) {
       throw new HttpsError('failed-precondition', 'Conta Asaas não encontrada.');
    }

    const updateKey = data.type === 'SELFIE' ? 'docSelfieSent' : 'docIdSent';
    
    await db.collection('users').doc(auth.uid).set({
      finance: {
        documents: {
          [updateKey]: true,
          lastUpdate: admin.firestore.FieldValue.serverTimestamp()
        }
      }
    }, { merge: true });

    return { success: true };

  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error(err);
    throw new HttpsError('internal', 'Erro ao enviar documento');
  }
});
