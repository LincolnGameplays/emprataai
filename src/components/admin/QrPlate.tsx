import { QRCodeSVG } from 'qrcode.react';
import { Camera, Wifi } from 'lucide-react';

interface QrPlateProps {
  link: string;
  tableNum?: string;
  restaurantName: string;
  theme: 'DARK' | 'LIGHT' | 'BRAND';
  brandColor: string;
  id?: string; // Para referência no download
}

export function QrPlate({ link, tableNum, restaurantName, theme, brandColor, id }: QrPlateProps) {
  
  // Configuração de Cores por Tema
  const styles = {
    DARK: { bg: '#000000', text: '#FFFFFF', accent: brandColor, qrBg: '#FFFFFF', qrFg: '#000000' },
    LIGHT: { bg: '#FFFFFF', text: '#000000', accent: brandColor, qrBg: '#FFFFFF', qrFg: '#000000' },
    BRAND: { bg: brandColor, text: '#FFFFFF', accent: '#000000', qrBg: '#FFFFFF', qrFg: '#000000' }
  };

  const currentStyle = styles[theme];

  return (
    <div 
      id={id}
      className="w-[300px] h-[450px] flex flex-col items-center justify-between p-8 rounded-3xl shadow-2xl relative overflow-hidden font-sans select-none"
      style={{ backgroundColor: currentStyle.bg, color: currentStyle.text }}
    >
      {/* Design Decorativo de Fundo */}
      <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: currentStyle.accent }} />
      <div 
        className="absolute bottom-0 right-0 w-48 h-48 blur-[60px] opacity-20 rounded-full pointer-events-none" 
        style={{ backgroundColor: currentStyle.accent }} 
      />

      {/* Header */}
      <div className="text-center z-10">
        <h3 className="font-black text-lg uppercase tracking-widest opacity-80 mb-1">{restaurantName}</h3>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Menu Digital</p>
      </div>

      {/* O QR Code (Com moldura) */}
      <div className="bg-white p-4 rounded-2xl shadow-xl z-10">
        <QRCodeSVG 
          value={link} 
          size={180}
          level="H" // High Error Correction (Permite sujeira/rabiscos e ainda funciona)
          bgColor={currentStyle.qrBg}
          fgColor={currentStyle.qrFg}
          includeMargin={false}
        />
      </div>

      {/* Instruções */}
      <div className="text-center space-y-2 z-10">
        <div className="flex items-center justify-center gap-2 opacity-60">
           <Camera size={16} />
           <span className="text-xs font-bold uppercase">Aponte a Câmera</span>
        </div>
        
        {tableNum ? (
           <div className="mt-4 px-6 py-2 rounded-xl border-2 border-current inline-block">
              <span className="text-xs font-bold uppercase mr-2 opacity-70">Mesa</span>
              <span className="text-3xl font-black">{tableNum}</span>
           </div>
        ) : (
           <div className="mt-4 px-6 py-2 rounded-xl border border-white/20 bg-white/10 inline-block">
              <span className="text-xs font-bold uppercase">Delivery & Retirada</span>
           </div>
        )}
      </div>

      {/* Footer Tecnológico */}
      <div className="absolute bottom-4 flex items-center gap-2 opacity-30 text-[8px] font-mono">
         <Wifi size={8} /> POWERED BY EMPRATA.AI
      </div>
    </div>
  );
}
