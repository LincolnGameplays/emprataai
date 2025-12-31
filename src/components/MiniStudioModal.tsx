
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, X, Check, Loader2, Sparkles, Wand2
} from 'lucide-react';
import { generateFoodImage } from '../services/neuralEngine';
import { useAppStore } from '../store/useAppStore';

interface MiniStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageReady: (url: string) => void;
}

export function MiniStudioModal({ isOpen, onClose, onImageReady }: MiniStudioModalProps) {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const store = useAppStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedUrl(null);
    }
  };

  const handleProcess = async () => {
    if (!originalFile) return;

    setIsProcessing(true);
    try {
      const result = await generateFoodImage({
        file: originalFile,
        vibe: 'standard', // Default for quick builder
        angle: 'front',
        lightIntensity: 70
      });

      if (result.success && result.imageUrl) {
        setGeneratedUrl(result.imageUrl);
        store.useCredit();
      }
    } catch (error) {
      console.error("Studio Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (generatedUrl) {
      onImageReady(generatedUrl);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setOriginalFile(null);
    setPreviewUrl(null);
    setGeneratedUrl(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            Studio Express
          </h3>
          <button onClick={resetAndClose} className="p-1 hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[300px]">
          {!previewUrl ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-white/30 hover:text-primary"
            >
              <Upload className="w-12 h-12" />
              <span className="text-xs font-bold uppercase tracking-wider">Upload Foto do Prato</span>
              <input 
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden border border-white/10 group">
              <img 
                src={generatedUrl || previewUrl} 
                className={`w-full h-full object-contain ${isProcessing ? 'blur-lg scale-105' : ''} transition-all duration-700`}
                alt="Preview" 
              />
              
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <span className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">
                    Melhorando Iluminação...
                  </span>
                </div>
              )}

              {!generatedUrl && !isProcessing && (
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <button 
                    onClick={handleProcess}
                    className="w-full py-3 bg-primary hover:bg-orange-600 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-orange-900/50 transition-all transform active:scale-95"
                  >
                    <Wand2 className="w-4 h-4" />
                    Melhorar com IA (1 Crédito)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {generatedUrl && (
          <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3">
             <button 
              onClick={() => { setGeneratedUrl(null); }}
              className="px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white/40 hover:text-white transition-colors"
            >
              Tentar De Novo
            </button>
            <button 
              onClick={handleConfirm}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg transition-all"
            >
              <Check className="w-4 h-4" />
              Usar Foto
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
