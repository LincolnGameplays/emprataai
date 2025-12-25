import { useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Star, Share2, Smartphone, Crown, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';
import { exportImage, supportsWebShare } from '../services/exportService';

interface ResultProps {
  imageUrl: string;
  onRestart: () => void;
}

export const Result = ({ imageUrl, onRestart }: ResultProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const plan = useAppStore((state) => state.plan);
  
  const isFree = plan === 'FREE';
  const isPro = plan === 'PRO';

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleExport = async (format: 'ifood' | 'whatsapp') => {
    try {
      setIsExporting(true);
      setExportError(null);
      
      await exportImage({
        imageUrl,
        userPlan: plan,
        format
      });
      
    } catch (error: any) {
      console.error('Export failed:', error);
      setExportError('Erro ao exportar imagem. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="flex flex-col min-h-screen p-6 pb-12"
    >
      <header className="py-4 text-center">
        <h2 className="text-2xl font-extrabold text-primary">Ficou show! 🤩</h2>
        <p className="text-text/60 font-medium">Seu rango nunca esteve tão bonito.</p>
      </header>

      {/* Main Result Image */}
      <div className="mt-6 relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white group">
        <img src={imageUrl} alt="Resultado" className="w-full aspect-[4/5] object-cover" />
        
        {/* Preview Watermark (visual only - real watermark applied on export) */}
        {isFree && (
          <div className="absolute bottom-4 right-4 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <p className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Emprata.ai Free</p>
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none transition-opacity"
        >
          <div className="bg-white/20 backdrop-blur-xl p-4 rounded-full border border-white/30">
            <Share2 className="w-8 h-8 text-white" />
          </div>
        </motion.div>
      </div>

      {/* Plan-Based Permission Banner */}
      {isFree && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-gradient-to-r from-orange-900/40 to-red-900/40 border-2 border-orange-500/30 p-4 rounded-3xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm text-orange-300 uppercase">Modo Grátis Ativado</h4>
            <p className="text-xs text-white/70 leading-tight mt-1">
              Marca d'água será aplicada no download. Faça upgrade para remover e desbloquear qualidade 8K.
            </p>
          </div>
        </motion.div>
      )}

      {isPro && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-2 border-yellow-500/50 p-4 rounded-3xl flex items-center gap-3"
        >
          <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <div>
            <h4 className="font-extrabold text-sm text-yellow-300 uppercase">Qualidade de Estúdio (8K)</h4>
            <p className="text-xs text-white/70 leading-tight mt-1">
              Sem marca d'água • Resolução máxima • Pronto para publicar
            </p>
          </div>
        </motion.div>
      )}

      {/* Export Error */}
      {exportError && (
        <div className="mt-4 bg-red-900/40 border border-red-500/50 p-3 rounded-2xl">
          <p className="text-sm text-red-300 font-bold">{exportError}</p>
        </div>
      )}

      {/* Export Actions */}
      <div className="mt-8 space-y-4">
        {/* Primary: Delivery Export */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleExport('ifood')}
          disabled={isExporting}
          className="w-full bg-primary text-white py-5 rounded-3xl font-extrabold text-xl flex items-center justify-center gap-3 shadow-orange shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-6 h-6" />
          {isExporting ? 'Exportando...' : 'Baixar Padrão Delivery'}
        </motion.button>

        {/* Secondary: WhatsApp Share */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleExport('whatsapp')}
          disabled={isExporting}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Smartphone className="w-5 h-5" />
          {supportsWebShare() ? 'Compartilhar no WhatsApp' : 'Baixar para WhatsApp'}
        </motion.button>

        {/* Tertiary: Try Another Vibe */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRestart}
          className="w-full bg-white border-4 border-gray-100 text-text/60 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 hover:border-primary/20 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Tentar outra Vibe
        </motion.button>
      </div>

      {/* Upgrade CTA for FREE users */}
      {isFree && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-gradient-to-r from-secondary to-primary p-4 rounded-3xl text-white flex items-center gap-4 shadow-lg shadow-orange-500/20"
        >
          <div className="bg-white/20 p-2 rounded-2xl">
            <Star className="w-6 h-6 fill-white" />
          </div>
          <div className="flex-grow">
            <h4 className="font-extrabold text-sm uppercase italic">Desbloqueie o Pro</h4>
            <p className="text-[10px] font-medium opacity-90 leading-tight">Remova a marca d'água e gere imagens em 4K.</p>
          </div>
          <button className="ml-auto bg-white text-primary text-[10px] font-extrabold px-3 py-2 rounded-xl uppercase tracking-wider shrink-0">
            Ver Planos
          </button>
        </motion.div>
      )}

      {/* Technical Info */}
      <div className="mt-8 text-center">
        <p className="text-xs text-white/30 font-bold uppercase tracking-wider">
          {isFree ? 'Formato: 1080x1080 JPEG • Com Marca d\'água' : 'Formato: 1080x1080 JPEG • Qualidade Premium'}
        </p>
      </div>
    </motion.div>
  );
};
