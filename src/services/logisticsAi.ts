/**
 * Logistics AI Service - Neural Delivery Prediction
 * 
 * Predicts delivery time based on:
 * - Distance (Haversine formula)
 * - Kitchen queue status
 * - Time/day context (rush hours, weekends)
 * - Weather conditions (owner toggle)
 * - Restaurant's historical performance
 */

import { logicModel } from './googleAi';
import { getDocs, getDoc, query, collection, where, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

// ══════════════════════════════════════════════════════════════════
// HAVERSINE DISTANCE FORMULA
// ══════════════════════════════════════════════════════════════════

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Returns in KM
}

// ══════════════════════════════════════════════════════════════════
// PREDICTION INPUT INTERFACE
// ══════════════════════════════════════════════════════════════════

export interface PredictionInput {
  restaurantId: string;
  storeLocation: { lat: number; lng: number };
  userLocation: { lat: number; lng: number };
}

export interface DeliveryPrediction {
  minTime: number;
  maxTime: number;
  reason: string;
  distanceKm: number;
  kitchenQueue: number;
  weatherImpact: boolean;
}

// ══════════════════════════════════════════════════════════════════
// MAIN PREDICTION FUNCTION
// ══════════════════════════════════════════════════════════════════

export async function predictDeliveryTime(input: PredictionInput): Promise<DeliveryPrediction> {
  const { restaurantId, storeLocation, userLocation } = input;

  try {
    // 1. INTERNAL FACTORS - Kitchen queue
    const ordersQuery = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      where('status', 'in', ['pending', 'preparing', 'PENDING', 'PREPARING'])
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const kitchenQueue = ordersSnapshot.size;

    // 2. PHYSICAL FACTORS - Distance
    const distanceKm = calculateDistance(
      storeLocation.lat, 
      storeLocation.lng, 
      userLocation.lat, 
      userLocation.lng
    );

    // 3. WEATHER CONDITION - From restaurant settings
    let weatherCondition = 'CLEAR';
    try {
      const restaurantDoc = await getDoc(doc(db, 'users', restaurantId));
      if (restaurantDoc.exists()) {
        weatherCondition = restaurantDoc.data()?.marketplace?.weatherCondition || 'CLEAR';
      }
    } catch (e) {
      console.log('Could not fetch weather condition');
    }

    // 4. BRAIN MEMORY - Historical calibration
    let brainMemory = { avgDelay: 0, rushHourImpact: 1 };
    try {
      const userDoc = await getDoc(doc(db, 'users', restaurantId));
      if (userDoc.exists() && userDoc.data()?.emprataBrain) {
        brainMemory = userDoc.data()!.emprataBrain;
      }
    } catch (e) {
      console.log('Could not fetch brain memory');
    }

    // 5. TEMPORAL CONTEXT
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const hour = now.getHours();
    const isRushHour = (hour >= 11 && hour <= 13) || (hour >= 18 && hour <= 21);
    const timeContext = `${isWeekend ? 'Fim de semana' : 'Dia de semana'}, ${isRushHour ? 'Horário de Pico' : 'Horário calmo'}, ${now.toLocaleTimeString('pt-BR')}`;

    // 6. AI MAGIC - Contextual prediction
    const prompt = `
      Aja como um Algoritmo Logístico Avançado (estilo Waze + iFood).
      Calcule o tempo de entrega com base nestes dados REAIS:
      
      DADOS:
      - Distância Linear: ${distanceKm.toFixed(2)} km
      - Fila na Cozinha: ${kitchenQueue} pedidos na frente
      - Contexto Temporal: ${timeContext}
      - Condição Climática: ${weatherCondition === 'RAIN' ? 'CHOVENDO (adicione 30% ao tempo)' : 'Tempo bom'}
      - Histórico: Média de atraso de ${brainMemory.avgDelay || 0} minutos
      - Fator de Rush Hour: ${brainMemory.rushHourImpact || 1}x
      
      REGRAS:
      1. Base: 15min preparo + 2min por pedido na fila + 4min por km
      2. Se horário de pico: multiplique por 1.3
      3. Se chovendo: multiplique por 1.3
      4. Some o viés de atraso histórico
      
      Retorne APENAS um JSON válido (sem markdown):
      {
        "minTime": número,
        "maxTime": número,
        "reason": "Motivo curto e amigável em português (ex: Alta demanda na cozinha)"
      }
    `;

    try {
      const result = await logicModel.generateContent(prompt);
      const responseText = result.response.text();
      const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiPrediction = JSON.parse(jsonStr);
      
      return {
        minTime: aiPrediction.minTime,
        maxTime: aiPrediction.maxTime,
        reason: aiPrediction.reason,
        distanceKm,
        kitchenQueue,
        weatherImpact: weatherCondition === 'RAIN'
      };
    } catch (aiError) {
      console.error("AI prediction failed, using fallback:", aiError);
      // Fallback calculation
      return calculateFallbackPrediction(distanceKm, kitchenQueue, isRushHour, weatherCondition === 'RAIN');
    }

  } catch (error) {
    console.error("Prediction error:", error);
    // Simple fallback
    const distanceKm = calculateDistance(
      storeLocation.lat, storeLocation.lng,
      userLocation.lat, userLocation.lng
    );
    return calculateFallbackPrediction(distanceKm, 0, false, false);
  }
}

// ══════════════════════════════════════════════════════════════════
// FALLBACK CALCULATION (No AI)
// ══════════════════════════════════════════════════════════════════

function calculateFallbackPrediction(
  distanceKm: number, 
  kitchenQueue: number, 
  isRushHour: boolean,
  isRaining: boolean
): DeliveryPrediction {
  // Base: 15min prep + 2min per order + 4min per km
  let baseTime = 15 + (kitchenQueue * 2) + (distanceKm * 4);
  
  // Rush hour multiplier
  if (isRushHour) baseTime *= 1.3;
  
  // Rain multiplier
  if (isRaining) baseTime *= 1.3;
  
  const minTime = Math.floor(baseTime);
  const maxTime = Math.floor(baseTime + 10);
  
  let reason = 'Previsão padrão';
  if (kitchenQueue > 5) reason = 'Alta demanda na cozinha';
  else if (isRaining) reason = 'Condições climáticas';
  else if (isRushHour) reason = 'Horário de pico';
  
  return {
    minTime,
    maxTime,
    reason,
    distanceKm,
    kitchenQueue,
    weatherImpact: isRaining
  };
}
