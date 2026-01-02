import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Utensils, Bike, QrCode } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function QrCodeGenerator() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'DELIVERY' | 'TABLE'>('DELIVERY');
  const [tableNum, setTableNum] = useState('1');
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

  // URL Dinâmica (Pega o domínio atual automaticamente)
  const baseUrl = window.location.origin;
  const link = mode === 'DELIVERY' 
    ? `${baseUrl}/menu/${menuSlug}`
    : `${baseUrl}/menu/${menuSlug}/table/${tableNum}`;

  const downloadQR = () => {
    const svg = document.getElementById("emprata-qr");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width * 2; // Higher resolution
      canvas.height = img.height * 2;
      ctx?.scale(2, 2);
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `Emprata_QR_${mode === 'TABLE' ? `Mesa${tableNum}` : 'Delivery'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    toast.success("QR Code baixado! Pronto para imprimir.");
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] p-8 rounded-[2rem] border border-white/10 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!menuSlug) {
    return (
      <div className="bg-[#1a1a1a] p-8 rounded-[2rem] border border-white/10">
        <div className="text-center py-8">
          <QrCode className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Cardápio não encontrado</h3>
          <p className="text-white/50 text-sm">Crie um cardápio primeiro para gerar seu QR Code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] p-8 rounded-[2rem] border border-white/10 shadow-2xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Controles */}
        <div className="flex-1 space-y-6">
          <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
            <QrCode className="text-primary" />
            Gerador de QR Code
          </h2>
           
          <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/10 w-fit">
            <button 
              onClick={() => setMode('DELIVERY')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'DELIVERY' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
            >
              <Bike size={16} /> Delivery
            </button>
            <button 
              onClick={() => setMode('TABLE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'TABLE' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
            >
              <Utensils size={16} /> Mesa
            </button>
          </div>

          {mode === 'TABLE' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Número da Mesa</label>
              <input 
                type="number" 
                min="1"
                value={tableNum} 
                onChange={(e) => setTableNum(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono text-lg focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* URL Preview */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Link do Cardápio</label>
            <div className="bg-black/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-white/60 break-all">
              {link}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button 
              onClick={downloadQR} 
              className="flex-1 bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <Download size={18} /> Baixar PNG
            </button>
            <button 
              onClick={() => { 
                navigator.clipboard.writeText(link); 
                toast.success("Link copiado!"); 
              }} 
              className="p-3 bg-white/5 rounded-xl text-white hover:bg-white/10 border border-white/5 transition-colors"
            >
              <Copy size={18} />
            </button>
          </div>

          <p className="text-white/30 text-xs">
            💡 Dica: Imprima este QR Code e cole nas mesas do seu estabelecimento.
          </p>
        </div>

        {/* Visualização (The Art) */}
        <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 rounded-3xl relative overflow-hidden min-w-[280px]">
          <div className="absolute top-0 left-0 right-0 bg-primary h-2 w-full" />
           
          <h3 className="text-black font-black text-xl mb-4 tracking-tighter uppercase">
            {mode === 'DELIVERY' ? 'Peça Online' : `Mesa ${tableNum}`}
          </h3>
           
          <div className="p-3 border-4 border-black rounded-xl bg-white">
            <QRCodeSVG 
              id="emprata-qr"
              value={link} 
              size={200}
              level="H" // High error correction
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <p className="text-black/40 text-[10px] font-bold mt-4 uppercase tracking-widest">
            Powered by Emprata.ai
          </p>
        </div>

      </div>
    </div>
  );
}
