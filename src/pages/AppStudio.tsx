import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Download, RefreshCw, Share2, ChevronLeft, Lock, Coins,
  Plus, Info, X, Zap, Box, MousePointer2, Utensils, Sparkles, Loader2, Shield, Aperture
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import confetti from 'canvas-confetti';
import { useAppStore, FoodVibe, Perspective } from '../store/useAppStore';
import { generateFoodImage } from '../services/neuralEngine';
import PaywallModal from '../components/PaywallModal';
import { AdminModal } from '../components/AdminModal';
import { AuthModal } from '../components/AuthModal';
import { UserDropdown } from '../components/UserDropdown';
import { useAuth } from '../hooks/useAuth';
import { useImageDownloader } from '../hooks/useImageDownloader';
import { VIBES } from '../constants/vibes';

// Admin email - set via environment variable
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

// Professional Photography Angles
const PERSPECTIVES: { id: Perspective; label: string; subLabel: string; icon: any }[] = [
  { id: 'top', label: 'Flat Lay', subLabel: '90°', icon: Box },
  { id: 'diagonal', label: "Diner's Eye", subLabel: '45°', icon: MousePointer2 },
  { id: 'front', label: 'The Hero', subLabel: '0°', icon: Utensils },
  { id: 'macro', label: 'Macro', subLabel: 'Close', icon: Aperture },
];

