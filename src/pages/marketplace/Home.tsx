/**
 * Marketplace Home - Store Discovery with "Near Me" Feature
 * 
 * Features:
 * - Distance-based store sorting (Haversine formula)
 * - User GPS location detection
 * - Stores without GPS appear last
 * - Open stores prioritized
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Sparkles, Filter, Star, Clock, Bike, ChevronDown, Navigation, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Link } from 'react-router-dom';
import type { MarketplaceConfig } from '../../types/user';
import AddressSelector from '../../components/AddressSelector';
import { ReferralCard } from '../../components/ReferralCard';

// ══════════════════════════════════════════════════════════════════
// HAVERSINE DISTANCE FORMULA
// ══════════════════════════════════════════════════════════════════

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(
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
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

// ══════════════════════════════════════════════════════════════════
// STORE CARD COMPONENT
// ══════════════════════════════════════════════════════════════════

interface StoreWithDistance {
  id: string;
  data: MarketplaceConfig;
  distance?: number;
}

const StoreCard = ({ store, id, distance }: { store: MarketplaceConfig; id: string; distance?: number }) => (
  <Link to={`/menu/${id}`}>
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all group ${!store.isOpen ? 'opacity-60 grayscale' : ''}`}
    >
      <div className="h-32 relative overflow-hidden bg-gray-800">
        {store.bannerUrl ? (
          <img 
            src={store.bannerUrl} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            loading="lazy" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/10 text-4xl font-black">
            {store.displayName?.[0] || '?'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
        
        {/* Status Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
          store.isOpen ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
        }`}>
          {store.isOpen ? 'Aberto' : 'Fechado'}
        </div>

        {/* Distance Badge */}
        {distance !== undefined && distance < 9999 && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-black bg-black/80 text-white flex items-center gap-1">
            <Navigation size={10} />
            {formatDistance(distance)}
          </div>
        )}
      </div>
      
      <div className="p-4 relative">
        <div className="w-12 h-12 rounded-full border-2 border-[#1a1a1a] bg-black absolute -top-6 left-4 overflow-hidden">
          {store.logoUrl ? (
            <img src={store.logoUrl} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/10" />
          )}
        </div>
        
        <div className="mt-4 flex justify-between items-start">
          <div>
            <h3 className="font-bold text-white text-lg leading-none mb-1">{store.displayName}</h3>
            <p className="text-white/40 text-xs">
              {store.cuisineType} • {store.minTime}-{store.maxTime} min
            </p>
          </div>
          <div className="text-right">
            <span className="text-yellow-400 font-bold text-sm flex items-center gap-1">
              <Star size={10} fill="currentColor" /> {store.rating || 'New'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-3 overflow-hidden text-xs">
          <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
            store.deliveryFee === 0 ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/60'
          }`}>
            <Bike size={10} />
            {store.deliveryFee === 0 ? 'Grátis' : `R$ ${store.deliveryFee?.toFixed(2) || '0.00'}`}
          </span>
        </div>
      </div>
    </motion.div>
  </Link>
);

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function MarketplaceHome() {
  const [stores, setStores] = useState<StoreWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddress, setShowAddress] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<any>(null);
  
  // User location state
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);

  // 1. Get user location on mount
  useEffect(() => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ 
          lat: pos.coords.latitude, 
          lng: pos.coords.longitude 
        });
        setLocationLoading(false);
      },
      (err) => {
        console.log('GPS permission denied or unavailable');
        setLocationError(true);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // 2. Fetch and sort stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const q = query(
          collection(db, 'users'), 
          where('marketplace.isActive', '==', true)
        );
        const snap = await getDocs(q);
        
        let data: StoreWithDistance[] = snap.docs.map(doc => ({ 
          id: doc.id, 
          data: doc.data().marketplace as MarketplaceConfig 
        }));
        
        // Calculate distances if user location is available
        if (userLocation) {
          data = data.map(store => {
            const storeLocation = store.data.location;
            const distance = storeLocation 
              ? getDistanceFromLatLonInKm(
                  userLocation.lat, 
                  userLocation.lng, 
                  storeLocation.lat, 
                  storeLocation.lng
                )
              : 9999; // Stores without GPS go to the end
            
            return { ...store, distance };
          });
        }
        
        // Sort: Open stores first, then by distance
        data.sort((a, b) => {
          // First criteria: Open stores first
          if (b.data.isOpen !== a.data.isOpen) {
            return b.data.isOpen ? 1 : -1;
          }
          // Second criteria: Distance (if available)
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          return 0;
        });
        
        setStores(data);
      } catch (error) {
        console.error("Error loading stores", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Wait for location attempt before fetching (or timeout)
    if (!locationLoading) {
      fetchStores();
    }
  }, [userLocation, locationLoading]);

  const filteredStores = stores.filter(store => 
    store.data.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.data.cuisineType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <button 
          onClick={() => setShowAddress(!showAddress)}
          className="flex items-center gap-2 text-white mb-3 w-full hover:bg-white/5 p-2 rounded-xl transition-colors"
        >
          <div className="bg-primary/20 p-2 rounded-full text-primary">
            <MapPin size={16} />
          </div>
          <div className="text-left flex-1">
            <p className="text-[10px] text-white/40 font-bold uppercase">Entregar em</p>
            <p className="text-sm font-bold flex items-center gap-1">
              {currentAddress 
                ? `${currentAddress.street}, ${currentAddress.number}` 
                : userLocation 
                  ? 'Usando sua localização'
                  : 'Selecionar Endereço'}
              <ChevronDown size={14} className="text-white/40" />
            </p>
          </div>
          {userLocation && !currentAddress && (
            <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-[10px] font-bold flex items-center gap-1">
              <Navigation size={10} /> GPS
            </div>
          )}
        </button>
        
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Prato, mercado ou loja..." 
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary outline-none text-white placeholder-white/20" 
            />
          </div>
          <button className="bg-[#1a1a1a] p-2.5 rounded-xl border border-white/10 text-white/60 hover:text-primary hover:border-primary transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* ADDRESS MODAL */}
      <AnimatePresence>
        {showAddress && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
            <motion.div 
              initial={{ y: 100 }} 
              animate={{ y: 0 }} 
              exit={{ y: 100 }}
              className="bg-[#121212] w-full max-w-md rounded-3xl p-6 border border-white/10"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Onde você está?</h3>
                <button onClick={() => setShowAddress(false)} className="text-white/40">
                  Fechar
                </button>
              </div>
              <AddressSelector 
                onSelect={(addr) => {
                  setCurrentAddress(addr);
                  // Update user location from address coords if available
                  if (addr.coords) {
                    setUserLocation({ lat: addr.coords.lat, lng: addr.coords.lng });
                  }
                  setShowAddress(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONTENT */}
      <div className="p-4 space-y-8">
        
        {/* AI Taste Match Banner */}
        {!searchTerm && (
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="font-black text-lg text-white mb-1 flex items-center gap-2">
                <Sparkles className="text-yellow-400" size={18} /> Taste Match
              </h2>
              <p className="text-xs text-white/60 max-w-[200px]">
                {userLocation 
                  ? 'Lojas ordenadas pela menor distância!' 
                  : 'Ative o GPS para ver lojas próximas'}
              </p>
            </div>
            <div className="text-6xl absolute right-4 top-1/2 -translate-y-1/2 opacity-20">🧬</div>
          </div>
        )}

        {/* STORE LIST */}
        <div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            {userLocation ? 'Lojas Próximas' : 'Lojas Disponíveis'}
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/40">
              {filteredStores.length}
            </span>
          </h3>
          
          {loading || locationLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-white/40 text-sm">
                {locationLoading ? 'Buscando sua localização...' : 'Carregando lojas...'}
              </p>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-10 text-white/30">
              <p>Nenhuma loja encontrada {searchTerm && `para "${searchTerm}"`}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStores.map(store => (
                <StoreCard 
                  key={store.id} 
                  store={store.data} 
                  id={store.id}
                  distance={store.distance}
                />
              ))}
            </div>
          )}
        </div>

        {/* MGM - Member Get Member (Growth Hack) */}
        <ReferralCard />
      </div>
    </div>
  );
}
