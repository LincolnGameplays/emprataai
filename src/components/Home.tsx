import { motion } from 'framer-motion';
import { Camera, ChevronRight } from 'lucide-react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

interface HomeProps {
  onStart: () => void;
}

export const Home = ({ onStart }: HomeProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col min-h-screen p-6 pb-24"
    >
      {/* Header */}
      <header className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">
          Emprata<span className="text-secondary">.ai</span>
        </h1>
        <button className="text-sm font-semibold text-text/60 px-4 py-2 hover:text-primary transition-colors">
          Entrar
        </button>
      </header>

      {/* Hero Content */}
      <div className="mt-8 space-y-4">
        <h2 className="text-4xl font-extrabold leading-tight text-text">
          Sua comida merece uma foto de capa.
        </h2>
        <p className="text-lg text-text/70 font-medium">
          IA que transforma fotos de celular em vitrines profissionais pra apps de delivery.
        </p>
      </div>

      {/* Before/After Slider */}
      <div className="mt-10 overflow-hidden rounded-3xl shadow-orange-glow border-4 border-white">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage 
              src="https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=800&auto=format&fit=crop" 
              alt="Antes - Foto Caseira" 
            />
          }
          itemTwo={
            <ReactCompareSliderImage 
              src="https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1200&auto=format&fit=crop" 
              alt="Depois - Profissional" 
            />
          }
          style={{ width: '100%', height: '350px' }}
        />
        <div className="bg-white p-3 flex justify-between items-center text-xs font-bold text-text/40 uppercase tracking-widest px-6">
          <span>Antes</span>
          <span>Depois</span>
        </div>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="w-full max-w-md bg-primary text-white py-5 rounded-3xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-3 text-xl font-extrabold"
        >
          <Camera className="w-6 h-6" />
          Começar Agora
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Social Proof / Trust */}
      <div className="mt-12 text-center">
        <p className="text-xs font-bold text-text/30 uppercase tracking-tighter">
          +1.200 CHEFS JÁ USANDO NO BRASIL
        </p>
      </div>
    </motion.div>
  );
};
