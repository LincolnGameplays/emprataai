/**
 * 🎨 Storefront Settings - Advanced Visual Customization
 * 
 * Allows restaurant owners to customize their digital menu:
 * - Brand colors
 * - Cover image
 * - Delivery fee (fixed or per KM)
 * - Opening hours
 * - Minimum order
 * 
 * Changes reflect instantly on PublicMenu
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';
import { 
  MapPin, Palette, Clock, Image as ImageIcon, Save, Loader2,
  DollarSign, ShoppingBag, Eye, ExternalLink, Truck
} from 'lucide-react';
import { toast } from 'sonner';

interface StorefrontConfig {
  primaryColor: string;
  coverImage: string;
  logo?: string;
  deliveryFeeType: 'FIXED' | 'KM';
  fixedFee: number;
  feePerKm: number;
  minOrder: number;
  maxDeliveryRadius: number; // km
  openingHours: {
    start: string;
    end: string;
  };
  closedDays: string[]; // ['sunday', 'monday']
  acceptsPickup: boolean;
  acceptsDelivery: boolean;
  acceptsDineIn: boolean;
}

const DEFAULT_CONFIG: StorefrontConfig = {
  primaryColor: '#22c55e',
  coverImage: '',
  deliveryFeeType: 'FIXED',
  fixedFee: 5.00,
  feePerKm: 1.50,
  minOrder: 0,
  maxDeliveryRadius: 10,
  openingHours: { start: '18:00', end: '23:00' },
  closedDays: [],
  acceptsPickup: true,
  acceptsDelivery: true,
  acceptsDineIn: false
};

const PRESET_COLORS = [
  '#22c55e', // Green
  '#f97316', // Orange
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#000000', // Black
];

const WEEKDAYS = [
  { id: 'sunday', label: 'Dom' },
  { id: 'monday', label: 'Seg' },
  { id: 'tuesday', label: 'Ter' },
  { id: 'wednesday', label: 'Qua' },
  { id: 'thursday', label: 'Qui' },
  { id: 'friday', label: 'Sex' },
  { id: 'saturday', label: 'Sáb' },
];

export default function StorefrontSettings() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StorefrontConfig>(DEFAULT_CONFIG);

  // Load settings
  useEffect(() => {
    if (!user?.uid) return;
    
    getDoc(doc(db, 'users', user.uid)).then(d => {
      const data = d.data();
      if (data?.storefront) {
        setSettings({ ...DEFAULT_CONFIG, ...data.storefront });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.uid]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user!.uid), { storefront: settings });
      toast.success("Configurações salvas! Seu cardápio foi atualizado.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar configurações.");
    }
    setSaving(false);
  };

  const toggleClosedDay = (day: string) => {
    const current = settings.closedDays || [];
    if (current.includes(day)) {
      setSettings({ ...settings, closedDays: current.filter(d => d !== day) });
    } else {
      setSettings({ ...settings, closedDays: [...current, day] });
    }
  };

  const menuUrl = userData?.slug ? `/menu/${userData.slug}` : '#';

  if (loading) {
    return (
      <div className="bg-[#121212] p-8 rounded-[2rem] border border-white/5 flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-white/30" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-[#121212] p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Aparência & Regras</h2>
          <p className="text-white/50 text-sm">Personalize seu cardápio digital</p>
        </div>
        <div className="flex gap-3">
          <a 
            href={menuUrl}
            target="_blank"
            className="px-4 py-2 rounded-xl border border-white/10 text-white/60 font-bold flex items-center gap-2 hover:bg-white/5 transition-colors"
          >
            <Eye size={16} /> Preview
            <ExternalLink size={12} />
          </a>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="bg-white text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} 
            Salvar
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VISUAL IDENTITY */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-white/40 uppercase flex items-center gap-2">
            <Palette size={14}/> Identidade Visual
          </h3>
          
          {/* Primary Color */}
          <div>
            <label className="text-white text-sm block mb-3">Cor da Marca</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSettings({...settings, primaryColor: color})}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    settings.primaryColor === color 
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#121212] scale-110' 
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="relative">
                <input 
                  type="color" 
                  value={settings.primaryColor}
                  onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                  className="w-10 h-10 rounded-xl border-2 border-dashed border-white/20 cursor-pointer bg-transparent"
                />
              </div>
            </div>
            <p className="text-[10px] text-white/30 mt-2">
              Afeta botões, ícones e destaques do cardápio
            </p>
          </div>

          {/* Cover Image */}
          <div>
            <label className="text-white text-sm block mb-2">Banner de Capa</label>
            <div className="flex gap-2">
              <div className="bg-black p-3 rounded-xl border border-white/10 flex-1 flex items-center gap-2">
                <ImageIcon size={16} className="text-white/40 shrink-0" />
                <input 
                  value={settings.coverImage}
                  onChange={e => setSettings({...settings, coverImage: e.target.value})}
                  placeholder="https://exemplo.com/banner.jpg"
                  className="bg-transparent outline-none w-full text-white text-sm"
                />
              </div>
            </div>
            {settings.coverImage && (
              <div className="mt-3 rounded-xl overflow-hidden h-32 bg-black">
                <img 
                  src={settings.coverImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DELIVERY SETTINGS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-white/40 uppercase flex items-center gap-2">
            <Truck size={14}/> Regras de Entrega
          </h3>
          
          {/* Fee Type Toggle */}
          <div className="flex bg-black p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setSettings({...settings, deliveryFeeType: 'FIXED'})}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                settings.deliveryFeeType === 'FIXED' 
                  ? 'bg-white text-black' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Taxa Fixa
            </button>
            <button 
              onClick={() => setSettings({...settings, deliveryFeeType: 'KM'})}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                settings.deliveryFeeType === 'KM' 
                  ? 'bg-white text-black' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Por KM
            </button>
          </div>

          {/* Fee Value */}
          {settings.deliveryFeeType === 'FIXED' ? (
            <div>
              <label className="text-white text-sm block mb-2">Valor da Taxa</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={settings.fixedFee}
                  onChange={e => setSettings({...settings, fixedFee: parseFloat(e.target.value) || 0})}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-white/30 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm block mb-2">Valor por KM</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">R$</span>
                  <input 
                    type="number"
                    step="0.10" 
                    min="0"
                    value={settings.feePerKm}
                    onChange={e => setSettings({...settings, feePerKm: parseFloat(e.target.value) || 0})}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-white/30 outline-none"
                  />
                </div>
                <p className="text-[10px] text-white/30 mt-1">
                  Calculado pelo Google Maps no checkout
                </p>
              </div>
              <div>
                <label className="text-white text-sm block mb-2">Raio Máximo (km)</label>
                <input 
                  type="number" 
                  min="1"
                  max="50"
                  value={settings.maxDeliveryRadius}
                  onChange={e => setSettings({...settings, maxDeliveryRadius: parseInt(e.target.value) || 10})}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-white/30 outline-none"
                />
              </div>
            </div>
          )}

          {/* Minimum Order */}
          <div>
            <label className="text-white text-sm block mb-2">Pedido Mínimo</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">R$</span>
              <input 
                type="number" 
                step="1"
                min="0"
                value={settings.minOrder}
                onChange={e => setSettings({...settings, minOrder: parseFloat(e.target.value) || 0})}
                className="w-full bg-black border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-white/30 outline-none"
              />
            </div>
            <p className="text-[10px] text-white/30 mt-1">
              0 = sem mínimo
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* OPERATING HOURS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="pt-6 border-t border-white/5 space-y-6">
        <h3 className="text-sm font-bold text-white/40 uppercase flex items-center gap-2">
          <Clock size={14}/> Horário de Funcionamento
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Hours */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-white/60 text-xs block mb-2">Abre às</label>
              <input 
                type="time" 
                value={settings.openingHours.start}
                onChange={e => setSettings({
                  ...settings, 
                  openingHours: {...settings.openingHours, start: e.target.value}
                })}
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-white/30 outline-none"
              />
            </div>
            <span className="text-white/30 mt-6">até</span>
            <div className="flex-1">
              <label className="text-white/60 text-xs block mb-2">Fecha às</label>
              <input 
                type="time" 
                value={settings.openingHours.end}
                onChange={e => setSettings({
                  ...settings, 
                  openingHours: {...settings.openingHours, end: e.target.value}
                })}
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-white/30 outline-none"
              />
            </div>
          </div>

          {/* Closed Days */}
          <div>
            <label className="text-white/60 text-xs block mb-2">Dias Fechados</label>
            <div className="flex gap-2">
              {WEEKDAYS.map(day => (
                <button
                  key={day.id}
                  onClick={() => toggleClosedDay(day.id)}
                  className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                    settings.closedDays?.includes(day.id)
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Types */}
        <div>
          <label className="text-white/60 text-xs block mb-3">Tipos de Pedido Aceitos</label>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setSettings({...settings, acceptsDelivery: !settings.acceptsDelivery})}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                settings.acceptsDelivery 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-white/5 text-white/40 border border-white/10'
              }`}
            >
              <Truck size={14} /> Delivery
            </button>
            <button
              onClick={() => setSettings({...settings, acceptsPickup: !settings.acceptsPickup})}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                settings.acceptsPickup 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-white/5 text-white/40 border border-white/10'
              }`}
            >
              <ShoppingBag size={14} /> Retirada
            </button>
            <button
              onClick={() => setSettings({...settings, acceptsDineIn: !settings.acceptsDineIn})}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                settings.acceptsDineIn 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-white/5 text-white/40 border border-white/10'
              }`}
            >
              <MapPin size={14} /> Comer no Local
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