export default function AppStudio() {
  const store = useAppStore();
  const { user } = useAuth();
  const { downloadImage, isDownloading, error: downloadError } = useImageDownloader();
  
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is admin
  const isAdmin = user?.email === ADMIN_EMAIL;

  // --- Client-Side Image Cropping Utility (v4.0) ---
  const cropImageToSquare = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        console.log("✂️ Cortando imagem para 1080x1080...");
        
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        canvas.width = 1080;
        canvas.height = 1080;

        ctx.drawImage(img, x, y, size, size, 0, 0, 1080, 1080);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              console.log("✅ Imagem cortada:", croppedFile.size, "bytes");
              resolve(croppedFile);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          0.95
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for cropping'));
      img.src = URL.createObjectURL(file);
    });
  };

  // --- Image Preloading Effect ---
  useEffect(() => {
    if (store.generatedImage) {
      setIsLoadingImage(true);
      setIsImageLoaded(false);

      const img = new Image();
      img.onload = () => {
        console.log("✅ Imagem carregada com sucesso");
        setIsImageLoaded(true);
        setIsLoadingImage(false);
      };
      img.onerror = () => {
        console.error("❌ Erro ao carregar imagem");
        setErrorMessage("Erro ao carregar a imagem gerada.");
        setIsLoadingImage(false);
        store.setGeneratedImage(null);
      };
      img.src = store.generatedImage;
    } else {
      setIsImageLoaded(false);
      setIsLoadingImage(false);
    }
  }, [store.generatedImage]);

  // Show download errors
  useEffect(() => {
    if (downloadError) {
      setErrorMessage(downloadError);
    }
  }, [downloadError]);

  // --- File Upload Handler with Cropping ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCropping(true);
        setErrorMessage(null);
        
        const croppedFile = await cropImageToSquare(file);
        const url = URL.createObjectURL(croppedFile);
        
        store.setOriginalImage(url, croppedFile);
        setIsCropping(false);
      } catch (error) {
        console.error("Erro ao processar imagem:", error);
        setErrorMessage("Erro ao processar a imagem.");
        setIsCropping(false);
      }
    }
  };

  // --- Vibe Selection Handler (FIXED for PRO users) ---
  const handleVibeSelect = (vibeId: FoodVibe, isPro: boolean) => {
    // Normalize plan comparison to lowercase
    const userPlan = store.plan.toLowerCase();
    
    // Block FREE users from PRO vibes
    if (isPro && userPlan === 'free') {
      setIsPaywallOpen(true);
      return;
    }
    
    // Allow selection for PRO/STARTER users or free vibes
    store.setVibe(vibeId);
  };

  // --- Main Generation Handler ---
  const onGenerate = async () => {
    if (!store.originalImage || !store.originalFile || store.isGenerating) return;
    
    if (store.plan === 'FREE' && store.credits <= 0) {
      setIsPaywallOpen(true);
      return;
    }

    store.setIsGenerating(true);
    setErrorMessage(null);
    
    try {
      setProcessingStage('Identificando textura...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProcessingStage('Ajustando iluminação...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProcessingStage('Empratando...');
      
      const response = await generateFoodImage({
        file: store.originalFile,
        vibe: store.selectedVibe,
        angle: store.selectedPerspective,
        lightIntensity: store.lightIntensity
      });
      
      if (response.success && response.imageUrl) {
        console.log("🎨 URL recebida:", response.imageUrl);
        store.setGeneratedImage(response.imageUrl);
        store.useCredit();
        
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#ff5e00', '#FFC107', '#FFFFFF'],
            ticks: 300
          });
        }, 500);
      } else {
        setErrorMessage(response.error || "A Engine Neural falhou.");
      }

    } catch (error) {
      console.error(error);
      setErrorMessage("Erro de conexão.");
    } finally {
      store.setIsGenerating(false);
      setProcessingStage('');
    }
  };

  // --- Direct Download Handler (Canvas-based with Auth Protection) ---
  const handleDownload = async () => {
    if (!store.generatedImage) return;
    
    // Check authentication
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    
    try {
      await downloadImage(store.generatedImage, store.plan);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // --- Control Panel Content (Reusable) ---
  const ControlPanelContent = () => (
    <div className="space-y-6 md:space-y-12 pb-safe">
      {/* Vibe Selection */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Vibe da Foto</h3>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        {/* Mobile: Horizontal Scroll | Desktop: Grid */}
        <div className="flex md:grid md:grid-cols-2 gap-3 overflow-x-auto md:overflow-x-visible no-scrollbar pb-2 px-4 md:px-0 scroll-px-4">
          {VIBES.map((vibe) => {
            const isLocked = vibe.isPro && store.plan.toLowerCase() === 'free';
            
            return (
              <button
                key={vibe.id}
                onClick={() => handleVibeSelect(vibe.id, vibe.isPro)}
                className={`flex-shrink-0 w-24 h-24 md:w-auto md:aspect-square rounded-2xl md:rounded-[2rem] overflow-hidden border-2 transition-all duration-300 group ${store.selectedVibe === vibe.id ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-white/5'}`}
              >
                <div className="relative w-full h-full">
                  <img src={vibe.image} alt={vibe.name} className={`w-full h-full object-cover transition-transform duration-700 ${store.selectedVibe === vibe.id ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-2 md:p-5">
                    <span className="text-[9px] md:text-xs font-black uppercase tracking-tight italic">{vibe.name}</span>
                  </div>
                  {isLocked && (
                    <div className="absolute top-2 right-2 w-6 h-6 md:w-8 md:h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                      <Lock className="w-3 h-3 md:w-4 md:h-4 text-amber-500 fill-current" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Perspective Selection */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">Ângulo</h3>
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {PERSPECTIVES.map((p) => (
            <button
              key={p.id}
              onClick={() => store.setPerspective(p.id)}
              className={`flex flex-col items-center gap-1 md:gap-2 p-2 md:p-4 rounded-2xl md:rounded-3xl border-2 transition-all ${store.selectedPerspective === p.id ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 border-white/5 text-white/40'}`}
            >
              <p.icon className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tight">{p.label}</span>
              <span className="text-[7px] md:text-[8px] font-bold text-white/60">{p.subLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lighting Intensity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Luz</h3>
          <span className="text-sm font-black text-primary italic">{store.lightIntensity}%</span>
        </div>
        <div className="relative h-10 md:h-12 flex items-center">
          <div className="absolute inset-x-0 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-900 via-primary to-amber-200" style={{ width: `${store.lightIntensity}%` }} />
          </div>
          <input 
            type="range" 
            min="0" max="100" 
            value={store.lightIntensity}
            disabled={store.plan === 'FREE'}
            onChange={(e) => store.setLightIntensity(parseInt(e.target.value))}
            className={`absolute inset-x-0 appearance-none bg-transparent cursor-pointer z-10 h-10 md:h-12 ${store.plan === 'FREE' ? 'cursor-not-allowed opacity-50' : ''}`}
          />
        </div>
        {store.plan === 'FREE' && (
          <div onClick={() => setIsPaywallOpen(true)} className="flex items-center gap-2 mt-3 text-[9px] md:text-[10px] font-bold text-amber-500 uppercase cursor-pointer">
            <Lock className="w-3 h-3" /> PRO
          </div>
        )}
      </div>

      {/* Generate Button */}
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onGenerate}
        disabled={!store.originalImage || store.isGenerating || (store.plan === 'FREE' && store.credits <= 0)}
        className={`w-full py-6 md:py-8 rounded-3xl md:rounded-[2.5rem] font-black text-lg md:text-2xl uppercase italic tracking-ultra-tight flex items-center justify-center gap-3 md:gap-4 transition-all shadow-2xl shimmer ${store.originalImage && !store.isGenerating ? 'bg-primary text-white shadow-orange-intense' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
      >
        {store.isGenerating ? (
          <RefreshCw className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
        ) : (
          <>
            <Zap className="w-6 h-6 md:w-8 md:h-8 fill-current" />
            GERAR MÁGICA
          </>
        )}
      </motion.button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] w-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row font-sans overflow-hidden">
      
      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} />
      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} userId={user?.uid || ''} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Admin Button (Floating - Top Left) */}
      {isAdmin && (
        <button
          onClick={() => setIsAdminOpen(true)}
          className="fixed top-4 left-4 z-[100] w-12 h-12 bg-primary/20 hover:bg-primary/40 border-2 border-primary/50 rounded-full flex items-center justify-center backdrop-blur-xl transition-all hover:scale-110 shadow-lg shadow-primary/20"
          title="Admin Mode"
        >
          <Shield className="w-6 h-6 text-primary" />
        </button>
      )}

      {/* Mobile Header (Floating) */}
      <header className="md:hidden absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <Link to="/" className="text-white/60 hover:text-white transition-colors">
          <ChevronLeft className="w-7 h-7" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${store.credits > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
              {store.plan === 'PRO' ? '∞' : store.credits}
            </span>
          </div>
          {store.generatedImage && isImageLoaded && (
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-2 bg-primary rounded-full disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex h-20 w-full border-b border-white/5 items-center justify-between px-8 bg-[#0a0a0a]/80 backdrop-blur-3xl z-40 absolute top-0 left-0 right-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-white/40 hover:text-white transition-colors">
            <ChevronLeft className="w-8 h-8" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic tracking-ultra-tight leading-none">
              Emprata<span className="text-primary">.ai</span> Studio
            </h1>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">v10.0 Admin Ready</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <UserDropdown onOpenAdmin={() => setIsAdminOpen(true)} />
          
          <button 
            onClick={handleDownload}
            disabled={!store.generatedImage || !isImageLoaded || isDownloading}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all ${store.generatedImage && isImageLoaded && !isDownloading ? 'bg-primary text-white shadow-orange-glow hover:scale-105 active:scale-95' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
          >
            {isDownloading ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
      </header>

      {/* Error Toast */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-xl px-4 md:px-6 py-3 md:py-4 rounded-2xl border border-red-400/50 shadow-2xl flex items-center gap-3 md:gap-4 max-w-[90%] md:max-w-none"
          >
            <Info className="w-4 h-4 md:w-5 md:h-5 text-white flex-shrink-0" />
            <p className="text-xs md:text-sm font-bold text-white uppercase tracking-tight">{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
              <X className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Left) */}
      <aside className="hidden md:flex w-[400px] h-full border-r border-white/5 flex-col bg-[#0a0a0a] z-10 overflow-y-auto no-scrollbar mt-20">
        <div className="p-8">
          <ControlPanelContent />
        </div>
      </aside>

      {/* Canvas Area */}
      <section className="flex-1 relative min-h-0 flex items-center justify-center bg-[#0a0a0a] overflow-hidden 
                          h-[55%] md:h-full w-full md:flex-1 md:mt-20">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <AnimatePresence mode="wait">
          {!store.originalImage ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              onClick={() => !isCropping && fileInputRef.current?.click()}
              className={`group flex flex-col items-center ${isCropping ? 'cursor-wait' : 'cursor-pointer'}`}
            >
              <div className="w-32 h-32 md:w-56 md:h-56 bg-white/5 border-2 border-dashed border-white/20 rounded-3xl md:rounded-[4rem] flex items-center justify-center text-white/20 group-hover:border-primary group-hover:text-primary transition-all duration-500 relative">
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-all duration-500 rounded-3xl md:rounded-[4rem]" />
                {isCropping ? (
                  <Loader2 className="w-12 h-12 md:w-20 md:h-20 animate-spin text-primary" />
                ) : (
                  <Camera className="w-12 h-12 md:w-20 md:h-20" />
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*"
                  disabled={isCropping}
                />
              </div>
              <div className="mt-6 md:mt-10 text-center px-4">
                <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-ultra-tight mb-1 md:mb-2">
                  {isCropping ? 'Processando...' : 'Sirva seu Rango'}
                </h2>
                <p className="text-white/30 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                  {isCropping ? 'Cortando para 1080x1080' : 'Toque para buscar'}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
            >
              <div className="relative w-full h-full max-w-5xl max-h-5xl flex items-center justify-center">
                <div className="relative shadow-[0_50px_100px_-30px_rgba(0,0,0,1)] border-4 md:border-[12px] border-white/5 rounded-2xl md:rounded-3xl overflow-hidden bg-black w-full h-full max-w-full max-h-full aspect-square">
                  {store.generatedImage && isImageLoaded ? (
                    <div className="relative w-full h-full">
                      <ReactCompareSlider
                        itemOne={
                          <div className="relative h-full flex items-center justify-center bg-black">
                            <ReactCompareSliderImage 
                              src={store.originalImage} 
                              alt="Original"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 italic">Original</div>
                          </div>
                        }
                        itemTwo={
                          <div className="relative h-full flex items-center justify-center bg-black">
                            <ReactCompareSliderImage 
                              src={store.generatedImage} 
                              alt="Generated"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                            <div className="absolute top-4 right-4 bg-primary/80 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white italic shadow-lg">Neural™</div>
                          </div>
                        }
                        className="w-full h-full"
                      />
                      
                      {store.plan === 'FREE' && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                          <div className="rotate-45 text-white/5 text-6xl md:text-[10rem] font-black tracking-ultra-tight select-none whitespace-nowrap">
                            Emprata.ai
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isLoadingImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 md:gap-6 bg-black">
                      <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-primary animate-spin" />
                      <span className="text-sm md:text-lg font-black italic uppercase tracking-widest text-primary/80">
                        Carregando...
                      </span>
                    </div>
                  ) : (
                    <>
                      <img 
                        src={store.originalImage} 
                        className={`w-full h-full object-contain transition-all duration-700 ${store.isGenerating ? 'blur-2xl opacity-40 scale-110' : ''}`} 
                        alt="Preview" 
                      />
                      {store.isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 md:gap-6 z-20">
                          <div className="relative w-16 h-16 md:w-24 md:h-24">
                            <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-primary animate-spin" />
                            <div className="absolute inset-2 md:inset-4 rounded-full border-4 border-white/5 border-b-primary animate-spin-reverse" />
                          </div>
                          <span className="text-base md:text-2xl font-black italic uppercase tracking-widest animate-pulse text-primary drop-shadow-[0_0_15px_rgba(255,94,0,0.5)] px-4 text-center">
                            {processingStage || 'Processando...'}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {store.isGenerating && <div className="scanner-line" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Mobile Bottom Sheet */}
      <div className="md:hidden w-full h-[45%] bg-[#1a1a1a] rounded-t-[30px] shadow-2xl overflow-y-auto px-6 py-6 z-20 border-t border-white/10">
        <ControlPanelContent />
      </div>

    </div>
  );
}
