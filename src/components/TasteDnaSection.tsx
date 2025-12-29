/**
 * ⚡ TASTE DNA SECTION - Personalized Recommendations UI ⚡
 * Shows "Selected for your palate" section with golden glow
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Dna } from 'lucide-react';
import { 
  analyzeTasteProfile, 
  personalizeMenu, 
  getTopRecommendations,
  getProfileSummary,
  TasteProfile,
  PersonalizedItem
} from '../services/tasteAi';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

interface TasteDnaSectionProps {
  restaurantId: string;
  customerId?: string | null;
  menuItems: any[];
  onItemClick: (item: any) => void;
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function TasteDnaSection({
  restaurantId,
  customerId,
  menuItems,
  onItemClick
}: TasteDnaSectionProps) {
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId || !restaurantId || menuItems.length === 0) return;

    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const tasteProfile = await analyzeTasteProfile(customerId, restaurantId);
        
        if (tasteProfile && tasteProfile.orderCount >= 2) {
          setProfile(tasteProfile);
          const personalized = personalizeMenu(menuItems, tasteProfile);
          const topRecs = getTopRecommendations(personalized, 4);
          setRecommendations(topRecs);
        }
      } catch (error) {
        console.error('[TasteDNA] Failed to load recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [customerId, restaurantId, menuItems]);

  // Don't render if no recommendations
  if (!profile || recommendations.length === 0 || loading) {
    return null;
  }

  const traits = getProfileSummary(profile);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 px-4"
    >
      {/* Header with Golden Glow */}
      <div className="relative mb-4">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-yellow-400/10 to-amber-500/20 blur-2xl" />
        
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Dna className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-lg font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
              Selecionados para o seu Paladar 🧬
            </h2>
            <p className="text-xs text-white/40">
              Baseado nos seus {profile.orderCount} últimos pedidos
            </p>
          </div>
        </div>

        {/* Taste Traits */}
        {traits.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {traits.map((trait, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-300"
              >
                {trait}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-2 gap-3">
        {recommendations.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onItemClick(item)}
            className="group relative overflow-hidden rounded-2xl border border-amber-500/20 hover:border-amber-500/50 transition-all"
          >
            {/* Golden Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-600/0 group-hover:from-amber-500/10 group-hover:to-amber-600/5 transition-colors" />
            
            {/* Image */}
            <div className="aspect-square overflow-hidden">
              <img
                src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Content */}
            <div className="p-3 bg-black/60 backdrop-blur-sm">
              <h3 className="font-bold text-sm truncate">{item.title}</h3>
              
              {/* Match Tags */}
              {item.tasteDnaMatch.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {item.tasteDnaMatch.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-amber-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-primary font-black mt-1">
                R$ {item.price.toFixed(2).replace('.', ',')}
              </p>
            </div>

            {/* DNA Match Indicator */}
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 bg-amber-500/80 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-black" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
