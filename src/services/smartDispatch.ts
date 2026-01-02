/**
 * ⚡ SMART DISPATCH SERVICE - Cérebro Logístico
 * 
 * Algoritmo de atribuição inteligente de motoristas baseado em:
 * - Distância até o restaurante
 * - Número de pedidos ativos
 * - Nível de bateria do dispositivo
 * - Status atual do motorista
 * 
 * Score System: Menor pontuação = Melhor motorista
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DriverLocation {
  lat: number;
  lng: number;
}

export interface Driver {
  id: string;
  name: string;
  location: DriverLocation;
  activeOrders: number;
  batteryLevel: number;    // 0-100%
  status: 'online' | 'offline' | 'busy' | 'returning';
  speed?: number;          // km/h (para câmera dinâmica)
  lastUpdate?: Date;
}

export interface ScoredDriver extends Driver {
  score: number;
  distance: number;        // km
  reason: string;          // Explicação para UI
}

export interface DispatchOrder {
  id: string;
  lat: number;
  lng: number;
  deadline?: Date;
  priority?: 'normal' | 'urgent' | 'vip';
  customerName?: string;
}

export interface SmartRouteResult {
  optimizedOrder: DispatchOrder[];
  totalDuration: number;   // seconds
  totalDistance: number;   // meters
  delayRisk: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// HAVERSINE DISTANCE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function getDistance(
  point1: DriverLocation, 
  point2: DriverLocation
): number {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ═══════════════════════════════════════════════════════════════════════════
// DRIVER SCORING ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Score weights for driver selection
 * These can be tuned based on business priorities
 */
const SCORING_WEIGHTS = {
  DISTANCE_PER_KM: 1,           // 1 point per km
  ACTIVE_ORDER_PENALTY: 5,      // 5 points per active order
  LOW_BATTERY_PENALTY: 50,      // 50 points if battery < 15%
  MEDIUM_BATTERY_PENALTY: 10,   // 10 points if battery < 30%
  BUSY_STATUS_PENALTY: 20,      // 20 points if status is 'busy'
  RETURNING_BONUS: -3,          // -3 points if returning to store (bonus)
  STALE_LOCATION_PENALTY: 100,  // 100 points if location > 5 min old
};

/**
 * Find the best driver for a pickup
 * @param drivers Available drivers
 * @param storeLocation Restaurant location
 * @returns Best driver with score and reasoning
 */
export function findBestDriver(
  drivers: Driver[], 
  storeLocation: DriverLocation
): ScoredDriver | null {
  if (!drivers || drivers.length === 0) return null;

  const scoredDrivers = drivers
    .filter(d => d.status !== 'offline') // Exclude offline drivers
    .map(driver => {
      const distance = getDistance(driver.location, storeLocation);
      let score = 0;
      const reasons: string[] = [];

      // ═══════════════════════════════════════════════════════════════
      // DISTANCE SCORE (Primary Factor)
      // ═══════════════════════════════════════════════════════════════
      score += distance * SCORING_WEIGHTS.DISTANCE_PER_KM;
      reasons.push(`${distance.toFixed(1)}km de distância`);

      // ═══════════════════════════════════════════════════════════════
      // WORKLOAD SCORE
      // ═══════════════════════════════════════════════════════════════
      if (driver.activeOrders > 0) {
        score += driver.activeOrders * SCORING_WEIGHTS.ACTIVE_ORDER_PENALTY;
        reasons.push(`${driver.activeOrders} pedido(s) ativo(s)`);
      }

      // ═══════════════════════════════════════════════════════════════
      // BATTERY HEALTH
      // ═══════════════════════════════════════════════════════════════
      if (driver.batteryLevel < 15) {
        score += SCORING_WEIGHTS.LOW_BATTERY_PENALTY;
        reasons.push(`⚠️ Bateria crítica (${driver.batteryLevel}%)`);
      } else if (driver.batteryLevel < 30) {
        score += SCORING_WEIGHTS.MEDIUM_BATTERY_PENALTY;
        reasons.push(`Bateria baixa (${driver.batteryLevel}%)`);
      }

      // ═══════════════════════════════════════════════════════════════
      // STATUS MODIFIERS
      // ═══════════════════════════════════════════════════════════════
      if (driver.status === 'busy') {
        score += SCORING_WEIGHTS.BUSY_STATUS_PENALTY;
        reasons.push('Em entrega');
      } else if (driver.status === 'returning') {
        score += SCORING_WEIGHTS.RETURNING_BONUS;
        reasons.push('✓ Retornando à loja');
      }

      // ═══════════════════════════════════════════════════════════════
      // LOCATION FRESHNESS
      // ═══════════════════════════════════════════════════════════════
      if (driver.lastUpdate) {
        const ageMinutes = (Date.now() - new Date(driver.lastUpdate).getTime()) / 60000;
        if (ageMinutes > 5) {
          score += SCORING_WEIGHTS.STALE_LOCATION_PENALTY;
          reasons.push('GPS desatualizado');
        }
      }

      return {
        ...driver,
        score: Math.round(score * 100) / 100,
        distance: Math.round(distance * 100) / 100,
        reason: reasons.join(' • ')
      };
    })
    .sort((a, b) => a.score - b.score);

  return scoredDrivers[0] || null;
}

