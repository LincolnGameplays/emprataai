
import * as functions from 'firebase-functions';
import axios from 'axios';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface AddressCheckResult {
  valid: boolean;
  reason?: string;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}

export const verifyAddress = functions.https.onCall(async (data, context): Promise<AddressCheckResult> => {
  const { street, number, zipCode, city, state } = data;
  
  if (!street || !number || !zipCode) {
    return { valid: false, reason: 'Dados de endereço incompletos.' };
  }

  const fullAddress = `${street}, ${number} - ${zipCode}${city ? `, ${city}` : ''}${state ? ` - ${state}` : ''}`;

  try {
    // Valida no Google Geocoding API Server-Side (Mais seguro que no cliente)
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_KEY}`
    );

    if (response.data.status !== 'OK') {
      return { valid: false, reason: 'Endereço não encontrado na base global.' };
    }

    const location = response.data.results[0].geometry.location;
    const addressType = response.data.results[0].geometry.location_type;

    // ROBUST_CHECK: Se o Google devolveu "APPROXIMATE", pode ser um endereço falso ou impreciso
    if (addressType === 'APPROXIMATE') {
       return { valid: false, reason: 'Número predial não confirmado. Verifique o endereço.' };
    }

    return { 
      valid: true, 
      coordinates: location,
      formattedAddress: response.data.results[0].formatted_address 
    };

  } catch (error) {
    console.error("Erro na validação de endereço:", error);
    throw new functions.https.HttpsError('internal', 'Erro ao validar endereço.');
  }
});

// Rate limiting simple implementation
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const checkRateLimit = (identifier: string, limit: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false; // Rate limited
  }

  record.count++;
  return true;
};
