/**
 * ⚡ MARKETPLACE HOME - Restaurant Discovery ⚡
 * Consumer-facing marketplace with geolocation and smart search
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, MapPin, Star, Clock, Car, Filter, 
  CloudRain, Dumbbell, Zap, Moon, Sparkles, 
  ChefHat, Heart, Loader2, RefreshCw
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import AddressSelector from '../../components/AddressSelector';
import type { Address, RestaurantProfile } from '../../types/user';

// ══════════════════════════════════════════════════════════════════
// HAVERSINE DISTANCE CALCULATION
// ══════════════════════════════════════════════════════════════════

function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ══════════════════════════════════════════════════════════════════
// VIBE CATEGORIES
// ══════════════════════════════════════════════════════════════════

const VIBES = [
  { id: 'all', label: 'Todos', icon: <Sparkles className="w-5 h-5" />, color: 'primary' },
  { id: 'comfort', label: 'Conforto', icon: <CloudRain className="w-5 h-5" />, color: 'blue-500' },
  { id: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-5 h-5" />, color: 'green-500' },
  { id: 'energy', label: 'Fome Monstro', icon: <Zap className="w-5 h-5" />, color: 'orange-500' },
  { id: 'late_night', label: 'Larica', icon: <Moon className="w-5 h-5" />, color: 'purple-500' },
];

// ══════════════════════════════════════════════════════════════════
// MOCK RESTAURANTS (Replace with Firestore query)
// ══════════════════════════════════════════════════════════════════

const MOCK_RESTAURANTS: RestaurantProfile[] = [
  {
    id: 'rest_1',
    name: 'Burger Empire',
    slug: 'burger-empire',
    description: 'Os melhores hambúrgueres artesanais da cidade',
    coverUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    logoUrl: 'https://placehold.co/100x100/ff5500/white?text=BE',
    categories: ['Hambúrguer', 'Americano'],
    vibes: ['energy', 'late_night'],
    rating: 4.8,
    reviewCount: 234,
    deliveryTime: { min: 25, max: 40 },
    deliveryFee: 6.99,
    minimumOrder: 25,
    isOpen: true,
    openingHours: {},
    coords: { lat: -23.5505, lng: -46.6333 },
    address: {} as Address,
    phone: '',
    acceptsOnlinePayment: true,
    acceptsCashPayment: true,
    acceptsCardOnDelivery: true,
  },
  {
    id: 'rest_2',
    name: 'Sushi Master',
    slug: 'sushi-master',
    description: 'Culinária japonesa tradicional e contemporânea',
    coverUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    logoUrl: 'https://placehold.co/100x100/dc2626/white?text=SM',
    categories: ['Japonês', 'Sushi'],
    vibes: ['fitness', 'comfort'],
    rating: 4.9,
    reviewCount: 567,
    deliveryTime: { min: 35, max: 50 },
    deliveryFee: 8.99,
    minimumOrder: 40,
    isOpen: true,
    openingHours: {},
    coords: { lat: -23.5520, lng: -46.6350 },
    address: {} as Address,
    phone: '',
    acceptsOnlinePayment: true,
    acceptsCashPayment: false,
    acceptsCardOnDelivery: true,
  },
  {
    id: 'rest_3',
    name: 'Fit Kitchen',
    slug: 'fit-kitchen',
    description: 'Comida saudável sem abrir mão do sabor',
    coverUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    logoUrl: 'https://placehold.co/100x100/22c55e/white?text=FK',
    categories: ['Saudável', 'Saladas'],
    vibes: ['fitness'],
    rating: 4.6,
    reviewCount: 189,
    deliveryTime: { min: 20, max: 30 },
    deliveryFee: 4.99,
    minimumOrder: 20,
    isOpen: true,
    openingHours: {},
    coords: { lat: -23.5490, lng: -46.6320 },
    address: {} as Address,
    phone: '',
    acceptsOnlinePayment: true,
    acceptsCashPayment: true,
    acceptsCardOnDelivery: true,
  },
  {
    id: 'rest_4',
    name: 'Pizza da Nonna',
    slug: 'pizza-nonna',
    description: 'Pizzas artesanais com receitas italianas',
    coverUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    logoUrl: 'https://placehold.co/100x100/f97316/white?text=PN',
    categories: ['Pizza', 'Italiano'],
    vibes: ['comfort', 'late_night'],
    rating: 4.7,
    reviewCount: 412,
    deliveryTime: { min: 30, max: 45 },
    deliveryFee: 5.99,
    minimumOrder: 30,
    isOpen: true,
    openingHours: {},
    coords: { lat: -23.5530, lng: -46.6300 },
    address: {} as Address,
    phone: '',
    acceptsOnlinePayment: true,
    acceptsCashPayment: true,
    acceptsCardOnDelivery: true,
  },
];

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function MarketplaceHome() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('all');
  const [restaurants, setRestaurants] = useState<RestaurantProfile[]>(MOCK_RESTAURANTS);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Load restaurants from Firestore (or use mock)
  useEffect(() => {
    const loadRestaurants = async () => {
      setLoading(true);
      try {
        // In production, query users with role === 'owner'
        const q = query(collection(db, 'users'), where('role', '==', 'owner'));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const data = snapshot.docs.map(doc => doc.data().restaurant as RestaurantProfile).filter(Boolean);
          if (data.length > 0) setRestaurants(data);
        }
      } catch (e) {
        console.log('Using mock data');
      }
      setLoading(false);
    };

    loadRestaurants();
  }, []);

  // Update user coords when address is selected
  useEffect(() => {
    if (selectedAddress?.coords) {
      setUserCoords(selectedAddress.coords);
    }
  }, [selectedAddress]);

  // Filter restaurants
  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants];

    // Filter by vibe
    if (selectedVibe !== 'all') {
      result = result.filter(r => r.vibes?.includes(selectedVibe));
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.categories?.some(c => c.toLowerCase().includes(query)) ||
        r.description?.toLowerCase().includes(query)
      );
    }

    // Sort by distance if we have user coords
    if (userCoords) {
      result = result.map(r => ({
        ...r,
        distance: r.coords ? calculateDistance(
          userCoords.lat, userCoords.lng,
          r.coords.lat, r.coords.lng
        ) : 999
      }))
      .filter(r => (r as any).distance <= 10) // Max 10km radius
      .sort((a, b) => ((a as any).distance || 0) - ((b as any).distance || 0));
    }

    return result;
  }, [restaurants, selectedVibe, searchQuery, userCoords]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Logo + Address */}
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="text-2xl font-black italic tracking-tighter">
              Emprata<span className="text-primary">.ai</span>
            </Link>
            
            <div className="flex-1 max-w-xs ml-4">
              <AddressSelector
                savedAddresses={savedAddresses}
                selectedAddress={selectedAddress}
                onSelect={setSelectedAddress}
                onSaveNew={(addr) => setSavedAddresses([...savedAddresses, addr])}
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar pizza, hambúrguer, sushi..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Vibe Filters */}
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-2 px-4 pb-4 min-w-max">
            {VIBES.map(vibe => (
              <button
                key={vibe.id}
                onClick={() => setSelectedVibe(vibe.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  selectedVibe === vibe.id
                    ? `bg-${vibe.color}/20 border-${vibe.color} text-white border`
                    : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                }`}
                style={selectedVibe === vibe.id ? {
                  backgroundColor: `rgb(var(--${vibe.color}) / 0.2)`,
                  borderColor: `rgb(var(--${vibe.color}))`,
                } : {}}
              >
                {vibe.icon}
                {vibe.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black">
              {filteredRestaurants.length} restaurantes
            </h1>
            <p className="text-sm text-white/40">
              {selectedVibe !== 'all' 
                ? VIBES.find(v => v.id === selectedVibe)?.label 
                : 'Todos os estilos'}
              {userCoords && ' • Até 10km'}
            </p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm font-bold hover:bg-white/10 transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Restaurant Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredRestaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/menu/${restaurant.slug}`}>
                  <div className="group bg-white/5 border border-white/5 rounded-3xl overflow-hidden hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer">
                    {/* Cover Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={restaurant.coverUrl}
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      
                      {/* Open/Closed Badge */}
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        restaurant.isOpen 
                          ? 'bg-green-500/90 text-white' 
                          : 'bg-red-500/90 text-white'
                      }`}>
                        {restaurant.isOpen ? 'Aberto' : 'Fechado'}
                      </div>

                      {/* Favorite Button */}
                      <button 
                        onClick={(e) => { e.preventDefault(); }}
                        className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-white" />
                      </button>

                      {/* Logo */}
                      <div className="absolute -bottom-6 left-4">
                        <img
                          src={restaurant.logoUrl}
                          alt=""
                          className="w-14 h-14 rounded-2xl border-4 border-[#0a0a0a] object-cover"
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 pt-8">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-black text-lg">{restaurant.name}</h3>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-bold">{restaurant.rating}</span>
                        </div>
                      </div>

                      <p className="text-xs text-white/50 mb-3 line-clamp-1">
                        {restaurant.categories?.join(' • ')}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {restaurant.deliveryTime?.min}-{restaurant.deliveryTime?.max} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          {restaurant.deliveryFee === 0 
                            ? 'Grátis' 
                            : `R$ ${restaurant.deliveryFee?.toFixed(2)}`}
                        </span>
                        {(restaurant as any).distance && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {((restaurant as any).distance as number).toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {!loading && filteredRestaurants.length === 0 && (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2">Nenhum restaurante encontrado</h3>
            <p className="text-white/40 mb-6">
              Tente ajustar os filtros ou buscar por outra categoria
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedVibe('all'); }}
              className="px-6 py-3 bg-primary rounded-full font-bold hover:bg-orange-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline-block mr-2" />
              Limpar Filtros
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