/**
 * Get all drivers ranked by score
 */
export function rankDrivers(
  drivers: Driver[], 
  storeLocation: DriverLocation
): ScoredDriver[] {
  if (!drivers || drivers.length === 0) return [];

  return drivers
    .filter(d => d.status !== 'offline')
    .map(driver => {
      const distance = getDistance(driver.location, storeLocation);
      let score = distance * SCORING_WEIGHTS.DISTANCE_PER_KM;
      score += driver.activeOrders * SCORING_WEIGHTS.ACTIVE_ORDER_PENALTY;
      
      if (driver.batteryLevel < 15) score += SCORING_WEIGHTS.LOW_BATTERY_PENALTY;
      if (driver.status === 'busy') score += SCORING_WEIGHTS.BUSY_STATUS_PENALTY;
      if (driver.status === 'returning') score += SCORING_WEIGHTS.RETURNING_BONUS;

      return {
        ...driver,
        score: Math.round(score * 100) / 100,
        distance: Math.round(distance * 100) / 100,
        reason: `Pontuação: ${Math.round(score)}`
      };
    })
    .sort((a, b) => a.score - b.score);
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTIMATED ARRIVAL TIME
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Estimate arrival time based on distance (simple linear model)
 * Assumes average speed of 30 km/h in urban areas
 */
export function estimateArrivalTime(
  distanceKm: number, 
  averageSpeedKmh: number = 30
): { minutes: number; arrival: Date } {
  const minutes = Math.ceil((distanceKm / averageSpeedKmh) * 60);
  const arrival = new Date(Date.now() + minutes * 60000);
  
  return { minutes, arrival };
}

// ═══════════════════════════════════════════════════════════════════════════
// DELAY RISK DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if order is at risk of being late
 */
export function checkDelayRisk(
  order: DispatchOrder,
  driver: ScoredDriver,
  maxAcceptableMinutes: number = 45
): { isAtRisk: boolean; message: string } {
  const eta = estimateArrivalTime(driver.distance);
  
  // Check against deadline if provided
  if (order.deadline) {
    const deadlineTime = new Date(order.deadline).getTime();
    const etaTime = eta.arrival.getTime();
    
    if (etaTime > deadlineTime) {
      return {
        isAtRisk: true,
        message: `⚠️ Risco de atraso! ETA: ${eta.minutes}min, Deadline passou.`
      };
    }
  }
  
  // Check against general acceptable time
  if (eta.minutes > maxAcceptableMinutes) {
    return {
      isAtRisk: true,
      message: `⚠️ Tempo estimado alto: ${eta.minutes} minutos. Considere outro motorista.`
    };
  }
  
  return {
    isAtRisk: false,
    message: `✓ ETA: ${eta.minutes} minutos`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DISPATCH SUGGESTION GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export interface DispatchSuggestion {
  driver: ScoredDriver;
  eta: { minutes: number; arrival: Date };
  delayRisk: { isAtRisk: boolean; message: string };
  confidence: 'high' | 'medium' | 'low';
  displayMessage: string;
}

/**
 * Generate a complete dispatch suggestion for UI
 */
export function generateDispatchSuggestion(
  drivers: Driver[],
  storeLocation: DriverLocation,
  order: DispatchOrder
): DispatchSuggestion | null {
  const bestDriver = findBestDriver(drivers, storeLocation);
  
  if (!bestDriver) {
    return null;
  }
  
  const eta = estimateArrivalTime(bestDriver.distance);
  const delayRisk = checkDelayRisk(order, bestDriver);
  
  // Determine confidence based on score
  let confidence: 'high' | 'medium' | 'low';
  if (bestDriver.score < 5) confidence = 'high';
  else if (bestDriver.score < 15) confidence = 'medium';
  else confidence = 'low';
  
  const displayMessage = `🤖 Sugestão da IA: ${bestDriver.name} (${bestDriver.distance.toFixed(1)}km, ${eta.minutes}min). Bateria: ${bestDriver.batteryLevel}%`;
  
  return {
    driver: bestDriver,
    eta,
    delayRisk,
    confidence,
    displayMessage
  };
}
