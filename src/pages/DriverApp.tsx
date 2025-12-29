/**
 * ⚡ DRIVER APP - Mobile-First Delivery Interface ⚡
 * Dark mode, big buttons for gloves, Waze/Maps integration
 * 
 * Features:
 * - PIN-based login
 * - Order queue
 * - Navigation deep links
 * - Security PIN validation for delivery confirmation
 * - Photo proof for absent customers
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bike, MapPin, Navigation, Phone, Package,
  CheckCircle, Camera, X, ChevronRight, LogOut,
  AlertTriangle, Loader2
} from 'lucide-react';
import { 
  collection, query, where, onSnapshot, 
  doc, updateDoc, serverTimestamp, getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../config/firebase';
import { toast } from 'sonner';
import type { Order } from '../types/orders';
import type { Driver } from '../types/logistics';

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function DriverApp() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load orders assigned to this driver
  useEffect(() => {
    if (!driver) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('driverId', '==', driver.id),
      where('status', '==', 'dispatched')
    );

    const unsub = onSnapshot(ordersQuery, (snapshot) => {
      const orderList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(orderList);
    });

    return () => unsub();
  }, [driver]);

  // Handle delivery completion
  const handleDeliveryComplete = async (order: Order, proofUrl?: string) => {
    try {
      setLoading(true);
      
      // Get current position
      let coords: { lat: number; lng: number } | undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (e) {
          console.log('Geolocation not available');
        }
      }

      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'delivered',
        deliveredAt: serverTimestamp(),
        deliveryProofUrl: proofUrl || null,
        deliveryAttemptCoords: coords || null
      });

      // Update driver status back to available
      if (driver) {
        const driverRef = doc(db, 'drivers', driver.id);
        await updateDoc(driverRef, {
          currentStatus: orders.length <= 1 ? 'available' : 'busy' // If this was last order
        });
      }

      toast.success('Entrega confirmada!');
      setIsConfirmModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao confirmar entrega');
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setDriver(null);
    localStorage.removeItem('driverSession');
  };

  // If not logged in, show PIN login
  if (!driver) {
    return <DriverLogin onLogin={setDriver} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Bike className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-bold">{driver.name}</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-white/10 rounded-xl"
          >
            <LogOut className="w-5 h-5 text-white/40" />
          </button>
        </div>
      </header>

      <main className="p-4">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Minha Fila ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Bike className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <p className="text-xl font-bold text-white/40">Sem entregas no momento</p>
            <p className="text-sm text-white/30 mt-2">Novas entregas aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                {/* Customer Name */}
                <h3 className="text-2xl font-black mb-2">{order.customer.name}</h3>

                {/* Address - GIANT */}
                {order.customer.address && (
                  <div className="bg-white/5 rounded-xl p-4 mb-4">
                    <p className="text-xl font-bold leading-relaxed">
                      {order.customer.address.street}, {order.customer.address.number}
                    </p>
                    {order.customer.address.complement && (
                      <p className="text-lg text-white/60">{order.customer.address.complement}</p>
                    )}
                    <p className="text-lg text-primary font-bold mt-1">
                      {order.customer.address.neighborhood}
                    </p>
                    {order.customer.address.reference && (
                      <p className="text-sm text-white/40 mt-2">
                        📍 {order.customer.address.reference}
                      </p>
                    )}
                  </div>
                )}

                {/* Phone */}
                {order.customer.phone && (
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="flex items-center gap-3 p-4 bg-blue-500/20 rounded-xl mb-4"
                  >
                    <Phone className="w-6 h-6 text-blue-400" />
                    <span className="text-lg font-bold">{order.customer.phone}</span>
                  </a>
                )}

                {/* Navigation Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <a
                    href={`waze://?q=${encodeURIComponent(
                      order.customer.address 
                        ? `${order.customer.address.street}, ${order.customer.address.number}, ${order.customer.address.city}`
                        : ''
                    )}`}
                    className="flex items-center justify-center gap-2 py-4 bg-[#33CCFF] text-black rounded-xl font-bold text-lg"
                  >
                    <Navigation className="w-6 h-6" />
                    Waze
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      order.customer.address 
                        ? `${order.customer.address.street}, ${order.customer.address.number}, ${order.customer.address.city}`
                        : ''
                    )}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 py-4 bg-white text-black rounded-xl font-bold text-lg"
                  >
                    <MapPin className="w-6 h-6" />
                    Maps
                  </a>
                </div>

                {/* Confirm Delivery Button */}
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsConfirmModalOpen(true);
                  }}
                  className="w-full py-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  <CheckCircle className="w-8 h-8" />
                  CONFIRMAR ENTREGA
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {isConfirmModalOpen && selectedOrder && (
          <DeliveryConfirmModal
            order={selectedOrder}
            onConfirm={(proofUrl) => handleDeliveryComplete(selectedOrder, proofUrl)}
            onClose={() => {
              setIsConfirmModalOpen(false);
              setSelectedOrder(null);
            }}
            loading={loading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// LOGIN COMPONENT
// ══════════════════════════════════════════════════════════════════

function DriverLogin({ onLogin }: { onLogin: (driver: Driver) => void }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setError('PIN deve ter 4 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const driversQuery = query(
        collection(db, 'drivers'),
        where('pin', '==', pin),
        where('active', '==', true)
      );

      const snapshot = await getDocs(driversQuery);

      if (snapshot.empty) {
        setError('PIN inválido');
        setPin('');
        // Vibrate on error
        if (navigator.vibrate) navigator.vibrate(200);
      } else {
        const driver = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Driver;
        
        // Update status
        await updateDoc(doc(db, 'drivers', driver.id), {
          currentStatus: 'available'
        });

        localStorage.setItem('driverSession', JSON.stringify(driver));
        onLogin(driver);
        toast.success(`Bem-vindo, ${driver.name}!`);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
        <Bike className="w-10 h-10 text-green-400" />
      </div>

      <h1 className="text-2xl font-black mb-2">Modo Entregador</h1>
      <p className="text-white/40 mb-8">Digite seu PIN de 4 dígitos</p>

      {/* PIN Input */}
      <div className="flex gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black ${
              pin[i] ? 'border-green-500 bg-green-500/20' : 'border-white/20 bg-white/5'
            }`}
          >
            {pin[i] || ''}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => (
          <button
            key={i}
            disabled={num === null}
            onClick={() => {
              if (num === 'del') {
                setPin(pin.slice(0, -1));
              } else if (typeof num === 'number' && pin.length < 4) {
                setPin(pin + num);
              }
            }}
            className={`h-16 rounded-xl font-bold text-2xl transition-all ${
              num === null
                ? 'invisible'
                : num === 'del'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-white/10 hover:bg-white/20 active:scale-95'
            }`}
          >
            {num === 'del' ? '⌫' : num}
          </button>
        ))}
      </div>

      <button
        onClick={handleLogin}
        disabled={pin.length !== 4 || loading}
        className="w-full max-w-xs py-4 bg-green-500 rounded-xl font-black text-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'ENTRAR'}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// DELIVERY CONFIRMATION MODAL
// ══════════════════════════════════════════════════════════════════

interface DeliveryConfirmModalProps {
  order: Order;
  onConfirm: (proofUrl?: string) => void;
  onClose: () => void;
  loading: boolean;
}

function DeliveryConfirmModal({ order, onConfirm, onClose, loading }: DeliveryConfirmModalProps) {
  const [mode, setMode] = useState<'pin' | 'photo'>('pin');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate PIN
  const handlePinSubmit = () => {
    if (enteredPin === order.deliveryPin) {
      onConfirm();
    } else {
      setPinError(true);
      setEnteredPin('');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setTimeout(() => setPinError(false), 1000);
    }
  };

  // Handle photo capture
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Upload photo and confirm
  const handlePhotoSubmit = async () => {
    if (!photoFile) {
      toast.error('Tire uma foto do pacote');
      return;
    }

    setUploading(true);
    try {
      // For now, we'll skip actual upload and just confirm
      // In production, upload to Firebase Storage
      const mockUrl = `proof_${order.id}_${Date.now()}.jpg`;
      onConfirm(mockUrl);
    } catch (error) {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
    >
      {/* Header */}
      <div className="sticky top-0 bg-black border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
          <X className="w-6 h-6" />
        </button>
        <h2 className="font-bold">Confirmar Entrega</h2>
        <div className="w-10" />
      </div>

      {mode === 'pin' ? (
        <div className="p-6 flex flex-col items-center">
          <h3 className="text-xl font-bold mb-2">Digite o Código do Cliente</h3>
          <p className="text-white/40 text-sm mb-8 text-center">
            Peça o código de 4 dígitos que apareceu na confirmação do pedido
          </p>

          {/* PIN Display */}
          <div className={`flex gap-3 mb-6 ${pinError ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black transition-all ${
                  pinError 
                    ? 'border-red-500 bg-red-500/20' 
                    : enteredPin[i] 
                      ? 'border-green-500 bg-green-500/20' 
                      : 'border-white/20 bg-white/5'
                }`}
              >
                {enteredPin[i] || ''}
              </div>
            ))}
          </div>

          {pinError && (
            <p className="text-red-400 font-bold mb-4">Código Inválido!</p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => (
              <button
                key={i}
                disabled={num === null || loading}
                onClick={() => {
                  if (num === 'del') {
                    setEnteredPin(enteredPin.slice(0, -1));
                  } else if (typeof num === 'number' && enteredPin.length < 4) {
                    const newPin = enteredPin + num;
                    setEnteredPin(newPin);
                    // Auto-submit on 4 digits
                    if (newPin.length === 4) {
                      setTimeout(() => {
                        if (newPin === order.deliveryPin) {
                          onConfirm();
                        } else {
                          setPinError(true);
                          setEnteredPin('');
                          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                          setTimeout(() => setPinError(false), 1000);
                        }
                      }, 100);
                    }
                  }
                }}
                className={`h-16 rounded-xl font-bold text-2xl transition-all ${
                  num === null
                    ? 'invisible'
                    : num === 'del'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/10 hover:bg-white/20 active:scale-95'
                }`}
              >
                {num === 'del' ? '⌫' : num}
              </button>
            ))}
          </div>

          {/* Alternative: Photo proof */}
          <button
            onClick={() => setMode('photo')}
            className="text-white/40 text-sm underline"
          >
            Não tenho o código / Deixar na Portaria
          </button>
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center">
          <h3 className="text-xl font-bold mb-2">Comprovante de Entrega</h3>
          <p className="text-white/40 text-sm mb-6 text-center">
            Tire uma foto do pacote no local de entrega
          </p>

          {/* Photo Preview */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square max-w-xs bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center mb-6 overflow-hidden cursor-pointer"
          >
            {photoPreview ? (
              <img src={photoPreview} className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera className="w-16 h-16 text-white/20 mb-4" />
                <p className="text-white/40">Toque para tirar foto</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />

          <button
            onClick={handlePhotoSubmit}
            disabled={!photoFile || uploading}
            className="w-full max-w-xs py-4 bg-green-500 rounded-xl font-black text-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                CONFIRMAR COM FOTO
              </>
            )}
          </button>

          <button
            onClick={() => setMode('pin')}
            className="mt-4 text-white/40 text-sm underline"
          >
            Voltar para código
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-400" />
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </motion.div>
  );
}
