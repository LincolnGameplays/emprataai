/**
 * 🔐 License Issuer - Server-Side JWT Signing
 * 
 * This Vercel Serverless Function:
 * 1. Validates Firebase Auth token
 * 2. Fetches real plan from Firestore (source of truth)
 * 3. Signs a JWT with RSA private key
 * 4. Returns the signed license for offline use
 * 
 * SECURITY:
 * - Private key NEVER leaves server
 * - Client can only verify, not forge
 * - License expires forcing periodic renewal
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import * as jose from 'jose';

// Initialize Firebase Admin (if not already)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// RSA Private Key (ONLY on server - from Vercel env)
const PRIVATE_KEY = process.env.RSA_LICENSE_PRIVATE_KEY;

// License validity period
const LICENSE_VALIDITY_DAYS = 7;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Validate Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Fetch REAL plan from Firestore (source of truth)
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const realPlan = userData.plan || 'STARTER';
    
    // Determine features based on plan
    const features = getFeaturesByPlan(realPlan);

    // 3. Check private key
    if (!PRIVATE_KEY) {
      console.error('RSA_LICENSE_PRIVATE_KEY not configured');
      return res.status(500).json({ error: 'License signing unavailable' });
    }

    // 4. Import private key and sign license
    const privateKey = await jose.importPKCS8(PRIVATE_KEY, 'RS256');
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (LICENSE_VALIDITY_DAYS * 24 * 60 * 60);

    const licenseJwt = await new jose.SignJWT({
      uid: uid,
      plan: realPlan,
      features: features,
      issuedAt: now,
      expiresAt: expiresAt,
      maxOfflineDays: LICENSE_VALIDITY_DAYS
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt(now)
      .setExpirationTime(expiresAt)
      .setSubject(uid)
      .setIssuer('emprata.ai')
      .sign(privateKey);

    // 5. Log for audit
    console.log(`[License] Issued for ${uid} - Plan: ${realPlan} - Expires: ${new Date(expiresAt * 1000).toISOString()}`);

    // 6. Return signed license
    return res.status(200).json({ 
      license: licenseJwt,
      plan: realPlan,
      expiresAt: expiresAt
    });

  } catch (error: any) {
    console.error('[License] Error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(500).json({ error: 'Failed to issue license' });
  }
}

// Helper: Map plan to features
function getFeaturesByPlan(plan: string): string[] {
  const features: Record<string, string[]> = {
    STARTER: ['basic_menu', 'basic_orders', 'basic_reports'],
    GROWTH: ['basic_menu', 'basic_orders', 'basic_reports', 'driver_app_access', 'financial_overview', 'multi_user'],
    BLACK: ['ALL'] // BLACK gets everything
  };
  
  return features[plan] || features.STARTER;
}
