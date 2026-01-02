import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { QrPlate } from '../../components/admin/QrPlate';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { Download, Palette, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function QrCodeStudio() {
  const { user } = useAuth();
  
  // Estados de Customização
  const [mode, setMode] = useState<'TABLE' | 'DELIVERY'>('TABLE');
  const [tableNum, setTableNum] = useState('1');
  const [theme, setTheme] = useState<'DARK' | 'LIGHT' | 'BRAND'>('DARK');
  const [brandColor, setBrandColor] = useState('#22c55e'); // Padrão Verde Emprata
  const [isGenerating, setIsGenerating] = useState(false);
  const [menuSlug, setMenuSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar o slug do menu do usuário
  useEffect(() => {
    const fetchMenuSlug = async () => {
      if (!user?.uid) return;
      
      try {
        const q = query(collection(db, 'menus'), where('ownerId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const menuData = snapshot.docs[0].data();
          setMenuSlug(menuData.slug);
        }
      } catch (e) {
        console.error('Error fetching menu:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuSlug();
  }, [user?.uid]);

  // Lógica do Link Camaleão (Detecta o domínio atual)
  const baseUrl = window.location.origin; // EX: https://emprata.ai ou localhost:5173
  
  const finalLink = mode === 'DELIVERY' 
    ? `${baseUrl}/menu/${menuSlug}`
    : `${baseUrl}/menu/${menuSlug}/table/${tableNum}`;

  // Função de Download HD
  const handleDownload = async () => {
    setIsGenerating(true);
    const node = document.getElementById('qr-plate-preview');
    
    if (node) {
       try {
          // Gera imagem em 3x (Retina Quality) para impressão nítida
          const dataUrl = await toPng(node, { pixelRatio: 3 });
          download(dataUrl, `Emprata_Mesa_${mode === 'TABLE' ? tableNum : 'Delivery'}.png`);
          toast.success("Arte baixada em Alta Definição!");
       } catch (error) {
          console.error('Error generating image:', error);
          toast.error("Erro ao gerar imagem.");
       }
    }
    setIsGenerating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!menuSlug) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <LayoutTemplate className="w-10 h-10 text-white/20" />
          </div>
          <h2 className="text-2xl font-black mb-3">Cardápio não encontrado</h2>
          <p className="text-white/50">Crie um cardápio primeiro no Menu Builder para gerar QR Codes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
       <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          
          {/* PAINEL DE CONTROLE */}
          <div className="space-y-8">
             <div>
                <h1 className="text-4xl font-black italic mb-2">QR Studio</h1>
                <p className="text-white/50">Crie placas de mesa profissionais prontas para impressão.</p>
             </div>

             {/* 1. Tipo */}
             <div className="bg-[#121212] p-6 rounded-3xl border border-white/5">
                <h3 className="font-bold text-white/70 mb-4 flex items-center gap-2">
                  <LayoutTemplate size={18}/> Tipo de QR
                </h3>
                <div className="flex bg-black p-1 rounded-xl border border-white/10">
                   <button 
                     onClick={() => setMode('TABLE')} 
                     className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${mode === 'TABLE' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                   >
                      Mesa (Comanda)
                   </button>
                   <button 
                     onClick={() => setMode('DELIVERY')} 
                     className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${mode === 'DELIVERY' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                   >
                      Delivery (Link)
                   </button>
                </div>
                
                {mode === 'TABLE' && (
                   <div className="mt-4">
                      <label className="text-xs font-bold text-white/40 uppercase">Número da Mesa</label>
                      <input 
                         type="number" 
                         min="1"
                         value={tableNum}
                         onChange={(e) => setTableNum(e.target.value)}
                         className="w-full bg-black border border-white/10 rounded-xl p-3 mt-2 text-white font-black text-xl focus:border-primary outline-none transition-colors"
                      />
                   </div>
                )}
             </div>

             {/* 2. Estilo */}
             <div className="bg-[#121212] p-6 rounded-3xl border border-white/5">
                <h3 className="font-bold text-white/70 mb-4 flex items-center gap-2">
                  <Palette size={18}/> Personalização
                </h3>
                
                <label className="text-xs font-bold text-white/40 uppercase mb-3 block">Tema</label>
                <div className="grid grid-cols-3 gap-3 mb-6">
                   <button 
                     onClick={() => setTheme('DARK')} 
                     className={`h-12 rounded-xl bg-black border-2 transition-all flex items-center justify-center ${theme === 'DARK' ? 'border-white' : 'border-white/10 hover:border-white/30'}`}
                   >
                     {theme === 'DARK' && <span className="text-white text-xs font-bold">✓</span>}
                   </button>
                   <button 
                     onClick={() => setTheme('LIGHT')} 
                     className={`h-12 rounded-xl bg-white border-2 transition-all flex items-center justify-center ${theme === 'LIGHT' ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
                   >
                     {theme === 'LIGHT' && <span className="text-black text-xs font-bold">✓</span>}
                   </button>
                   <button 
                     onClick={() => setTheme('BRAND')} 
                     className={`h-12 rounded-xl border-2 transition-all flex items-center justify-center ${theme === 'BRAND' ? 'border-white' : 'border-transparent hover:border-white/50'}`} 
                     style={{ backgroundColor: brandColor }}
                   >
                     {theme === 'BRAND' && <span className="text-white text-xs font-bold">✓</span>}
                   </button>
                </div>

                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-white/40 uppercase">Cor da Marca (Hex)</label>
                   <div className="flex items-center gap-3">
                      <input 
                         type="color" 
                         value={brandColor}
                         onChange={(e) => setBrandColor(e.target.value)}
                         className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                      />
                      <input 
                         type="text" 
                         value={brandColor}
                         onChange={(e) => setBrandColor(e.target.value)}
                         className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-white font-mono text-sm uppercase focus:border-primary outline-none transition-colors"
                      />
                   </div>
                </div>
             </div>

             {/* Link Preview */}
             <div className="bg-[#121212] p-6 rounded-3xl border border-white/5">
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Link do QR Code</label>
                <div className="bg-black/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-white/60 break-all">
                  {finalLink}
                </div>
             </div>

             {/* Botão de Ação */}
             <button 
               onClick={handleDownload}
               disabled={isGenerating}
               className="w-full bg-primary hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all"
             >
                {isGenerating ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                    Gerando Alta Resolução...
                  </>
                ) : (
                   <>
                      <Download size={24} /> BAIXAR PLACA (PNG)
                   </>
                )}
             </button>
             <p className="text-center text-xs text-white/30">
                Formato ideal para imprimir em papel A5, Adesivo ou Acrílico.
             </p>
          </div>

          {/* PREVIEW EM TEMPO REAL */}
          <div className="sticky top-10 flex flex-col items-center justify-center bg-[#121212] rounded-[3rem] border border-white/5 p-12 min-h-[600px]">
             <p className="mb-8 text-white/40 font-bold uppercase tracking-widest text-xs">Preview da Impressão</p>
             
             {/* Este componente é o que será baixado */}
             <div className="shadow-2xl shadow-black">
                <QrPlate 
                   id="qr-plate-preview"
                   link={finalLink}
                   tableNum={mode === 'TABLE' ? tableNum : undefined}
                   restaurantName={user?.displayName || "Seu Restaurante"}
                   theme={theme}
                   brandColor={brandColor}
                />
             </div>
          </div>

       </div>
    </div>
  );
}
