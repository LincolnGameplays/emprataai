import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pizza, Utensils, Sandwich, ChefHat } from 'lucide-react';

const LOADING_TEXTS = [
  "Acendendo o fogão...",
  "Contratando o fotógrafo...",
  "Arrumando a mesa...",
  "Passando um pano...",
  "Temperando a lente...",
  "Finalizando o empratamento..."
];

const ICONS = [Pizza, Utensils, Sandwich, ChefHat];

export const Loading = () => {
  const [textIndex, setTextIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 800);

    const iconInterval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % ICONS.length);
    }, 1500);

    return () => {
      clearInterval(textInterval);
      clearInterval(iconInterval);
    };
  }, []);

  const ActiveIcon = ICONS[iconIndex];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-primary z-50 flex flex-col items-center justify-center text-white p-8"
    >
      <div className="relative">
        {/* Outer Glow */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-white/20 rounded-full blur-3xl"
        />
        
        {/* Animated Icon Container */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="w-32 h-32 border-4 border-dashed border-white/50 rounded-full flex items-center justify-center"
        >
          <motion.div
            key={iconIndex}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="w-16 h-16 bg-white text-primary rounded-full flex items-center justify-center shadow-xl"
          >
            <ActiveIcon className="w-8 h-8" />
          </motion.div>
        </motion.div>
      </div>

      <div className="mt-12 h-20 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold mb-4 uppercase tracking-tighter italic">Chef Mode</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={textIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xl font-bold text-white/90 text-center"
          >
            {LOADING_TEXTS[textIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress Bar (Visual only) */}
      <div className="mt-8 w-48 h-2 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-full h-full bg-white"
        />
      </div>

      <div className="absolute bottom-12 text-center opacity-60">
        <p className="text-xs font-bold uppercase tracking-widest">A inteligência está cozinhando...</p>
      </div>
    </motion.div>
  );
};
