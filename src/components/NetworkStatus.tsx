/**
 * ⚡ NETWORK STATUS - Offline Detection Banner ⚡
 * Shows red banner when connection is lost
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine);
    setShowBanner(!navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Show "back online" briefly then hide
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-0 left-0 right-0 z-[100] px-4 py-3 ${
            isOnline 
              ? 'bg-green-500' 
              : 'bg-red-500'
          }`}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"
                  >
                    ✓
                  </motion.div>
                  <span className="font-bold text-sm">
                    Conexão restaurada! ✨
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5" />
                  <div>
                    <span className="font-bold text-sm block">
                      Você está Offline
                    </span>
                    <span className="text-xs text-white/80">
                      Modo de Contingência Ativado. Algumas funções podem não funcionar.
                    </span>
                  </div>
                </>
              )}
            </div>

            {!isOnline && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook for checking network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
