/**
 * QR Studio - Gerador de Placas de Mesa
 * Impressão profissional de QR Codes para cardápio digital
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, Palette, Download, Eye, ChefHat } from 'lucide-react';
import QRCode from 'react-qr-code';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';

// ══════════════════════════════════════════════════════════════════
// THEME CONFIG
// ══════════════════════════════════════════════════════════════════

type ThemeType = 'black' | 'white';

const THEMES = {
  black: {
    name: 'Emprata Black',
    description: 'Fundo escuro premium para acrílicos',
    bg: '#0a0a0a',
    text: '#ffffff',
    accent: '#f97316',
    qrBg: '#ffffff',
    qrFg: '#0a0a0a',
  },
  white: {
    name: 'Economy White',
    description: 'Econômico para impressora comum',
    bg: '#ffffff',
    text: '#0a0a0a',
    accent: '#f97316',
    qrBg: '#ffffff',
    qrFg: '#0a0a0a',
  }
};

// ══════════════════════════════════════════════════════════════════
// PRINT STYLES (injected dynamically)
// ══════════════════════════════════════════════════════════════════

const PRINT_STYLES = `
@media print {
  body * {
    visibility: hidden;
  }
  
  #qr-print-area, #qr-print-area * {
    visibility: visible;
  }
  
  #qr-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .no-print {
    display: none !important;
  }

  @page {
    margin: 0;
    size: A5 portrait;
  }
}
`;

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function QrPrint() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState<{ name: string; slug: string; logoUrl?: string } | null>(null);
  const [theme, setTheme] = useState<ThemeType>('black');
  const [tableNumber, setTableNumber] = useState('');

  const currentTheme = THEMES[theme];
  const menuUrl = menuData?.slug 
    ? `https://emprataai.vercel.app/menu/${menuData.slug}`
    : '';

  // Inject print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = PRINT_STYLES;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Load menu data
  useEffect(() => {
    const fetchMenu = async () => {
      if (!user?.uid) return;
      
      try {
        const q = query(collection(db, 'menus'), where('ownerId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setMenuData({
            name: data.name || 'Meu Restaurante',
            slug: data.slug || 'meu-restaurante',
            logoUrl: data.logoUrl
          });
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [user?.uid]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* HEADER (no-print) */}
      <header className="no-print sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black italic uppercase tracking-tight">QR Studio</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Gerador de Placas de Mesa
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-orange-600 rounded-xl font-black uppercase tracking-widest text-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-2 gap-8">
        {/* CONTROLS PANEL (no-print) */}
        <div className="no-print space-y-6">
          {/* Theme Selector */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Tema da Placa
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(THEMES) as ThemeType[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    theme === key 
                      ? 'border-primary bg-primary/10' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div 
                    className="w-full h-16 rounded-xl mb-3 border border-white/10"
                    style={{ backgroundColor: THEMES[key].bg }}
                  />
                  <h3 className="font-bold text-sm">{THEMES[key].name}</h3>
                  <p className="text-[10px] text-white/40">{THEMES[key].description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Table Number */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">
              Número da Mesa (Opcional)
            </h2>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Ex: 01, 02, VIP..."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 font-bold text-center text-2xl focus:border-primary outline-none"
            />
          </section>

          {/* Menu URL Preview */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-400" />
              URL do Cardápio
            </h2>
            <div className="p-4 bg-black/50 rounded-xl break-all text-sm font-mono text-primary">
              {menuUrl || 'Nenhum cardápio encontrado'}
            </div>
          </section>

          {/* Print Instructions */}
          <section className="bg-primary/10 border border-primary/20 rounded-3xl p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-primary mb-3">
              💡 Dicas de Impressão
            </h2>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• <strong>Margens:</strong> Configure como "Nenhuma"</li>
              <li>• <strong>Gráficos de fundo:</strong> ATIVAR (essencial para fundo preto)</li>
              <li>• <strong>Papel:</strong> A5 ou A4 funciona bem</li>
              <li>• <strong>Acrílico:</strong> Tema Black fica incrível em acrílico T</li>
            </ul>
          </section>
        </div>

        {/* PREVIEW (Print Area) */}
        <div className="flex items-start justify-center">
          <div 
            id="qr-print-area"
            className="w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: currentTheme.bg }}
          >
            <div className="h-full flex flex-col items-center justify-between p-8 text-center">
              {/* Header */}
              <div>
                {tableNumber && (
                  <div 
                    className="inline-block px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-4"
                    style={{ 
                      backgroundColor: currentTheme.accent + '20',
                      color: currentTheme.accent,
                      border: `2px solid ${currentTheme.accent}`
                    }}
                  >
                    Mesa {tableNumber}
                  </div>
                )}
                <h1 
                  className="text-3xl font-black italic tracking-tighter"
                  style={{ 
                    color: currentTheme.text,
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  Cardápio Digital
                </h1>
              </div>

              {/* QR Code */}
              <div 
                className="p-6 rounded-3xl"
                style={{ backgroundColor: currentTheme.qrBg }}
              >
                {menuUrl ? (
                  <QRCode 
                    value={menuUrl}
                    size={200}
                    bgColor={currentTheme.qrBg}
                    fgColor={currentTheme.qrFg}
                    level="H"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-200 rounded-xl">
                    <span className="text-gray-500 text-center text-sm">
                      Configure seu<br/>cardápio primeiro
                    </span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div>
                <p 
                  className="text-sm font-bold mb-6 opacity-60"
                  style={{ color: currentTheme.text }}
                >
                  Aponte a câmera do seu celular<br/>para fazer o pedido
                </p>

                {/* Restaurant Name */}
                <div 
                  className="flex items-center justify-center gap-2 mb-2"
                  style={{ color: currentTheme.text }}
                >
                  {menuData?.logoUrl ? (
                    <img 
                      src={menuData.logoUrl} 
                      alt={menuData.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <ChefHat className="w-6 h-6 opacity-50" />
                  )}
                  <span className="font-black text-lg">
                    {menuData?.name || 'Meu Restaurante'}
                  </span>
                </div>

                {/* Emprata Brand */}
                <p 
                  className="text-[10px] font-bold uppercase tracking-widest opacity-30"
                  style={{ color: currentTheme.text }}
                >
                  Tecnologia Emprata.ai
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
