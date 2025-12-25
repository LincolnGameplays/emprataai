/**
 * Vibes Configuration
 * Central configuration for all food photography styles
 */

import { FoodVibe } from '../store/useAppStore';

export interface VibeConfig {
  id: FoodVibe;
  name: string;
  image: string;
  isPro: boolean;
  promptKeyword: string;
  description: string;
}

export const VIBES: VibeConfig[] = [
  // FREE VIBES
  {
    id: 'rustico',
    name: 'Mesa Rústica',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop&q=80',
    isPro: false,
    promptKeyword: 'rustic wooden table, natural lighting, artisanal presentation',
    description: 'Madeira natural, iluminação suave, estilo caseiro'
  },
  {
    id: 'gourmet',
    name: 'Mármore Clean',
    image: 'https://images.unsplash.com/photo-1615799998603-7c6270a45196?w=200&h=200&fit=crop&q=80',
    isPro: false,
    promptKeyword: 'white marble surface, minimalist, clean aesthetic, soft shadows',
    description: 'Mármore branco, minimalista, sombras suaves'
  },
  {
    id: 'dark',
    name: 'Moody Dark',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop&q=80',
    isPro: false,
    promptKeyword: 'dark moody atmosphere, dramatic lighting, black background',
    description: 'Atmosfera escura, iluminação dramática'
  },
  {
    id: 'domingo',
    name: 'Sol de Manhã',
    image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=200&h=200&fit=crop&q=80',
    isPro: false,
    promptKeyword: 'bright morning sunlight, warm tones, fresh and airy',
    description: 'Luz solar matinal, tons quentes, fresco'
  },
  {
    id: 'marble',
    name: 'Onyx Luxo',
    image: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=200&h=200&fit=crop&q=80',
    isPro: false,
    promptKeyword: 'black marble, luxury presentation, gold accents',
    description: 'Mármore preto, apresentação luxuosa'
  },
  {
    id: 'neon',
    name: 'Neon Cyber',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop&q=80',
    isPro: false,
    promptKeyword: 'neon lights, cyberpunk aesthetic, vibrant colors, futuristic',
    description: 'Luzes neon, estética cyberpunk, futurista'
  },

  // PRO VIBES
  {
    id: 'chefs-table',
    name: "Chef's Table",
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&q=80',
    isPro: true,
    promptKeyword: 'fine dining, dramatic spotlight, dark background, professional plating, michelin star presentation',
    description: 'Iluminação dramática, foco pontual, alta gastronomia'
  },
  {
    id: 'editorial',
    name: 'Editorial Magazine',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop&q=80',
    isPro: true,
    promptKeyword: 'solid color background, hard shadows, pop art style, magazine editorial, bold composition',
    description: 'Fundo colorido sólido, sombras duras, estilo revista'
  },
  {
    id: 'morning-brunch',
    name: 'Morning Brunch',
    image: 'https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=200&h=200&fit=crop&q=80',
    isPro: true,
    promptKeyword: 'intense natural light, plant shadows, airy atmosphere, fresh breakfast setting, window light',
    description: 'Luz natural intensa, sombras de plantas, arejado'
  },
  {
    id: 'dark-kitchen',
    name: 'Dark Kitchen',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop&q=80',
    isPro: true,
    promptKeyword: 'slate stone surface, steam rising, industrial style, professional kitchen atmosphere',
    description: 'Pedra ardósia, vapor, estilo industrial'
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop&q=80',
    isPro: true,
    promptKeyword: 'sunset lighting, warm golden tones, soft glow, magic hour photography',
    description: 'Luz do pôr do sol, tons dourados, brilho suave'
  },
  {
    id: 'macro-detail',
    name: 'Macro Detail',
    image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=200&h=200&fit=crop&q=80',
    isPro: true,
    promptKeyword: 'extreme close-up, texture focus, bokeh background, macro photography, shallow depth of field',
    description: 'Foco extremo na textura, fundo desfocado (bokeh)'
  }
];

// Helper function to get vibe by ID
export function getVibeById(id: FoodVibe): VibeConfig | undefined {
  return VIBES.find(vibe => vibe.id === id);
}

// Get all free vibes
export function getFreeVibes(): VibeConfig[] {
  return VIBES.filter(vibe => !vibe.isPro);
}

// Get all PRO vibes
export function getProVibes(): VibeConfig[] {
  return VIBES.filter(vibe => vibe.isPro);
}
