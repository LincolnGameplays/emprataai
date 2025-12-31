
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { parseMenuFromText } from '../../services/menuAi';
import { toast } from 'sonner';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

export function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!text) return toast.error("Cole o texto do cardápio!");
    
    setLoading(true);
    try {
      const structuredMenu = await parseMenuFromText(text);
      onImport(structuredMenu);
      toast.success(`${structuredMenu.categories.length} categorias identificadas!`);
      onClose();
    } catch (error) {
      toast.error("Falha ao processar. Verifique o texto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#121212] w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-blue-900/20">
              <div>
                <h2 className="text-xl font-black italic flex items-center gap-2">
                  <Sparkles className="text-purple-400" /> Importador Mágico
                </h2>
                <p className="text-xs text-white/40">Cole o texto do seu cardápio (PDF, Excel ou WhatsApp)</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
            </div>

            <div className="p-6">
              {/* Tabs */}
              <div className="flex gap-4 mb-4">
                <button 
                  onClick={() => setInputMode('text')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${inputMode === 'text' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'}`}
                >
                  <FileText size={16} /> Colar Texto
                </button>
                <button 
                  onClick={() => setInputMode('file')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${inputMode === 'file' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'}`}
                >
                  <Upload size={16} /> Upload Arquivo (CSV)
                </button>
              </div>

              {inputMode === 'text' ? (
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Ex: X-Burger R$ 30,00, Coca-Cola R$ 5,00..."
                  className="w-full h-64 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-purple-500 outline-none resize-none font-mono"
                />
              ) : (
                <div className="h-64 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/30">
                  <Upload size={32} className="mb-2" />
                  <p>Arraste seu arquivo CSV ou Excel aqui</p>
                  <p className="text-[10px] mt-2">(Funcionalidade em breve - use Colar Texto por enquanto)</p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-white/60 hover:text-white">Cancelar</button>
                <button 
                  onClick={handleProcess}
                  disabled={loading || !text}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-black text-white shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                  PROCESSAR COM IA
                </button>
              </div>
            </div>
            
            {/* Dica */}
            <div className="p-4 bg-purple-500/10 border-t border-white/5 text-center">
              <p className="text-xs text-purple-300 font-bold flex items-center justify-center gap-2">
                <AlertCircle size={14} /> Dica: Você pode copiar o cardápio inteiro do iFood e colar aqui!
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
