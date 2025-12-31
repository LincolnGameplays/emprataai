/**
 * ⚡ ADDRESS SELECTOR - Geolocation + Manual Input ⚡
 * Smart address picker with browser geolocation and CEP lookup
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, Home, Briefcase, Plus, 
  ChevronDown, Check, Loader2, X, AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import type { Address } from '../types/user';

// ══════════════════════════════════════════════════════════════════
// PROPS
// ══════════════════════════════════════════════════════════════════

interface AddressSelectorProps {
  savedAddresses?: Address[];
  selectedAddress?: Address | null;
  onSelect: (address: Address) => void;
  onSaveNew?: (address: Address) => void;
}

// ══════════════════════════════════════════════════════════════════
// CEP LOOKUP (ViaCEP API)
// ══════════════════════════════════════════════════════════════════

async function lookupCep(cep: string): Promise<Partial<Address> | null> {
  try {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;
    
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await res.json();
    
    if (data.erro) return null;
    
    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      postalCode: cleanCep,
    };
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function AddressSelector({
  savedAddresses = [],
  selectedAddress,
  onSelect,
  onSaveNew,
}: AddressSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isValidatingNumber, setIsValidatingNumber] = useState(false);

  const validateAddressCompleteness = () => {
    if (!newAddress.street || !newAddress.neighborhood || !newAddress.city) return false;
    if (!newAddress.number || newAddress.number.length < 1) return false;
    return true;
  };
  
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    label: 'casa',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    postalCode: '',
    reference: '',
  });

  // ════════════════════════════════════════════════════════════════
  // GEOLOCATION
  // ════════════════════════════════════════════════════════════════
  
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada');
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding with OpenStreetMap Nominatim (free)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          );
          const data = await res.json();
          
          if (data.address) {
            const addr = data.address;
            setNewAddress({
              ...newAddress,
              street: addr.road || addr.pedestrian || '',
              neighborhood: addr.suburb || addr.neighbourhood || '',
              city: addr.city || addr.town || addr.village || '',
              state: addr.state || '',
              postalCode: addr.postcode?.replace(/\D/g, '') || '',
              coords: { lat: latitude, lng: longitude },
            });
            setIsAddingNew(true);
            toast.success('Localização detectada!');
          }
        } catch {
          toast.error('Erro ao buscar endereço');
        }
        
        setIsLocating(false);
      },
      () => {
        toast.error('Permissão de localização negada');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ════════════════════════════════════════════════════════════════
  // CEP LOOKUP
  // ════════════════════════════════════════════════════════════════
  
  const handleCepChange = async (cep: string) => {
    setNewAddress({ ...newAddress, postalCode: cep });
    
    if (cep.replace(/\D/g, '').length === 8) {
      setIsCepLoading(true);
      const result = await lookupCep(cep);
      
      if (result) {
        setNewAddress(prev => ({ ...prev, ...result }));
        toast.success('CEP encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
      
      setIsCepLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // SAVE NEW ADDRESS
  // ════════════════════════════════════════════════════════════════
  
  const handleSaveNew = async () => {
    if (!validateAddressCompleteness()) {
      toast.error('Endereço incompleto. Verifique rua e número.');
      return;
    }

    setIsValidatingNumber(true);
    
    // Simulação de validação "Inteligente" (UX)
    await new Promise(resolve => setTimeout(resolve, 800)); 
    setIsValidatingNumber(false);

    const address: Address = {
      id: `addr_${Date.now()}`,
      label: newAddress.label || 'outro',
      street: newAddress.street || '',
      number: newAddress.number || '',
      complement: newAddress.complement,
      neighborhood: newAddress.neighborhood || '',
      city: newAddress.city || '',
      state: newAddress.state || '',
      postalCode: newAddress.postalCode || '',
      reference: newAddress.reference,
      coords: newAddress.coords,
    };

    onSaveNew?.(address);
    onSelect(address);
    setIsAddingNew(false);
    setIsOpen(false);
    toast.success('Endereço validado e salvo!');
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════

  const labelIcons = {
    casa: <Home className="w-4 h-4" />,
    trabalho: <Briefcase className="w-4 h-4" />,
    outro: <MapPin className="w-4 h-4" />,
  };

  return (
    <div className="relative">
      {/* Selected Address Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 hover:bg-white/10 transition-colors"
      >
        <MapPin className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 text-left">
          {selectedAddress ? (
            <>
              <p className="text-sm font-bold text-white truncate">
                {selectedAddress.street}, {selectedAddress.number}
              </p>
              <p className="text-xs text-white/40 truncate">
                {selectedAddress.neighborhood} • {selectedAddress.city}
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-white/50">
              Selecione um endereço
            </p>
          )}
        </div>
        <ChevronDown className="w-5 h-5 text-white/40" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#121212] border border-white/10 rounded-3xl overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h3 className="font-black text-lg">
                  {isAddingNew ? 'Novo Endereço' : 'Onde você está?'}
                </h3>
                <button
                  onClick={() => {
                    if (isAddingNew) {
                      setIsAddingNew(false);
                    } else {
                      setIsOpen(false);
                    }
                  }}
                  className="p-2 hover:bg-white/5 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isAddingNew ? (
                /* New Address Form */
                <div className="p-6 space-y-4">
                  {/* Label Selector */}
                  <div className="flex gap-2">
                    {(['casa', 'trabalho', 'outro'] as const).map((label) => (
                      <button
                        key={label}
                        onClick={() => setNewAddress({ ...newAddress, label })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-bold transition-all ${
                          newAddress.label === label
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'border-white/10 text-white/50 hover:bg-white/5'
                        }`}
                      >
                        {labelIcons[label]}
                        <span className="capitalize">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* CEP */}
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1 block">
                      CEP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newAddress.postalCode}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                      />
                      {isCepLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
                      )}
                    </div>
                  </div>

                  {/* Street + Number */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1 block">
                        Rua
                      </label>
                      <input
                        type="text"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1 block">
                        Nº
                      </label>
                      <div className="relative">
                        <input
                            type="text"
                            value={newAddress.number}
                            onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                            className={`w-full bg-black/50 border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors ${
                                !newAddress.number ? 'border-red-500/50' : 'border-white/10 focus:border-primary'
                            }`}
                        />
                        {!newAddress.number && (
                            <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                        )}
                      </div>
                      {!newAddress.number && (
                        <p className="text-[10px] text-red-400 mt-1">* Obrigatório</p>
                      )}
                    </div>
                  </div>

                  {/* Complement + Neighborhood */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1 block">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={newAddress.complement}
                        onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                        placeholder="Apto, Bloco..."
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1 block">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={newAddress.neighborhood}
                        onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Reference */}
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1 block">
                      Ponto de Referência
                    </label>
                    <input
                      type="text"
                      value={newAddress.reference}
                      onChange={(e) => setNewAddress({ ...newAddress, reference: e.target.value })}
                      placeholder="Próximo ao mercado..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveNew}
                    disabled={isValidatingNumber}
                    className="w-full py-4 bg-primary hover:bg-orange-600 rounded-2xl font-black uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isValidatingNumber ? (
                        <><Loader2 className="animate-spin w-4 h-4" /> Validando...</>
                    ) : (
                        'Confirmar Endereço'
                    )}
                  </button>
                </div>
              ) : (
                /* Address List */
                <div className="p-4 space-y-2">
                  {/* Geolocate Button */}
                  <button
                    onClick={handleGeolocate}
                    disabled={isLocating}
                    className="w-full flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-2xl hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <Navigation className="w-5 h-5 text-primary" />
                    )}
                    <span className="font-bold text-primary">
                      {isLocating ? 'Buscando localização...' : 'Usar minha localização'}
                    </span>
                  </button>

                  {/* Saved Addresses */}
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => {
                        onSelect(addr);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                        selectedAddress?.id === addr.id
                          ? 'bg-white/10 border-primary'
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      {labelIcons[addr.label]}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-white">
                          {addr.street}, {addr.number}
                        </p>
                        <p className="text-xs text-white/40">
                          {addr.neighborhood} • {addr.city}
                        </p>
                      </div>
                      {selectedAddress?.id === addr.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}

                  {/* Add New */}
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-2xl text-white/50 hover:text-white hover:border-white/20 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-bold">Adicionar novo endereço</span>
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
