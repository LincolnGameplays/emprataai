
import type { Menu, Category, MenuItem } from '../types/menu';
import { UserVibe } from './neuroCopy';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

interface MenuContext {
  timeOfDay: 'morning' | 'lunch' | 'afternoon' | 'dinner' | 'late_night';
  weather?: 'sunny' | 'rainy' | 'cold' | 'hot';
  dayOfWeek: number; // 0-6
}

// ══════════════════════════════════════════════════════════════════
// CONTEXT DETECTION
// ══════════════════════════════════════════════════════════════════

export function detectContext(): MenuContext {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  let timeOfDay: MenuContext['timeOfDay'] = 'afternoon';
  if (hour >= 5 && hour < 11) timeOfDay = 'morning';
  else if (hour >= 11 && hour < 15) timeOfDay = 'lunch';
  else if (hour >= 15 && hour < 18) timeOfDay = 'afternoon';
  else if (hour >= 18 && hour < 23) timeOfDay = 'dinner';
  else timeOfDay = 'late_night';

  return {
    timeOfDay,
    dayOfWeek: day,
    weather: 'sunny' // Mocked for now, can integrate OpenWeather later
  };
}

// ══════════════════════════════════════════════════════════════════
// SCORING LOGIC
// ══════════════════════════════════════════════════════════════════

function scoreItem(item: MenuItem, context: MenuContext): number {
  let score = 0;
  const title = item.title.toLowerCase();
  const desc = item.description?.toLowerCase() || '';

  // 1. Highlight Boost
  if (item.isHighlight) score += 50;

  // 2. Time Relevance
  if (context.timeOfDay === 'morning') {
    if (title.includes('café') || title.includes('pão') || title.includes('queijo')) score += 30;
    if (title.includes('combo')) score += 20;
  }
  if (context.timeOfDay === 'lunch') {
    if (title.includes('executivo') || title.includes('prato') || title.includes('salada')) score += 40;
    if (title.includes('sobremesa')) score += 15;
  }
  if (context.timeOfDay === 'dinner') {
    if (title.includes('pizza') || title.includes('burger') || title.includes('vinho')) score += 40;
    if (title.includes('compartilhar') || title.includes('família')) score += 25;
  }
  if (context.timeOfDay === 'late_night') {
    if (title.includes('burger') || title.includes('pizza') || title.includes('fritas')) score += 50;
    if (title.includes('doce')) score += 30;
  }

  // 3. Weather Relevance (Mocked)
  if (context.weather === 'cold' && (title.includes('sopa') || title.includes('caldo') || title.includes('chocolate'))) {
    score += 30;
  }
  if (context.weather === 'hot' && (title.includes('sorvete') || title.includes('gelad') || title.includes('suco'))) {
    score += 30;
  }

  return score;
}

// ══════════════════════════════════════════════════════════════════
// REORDER ENGINE
// ══════════════════════════════════════════════════════════════════

export function getDynamicMenu(menu: Menu | null): Menu | null {
  if (!menu) return null;

  const context = detectContext();

  // 1. Score all items
  const scoredCategories = menu.categories.map(cat => ({
    ...cat,
    score: 0, // Will sum items score
    items: cat.items.map(item => ({
      ...item,
      _score: scoreItem(item, context)
    })).sort((a, b) => b._score - a._score)
  }));

  // 2. Score Categories based on top items
  scoredCategories.forEach(cat => {
    // Top 3 items define category relevance
    const topItemsScore = cat.items.slice(0, 3).reduce((sum, item) => sum + item._score, 0);
    cat.score = topItemsScore;
  });

  // 3. Sort Categories
  scoredCategories.sort((a, b) => b.score - a.score);

  return {
    ...menu,
    categories: scoredCategories
  };
}

// ══════════════════════════════════════════════════════════════════
// VIBE FILTER
// ══════════════════════════════════════════════════════════════════

export function filterMenuByVibe(menu: Menu, vibe: UserVibe): Menu {
  if (vibe === 'standard') return menu;

  const filteredCategories = menu.categories.map(cat => {
    const relevantItems = cat.items.filter(item => {
      const text = (item.title + ' ' + item.description).toLowerCase();
      
      switch (vibe) {
        case 'fitness':
          return text.includes('fit') || text.includes('saud') || text.includes('protein') || text.includes('salada') || text.includes('zero');
        case 'comfort':
          return text.includes('quente') || text.includes('queijo') || text.includes('crem') || text.includes('chocolate');
        case 'energy':
          return text.includes('café') || text.includes('acai') || text.includes('açaí') || text.includes('mega') || text.includes('dobro');
        case 'late_night':
          return text.includes('burger') || text.includes('smash') || text.includes('pizza') || text.includes('fritas');
        default:
          return true;
      }
    });

    return {
      ...cat,
      items: relevantItems
    };
  }).filter(cat => cat.items.length > 0);

  return {
    ...menu,
    categories: filteredCategories
  };
}
