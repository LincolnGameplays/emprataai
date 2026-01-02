/**
 * 📱 WhatsApp Warmup Logic - Anti-Ban Algorithm
 * 
 * New chips get banned if they send 100+ messages on day 1.
 * This module implements a "Warmup Curve" with geometric progression
 * to look human and avoid detection.
 */

// ═══════════════════════════════════════════════════════════════════════════
// DAILY LIMIT CALCULATOR (Geometric Progression)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate safe daily message limit based on chip age
 * 
 * Progression:
 * Day 1: 10 msgs
 * Day 2: 16 msgs
 * Day 3: 26 msgs
 * Day 5: 66 msgs
 * Day 7: 170 msgs
 * Day 10: 1000 msgs (fully warmed)
 */
export function calculateDailyLimit(daysActive: number): number {
  if (daysActive <= 0) return 10;
  if (daysActive >= 10) return 1000; // Fully warmed - safe limit
  
  // Geometric progression: 10 * 1.6^daysActive
  return Math.floor(10 * Math.pow(1.6, daysActive));
}

/**
 * Get warmup status and recommendations
 */
export function getWarmupStatus(daysActive: number): {
  phase: 'new' | 'warming' | 'stable';
  dailyLimit: number;
  recommendation: string;
  healthPercentage: number;
} {
  const limit = calculateDailyLimit(daysActive);
  
  if (daysActive < 3) {
    return {
      phase: 'new',
      dailyLimit: limit,
      recommendation: 'Chip novo. Envie apenas para clientes conhecidos.',
      healthPercentage: 30 + (daysActive * 10)
    };
  }
  
  if (daysActive < 10) {
    return {
      phase: 'warming',
      dailyLimit: limit,
      recommendation: 'Chip aquecendo. Aumente gradualmente os envios.',
      healthPercentage: 50 + (daysActive * 5)
    };
  }
  
  return {
    phase: 'stable',
    dailyLimit: limit,
    recommendation: 'Chip estável. Pode enviar normalmente.',
    healthPercentage: 95
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULE GENERATOR (Human-like Distribution)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Distributes messages randomly throughout the day to appear human
 * Returns array of scheduled timestamps
 */
export function generateSchedule(
  totalMessages: number, 
  startHour: number = 10, 
  endHour: number = 20
): Date[] {
  const slots: Date[] = [];
  const windowMinutes = (endHour - startHour) * 60;
  const today = new Date();
  
  // Minimum gap between messages (in minutes)
  const minGap = 2;
  const usedMinutes: number[] = [];
  
  for (let i = 0; i < totalMessages; i++) {
    let randomMinute: number;
    let attempts = 0;
    
    // Find a slot that doesn't overlap with existing ones
    do {
      randomMinute = Math.floor(Math.random() * windowMinutes);
      attempts++;
    } while (
      usedMinutes.some(m => Math.abs(m - randomMinute) < minGap) && 
      attempts < 100
    );
    
    usedMinutes.push(randomMinute);
    
    const scheduledTime = new Date(today);
    scheduledTime.setHours(startHour, 0, 0, 0);
    scheduledTime.setMinutes(scheduledTime.getMinutes() + randomMinute);
    slots.push(scheduledTime);
  }
  
  // Sort chronologically
  return slots.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Format schedule for display
 */
export function formatSchedulePreview(schedule: Date[]): string[] {
  return schedule.slice(0, 5).map(date => 
    date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING & SAFETY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate optimal delay between messages (in ms)
 * Varies to appear natural
 */
export function getMessageDelay(): number {
  // Base delay: 30-90 seconds, randomly distributed
  const baseDelay = 30000 + Math.random() * 60000;
  
  // Add occasional longer pauses (human-like breaks)
  const hasBreak = Math.random() < 0.1; // 10% chance
  const breakDelay = hasBreak ? 120000 : 0; // 2 min break
  
  return baseDelay + breakDelay;
}

/**
 * Check if it's safe to send based on time of day
 */
export function isSafeToSend(hour?: number): boolean {
  const currentHour = hour ?? new Date().getHours();
  // Only send between 8 AM and 9 PM
  return currentHour >= 8 && currentHour < 21;
}

/**
 * Calculate risk score for a campaign
 */
export function calculateRiskScore(config: {
  messageCount: number;
  daysActive: number;
  hour: number;
}): { score: number; level: 'low' | 'medium' | 'high'; warning?: string } {
  const { messageCount, daysActive, hour } = config;
  const dailyLimit = calculateDailyLimit(daysActive);
  
  let score = 0;
  
  // Over daily limit
  if (messageCount > dailyLimit) {
    score += 50;
  } else if (messageCount > dailyLimit * 0.8) {
    score += 25;
  }
  
  // Bad timing
  if (!isSafeToSend(hour)) {
    score += 20;
  }
  
  // New chip
  if (daysActive < 3) {
    score += 15;
  }
  
  const level = score > 50 ? 'high' : score > 25 ? 'medium' : 'low';
  
  return {
    score,
    level,
    warning: level === 'high' 
      ? 'Alto risco de bloqueio! Reduza a quantidade.' 
      : level === 'medium' 
        ? 'Risco moderado. Considere reduzir.' 
        : undefined
  };
}
