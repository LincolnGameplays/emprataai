/**
 * ⚡ TASTE DNA - Personalized Recommendation Engine ⚡
 * Analyzes customer taste profile and reorders menu
 * 
 * Features:
 * - Taste profile extraction from order history
 * - Menu personalization based on preferences
 * - Category affinity scoring
 */

import { 
  collection, query, where, orderBy, limit, 
  getDocs, Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface TasteProfile {
  customerId: string;
  // Flavor scores (0-1)
  spicyScore: number;
  sweetScore: number;
  saltyScore: number;
  friedScore: number;
  healthyScore: number;
  veganScore: number;
  premiumScore: number;
  // Category affinities
  categoryAffinities: Record<string, number>;
  // Last analyzed
  analyzedAt: Date;
  orderCount: number;
}

export interface PersonalizedItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
  relevanceScore: number;
  tasteDnaMatch: string[]; // Why it was recommended
}

// ══════════════════════════════════════════════════════════════════
// TASTE KEYWORDS
// ══════════════════════════════════════════════════════════════════

const TASTE_KEYWORDS = {
  spicy: ['picante', 'pimenta', 'jalapeño', 'apimentado', 'mexicano', 'curry', 'wasabi'],
  sweet: ['doce', 'chocolate', 'açúcar', 'caramelo', 'bolo', 'sobremesa', 'mel', 'morango'],
  salty: ['salgado', 'bacon', 'queijo', 'batata frita', 'chips', 'empanado'],
  fried: ['frito', 'empanado', 'crocante', 'batata', 'pastel', 'coxinha', 'fritura'],
  healthy: ['salada', 'light', 'fit', 'integral', 'grelhado', 'vegetal', 'legumes'],
  vegan: ['vegano', 'vegan', 'sem carne', 'plant', 'vegetariano', 'tofu'],
  premium: ['premium', 'especial', 'gourmet', 'wagyu', 'trufa', 'artesanal', 'signature']
};

// ══════════════════════════════════════════════════════════════════
// ANALYZE TASTE PROFILE
// ══════════════════════════════════════════════════════════════════

/**
 * Analyzes customer's order history to build taste profile
 */
export async function analyzeTasteProfile(
  customerId: string,
  restaurantId: string
): Promise<TasteProfile | null> {
  try {
    // Fetch last 10 orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      where('customer.cpf', '==', customerId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(ordersQuery);
    
    if (snapshot.empty) {
      return null;
    }

    // Initialize scores
    const scores = {
      spicy: 0,
      sweet: 0,
      salty: 0,
      fried: 0,
      healthy: 0,
      vegan: 0,
      premium: 0
    };

    const categoryCount: Record<string, number> = {};
    let totalItems = 0;

    // Analyze each order
    snapshot.docs.forEach(doc => {
      const order = doc.data();
      
      order.items?.forEach((item: any) => {
        const itemText = `${item.name} ${item.description || ''} ${item.notes || ''}`.toLowerCase();
        const category = item.category || 'outros';
        
        totalItems++;

        // Count categories
        categoryCount[category] = (categoryCount[category] || 0) + 1;

        // Match taste keywords
        Object.entries(TASTE_KEYWORDS).forEach(([taste, keywords]) => {
          keywords.forEach(keyword => {
            if (itemText.includes(keyword)) {
              scores[taste as keyof typeof scores] += 1;
            }
          });
        });
      });
    });

    // Normalize scores to 0-1
    const maxScore = Math.max(...Object.values(scores), 1);
    const normalizedScores = {
      spicyScore: scores.spicy / maxScore,
      sweetScore: scores.sweet / maxScore,
      saltyScore: scores.salty / maxScore,
      friedScore: scores.fried / maxScore,
      healthyScore: scores.healthy / maxScore,
      veganScore: scores.vegan / maxScore,
      premiumScore: scores.premium / maxScore
    };

    // Calculate category affinities
    const categoryAffinities: Record<string, number> = {};
    Object.entries(categoryCount).forEach(([cat, count]) => {
      categoryAffinities[cat] = count / totalItems;
    });

    return {
      customerId,
      ...normalizedScores,
      categoryAffinities,
      analyzedAt: new Date(),
      orderCount: snapshot.docs.length
    };
  } catch (error) {
    console.error('[TasteAI] Failed to analyze profile:', error);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// PERSONALIZE MENU
// ══════════════════════════════════════════════════════════════════

/**
 * Reorders menu items based on taste profile
 */
export function personalizeMenu(
  menuItems: any[],
  profile: TasteProfile
): PersonalizedItem[] {
  return menuItems.map(item => {
    const itemText = `${item.title || item.name} ${item.description || ''}`.toLowerCase();
    const category = (item.category || 'outros').toLowerCase();
    
    let relevanceScore = 0;
    const tasteDnaMatch: string[] = [];

    // Category affinity bonus
    if (profile.categoryAffinities[category]) {
      relevanceScore += profile.categoryAffinities[category] * 30;
      if (profile.categoryAffinities[category] > 0.3) {
        tasteDnaMatch.push(`Você adora ${category}`);
      }
    }

    // Taste keyword matching
    const tasteChecks: [string, number, string][] = [
      ['spicy', profile.spicyScore, '🌶️ Picante'],
      ['sweet', profile.sweetScore, '🍫 Doce'],
      ['salty', profile.saltyScore, '🧂 Salgado'],
      ['fried', profile.friedScore, '🍟 Crocante'],
      ['healthy', profile.healthyScore, '🥗 Saudável'],
      ['vegan', profile.veganScore, '🌱 Vegano'],
      ['premium', profile.premiumScore, '⭐ Premium']
    ];

    tasteChecks.forEach(([taste, score, label]) => {
      const keywords = TASTE_KEYWORDS[taste as keyof typeof TASTE_KEYWORDS];
      const hasMatch = keywords.some(kw => itemText.includes(kw));
      
      if (hasMatch && score > 0.3) {
        relevanceScore += score * 20;
        tasteDnaMatch.push(label);
      }
    });

    // Highlight items match
    if (item.isHighlight) {
      relevanceScore += 5;
    }

    return {
      id: item.id,
      title: item.title || item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      category: item.category,
      relevanceScore,
      tasteDnaMatch: tasteDnaMatch.slice(0, 2) // Max 2 tags
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// ══════════════════════════════════════════════════════════════════
// GET TOP RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════

/**
 * Gets top N personalized recommendations
 */
export function getTopRecommendations(
  personalizedItems: PersonalizedItem[],
  count: number = 4
): PersonalizedItem[] {
  return personalizedItems
    .filter(item => item.relevanceScore > 10 && item.tasteDnaMatch.length > 0)
    .slice(0, count);
}

// ══════════════════════════════════════════════════════════════════
// PROFILE SUMMARY (for UI display)
// ══════════════════════════════════════════════════════════════════

export function getProfileSummary(profile: TasteProfile): string[] {
  const traits: string[] = [];
  
  if (profile.spicyScore > 0.5) traits.push('🌶️ Gosta de pimenta');
  if (profile.sweetScore > 0.5) traits.push('🍫 Doceiro');
  if (profile.friedScore > 0.5) traits.push('🍟 Fã de fritos');
  if (profile.healthyScore > 0.5) traits.push('🥗 Busca saúde');
  if (profile.veganScore > 0.5) traits.push('🌱 Preferência vegana');
  if (profile.premiumScore > 0.5) traits.push('⭐ Gosta de especiais');

  return traits.slice(0, 3);
}
