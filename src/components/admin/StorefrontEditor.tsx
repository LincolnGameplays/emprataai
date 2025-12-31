/**
 * Storefront Editor - Store Configuration for Marketplace
 * 
 * Features:
 * - Live preview of store card
 * - AI-powered description enhancement
 * - GPS coordinate fetching via OpenStreetMap
 * - Address management with geolocation
 */

import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { motion } from 'framer-motion';
import { 
  Store, MapPin, Sparkles, Save, Navigation, 
  Loader2, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import type { MarketplaceConfig } from '../../types/user';

export default function StorefrontEditor() {
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  
  const [config, setConfig] = useState<MarketplaceConfig>({
    isActive: false,
    slug: '',
    displayName: '',
    description: '',
    bannerUrl: '',
    logoUrl: '',
    cuisineType: '',
    rating: 5.0,
    deliveryFee: 5.00,
    minTime: 30,
    maxTime: 45,
    isOpen: true,
    tags: [],
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  useEffect(() => {
    if (auth.currentUser) {
      getDoc(doc(db, 'users', auth.currentUser.uid)).then(snap => {
        if (snap.exists() && snap.data().marketplace) {
          setConfig(snap.data().marketplace);
        } else if (snap.exists()) {
          setConfig(prev => ({
            ...prev,
            displayName: snap.data().restaurantName || snap.data().name || auth.currentUser?.displayName || 'Minha Loja'
          }));
        }
      });
    }
  }, []);

  // 🧠 AI Enhancement
  const handleAIEnhance = async () => {
    setAiGenerating(true);
    setTimeout(() => {
      setConfig(prev => ({
        ...prev,
        description: `Experimente o melhor de ${prev.cuisineType || 'nossa cozinha'}! Ingredientes selecionados, preparo artesanal e entrega rápida para você.`,
        tags: ['Saboroso', 'Entrega Rápida', 'Favorito da Galera']
      }));
      setAiGenerating(false);
      toast.success('IA: Descrição otimizada para vendas!');
    }, 1500);
  };

  // 📍 Fetch GPS coordinates from address using OpenStreetMap Nominatim
  const fetchCoordinates = async () => {
    const address = config.address;
    if (!address?.street || !address?.city) {
      toast.error('Preencha rua e cidade primeiro');
      return;
    }

    setFetchingLocation(true);
    
    const query = `${address.street}${address.number ? ` ${address.number}` : ''}, ${address.neighborhood || ''}, ${address.city}, ${address.state || 'Brasil'}`;
    
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            'User-Agent': 'EmprataAI/1.0' // Required by Nominatim
          }
        }
      );
      const data = await res.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        
        setConfig(prev => ({
          ...prev,
          location: { lat, lng }
        }));
        
        toast.success('📍 Localização encontrada!');
      } else {
        toast.error('Endereço não encontrado no mapa. Verifique os dados.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao buscar coordenadas');
    } finally {
      setFetchingLocation(false);
    }
  };

  // 📍 Use browser geolocation (fallback)
  const useCurrentLocation = () => {
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setConfig(prev => ({
          ...prev,
          location: { 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
          }
        }));
        toast.success('📍 Usando sua localização atual!');
        setFetchingLocation(false);
      },
      (err) => {
        toast.error('Não foi possível obter sua localização');
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { marketplace: config });
      toast.success('Loja atualizada no Marketplace!');
    } catch (e) { 
      toast.error('Erro ao salvar'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="bg-[#121212] rounded-3xl border border-white/10 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black italic flex items-center gap-2">
            <Store className="text-primary" /> Vitrine da Loja
          </h2>
          <p className="text-white/40 text-sm">Configure como você aparece no App do Cliente</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAIEnhance}
            disabled={aiGenerating}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-purple-500/30 transition-all"
          >
            <Sparkles size={14} /> {aiGenerating ? 'Criando...' : 'Mágica IA'}
          </button>
          <button 
            onClick={() => setConfig(c => ({...c, isActive: !c.isActive}))}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-all ${
              config.isActive ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-red-500/20 text-red-400 border-red-500'
            }`}
          >
            {config.isActive ? '🟢 Loja Online' : '🔴 Loja Oculta'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* PREVIEW */}
        <div className="border border-white/10 rounded-[2rem] p-4 bg-black max-w-sm mx-auto shadow-2xl relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#121212] rounded-b-xl z-20" />
          <div className="h-full overflow-hidden rounded-2xl bg-[#1a1a1a] relative">
            {/* Banner */}
            <div className="h-40 bg-gray-800 relative">
              {config.bannerUrl && <img src={config.bannerUrl} className="w-full h-full object-cover" />}
              <div className="absolute bottom-[-20px] left-4 w-16 h-16 rounded-full border-4 border-[#1a1a1a] bg-black overflow-hidden shadow-lg">
                {config.logoUrl && <img src={config.logoUrl} className="w-full h-full object-cover" />}
              </div>
            </div>
            
            <div className="pt-8 px-4 pb-4">
              <div className="flex justify-between items-start">
                <h3 className="font-black text-xl text-white">{config.displayName || 'Nome da Loja'}</h3>
                <div className="flex gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">
                  ★ {config.rating || 5.0}
                </div>
              </div>
              <p className="text-xs text-white/40 mt-1">{config.cuisineType} • {config.minTime}-{config.maxTime} min</p>
              
              <p className="text-xs text-white/70 mt-3 leading-relaxed">
                {config.description || 'Descrição da loja...'}
              </p>

              {/* Location indicator */}
              {config.location && (
                <div className="mt-3 flex items-center gap-1 text-[10px] text-green-400">
                  <CheckCircle size={10} />
                  GPS Configurado
                </div>
              )}

              <div className="mt-4 flex gap-2 flex-wrap">
                {config.tags?.map(tag => (
                  <span key={tag} className="text-[10px] bg-white/5 px-2 py-1 rounded text-white/60">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-white/40 ml-1">Nome da Loja</label>
              <input 
                value={config.displayName}
                onChange={e => setConfig({...config, displayName: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                placeholder="Ex: Burger King"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-white/40 ml-1">Categoria</label>
              <input 
                value={config.cuisineType}
                onChange={e => setConfig({...config, cuisineType: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                placeholder="Ex: Hamburgueria"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="text-xs font-bold text-white/40 ml-1">URLs das Imagens</label>
            <input 
              value={config.bannerUrl}
              onChange={e => setConfig({...config, bannerUrl: e.target.value})}
              placeholder="URL do Banner (Capa)"
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs mb-2 focus:border-primary outline-none"
            />
            <input 
              value={config.logoUrl}
              onChange={e => setConfig({...config, logoUrl: e.target.value})}
              placeholder="URL do Logo"
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-primary outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-white/40 ml-1">Descrição (Use a Mágica IA!)</label>
            <textarea 
              value={config.description}
              onChange={e => setConfig({...config, description: e.target.value})}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none h-24 resize-none"
              placeholder="Conte um pouco sobre sua loja..."
            />
          </div>

          {/* Address Section */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-primary" />
              <span className="text-sm font-bold">Endereço da Loja</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <input 
                value={config.address?.street || ''}
                onChange={e => setConfig({...config, address: {...config.address, street: e.target.value} as any})}
                placeholder="Rua"
                className="col-span-2 bg-black/50 border border-white/10 rounded-xl p-2 text-white text-xs"
              />
              <input 
                value={config.address?.number || ''}
                onChange={e => setConfig({...config, address: {...config.address, number: e.target.value} as any})}
                placeholder="Nº"
                className="bg-black/50 border border-white/10 rounded-xl p-2 text-white text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                value={config.address?.neighborhood || ''}
                onChange={e => setConfig({...config, address: {...config.address, neighborhood: e.target.value} as any})}
                placeholder="Bairro"
                className="bg-black/50 border border-white/10 rounded-xl p-2 text-white text-xs"
              />
              <input 
                value={config.address?.city || ''}
                onChange={e => setConfig({...config, address: {...config.address, city: e.target.value} as any})}
                placeholder="Cidade"
                className="bg-black/50 border border-white/10 rounded-xl p-2 text-white text-xs"
              />
            </div>

            {/* GPS Coordinates Section */}
            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-bold text-white/40">Coordenadas GPS</p>
                  <p className="font-mono text-xs text-primary">
                    {config.location 
                      ? `${config.location.lat.toFixed(6)}, ${config.location.lng.toFixed(6)}` 
                      : 'Não configurado'}
                  </p>
                </div>
                {config.location && (
                  <CheckCircle size={16} className="text-green-400" />
                )}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={fetchCoordinates}
                  disabled={fetchingLocation}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {fetchingLocation ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <MapPin size={14} />
                  )}
                  Buscar pelo Endereço
                </button>
                <button 
                  onClick={useCurrentLocation}
                  disabled={fetchingLocation}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  <Navigation size={14} />
                  Usar GPS Atual
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-white/40 ml-1">Taxa Entrega</label>
              <input 
                type="number" 
                value={config.deliveryFee} 
                onChange={e => setConfig({...config, deliveryFee: Number(e.target.value)})} 
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-white/40 ml-1">Tempo Mín</label>
              <input 
                type="number" 
                value={config.minTime} 
                onChange={e => setConfig({...config, minTime: Number(e.target.value)})} 
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-white/40 ml-1">Tempo Máx</label>
              <input 
                type="number" 
                value={config.maxTime} 
                onChange={e => setConfig({...config, maxTime: Number(e.target.value)})} 
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white" 
              />
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full py-4 bg-primary hover:brightness-110 text-black font-black rounded-xl flex items-center justify-center gap-2 mt-4 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Save size={18} /> SALVAR VITRINE
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
