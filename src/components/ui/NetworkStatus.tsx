/**
 * 📶 Network Status Monitor - Enterprise Offline Indicator
 * 
 * Shows a visual indicator when the app is running offline.
 * Notifies user when connection is lost/restored.
 * 
 * Features:
 * - Real-time connection monitoring
 * - Toast notifications for status changes
 * - Persistent bottom indicator when offline
 * - Pending sync count (future enhancement)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { toast } from 'sonner';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // Only show reconnection message if we were actually offline
      if (wasOffline) {
        setShowReconnected(true);
        toast.success("Conexão restabelecida!", { 
          description: "Sincronizando dados com a nuvem...",
          icon: <RefreshCw className="animate-spin text-green-500" size={18} />,
          duration: 4000
        });
        
        // Hide the "reconnected" indicator after 3 seconds
        setTimeout(() => setShowReconnected(false), 3000);
      }
      
      setWasOffline(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      
      toast.warning("Você está OFFLINE", { 
        description: "Modo de Segurança ativado. Seus dados serão salvos localmente.",
        icon: <WifiOff className="text-yellow-500" size={18} />,
        duration: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* OFFLINE INDICATOR - Fixed bottom-left banner */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-4 left-4 z-[9999] bg-gradient-to-r from-red-600 to-red-500 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-red-500/30 flex items-center gap-4"
          >
            <div className="bg-white/20 p-2.5 rounded-xl">
              <WifiOff size={22} />
            </div>
            <div>
              <p className="font-bold text-sm">Modo Offline Ativo</p>
              <p className="text-xs text-white/80 mt-0.5">
                Dados salvos localmente • Sincronia pendente
              </p>
            </div>
            
            {/* Pulsing dot */}
            <div className="absolute top-2 right-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/50 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* RECONNECTED INDICATOR - Temporary green banner */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showReconnected && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-4 left-4 z-[9999] bg-gradient-to-r from-green-600 to-emerald-500 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-green-500/30 flex items-center gap-4"
          >
            <div className="bg-white/20 p-2.5 rounded-xl">
              <RefreshCw size={22} className="animate-spin" />
            </div>
            <div>
              <p className="font-bold text-sm">Reconectado!</p>
              <p className="text-xs text-white/80 mt-0.5">
                Sincronizando dados com a nuvem...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
