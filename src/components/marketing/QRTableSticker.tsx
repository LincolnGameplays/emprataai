/**
 * 🍽️ QR TABLE STICKER GENERATOR - Adesivos de Mesa com QR Code
 * 
 * Componente para gerar adesivos printáveis com:
 * - QR Code para pedido direto
 * - Logo do restaurante
 * - Mensagem de desconto
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, Printer, Copy, Check, Smartphone, Gift } from 'lucide-react';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface QRTableStickerProps {
  restaurantName: string;
  restaurantSlug: string;
  tableNumber?: number;
  discountAmount?: number;
  logoUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function QRTableSticker({
  restaurantName,
  restaurantSlug,
  tableNumber,
  discountAmount = 5,
  logoUrl
}: QRTableStickerProps) {
  const [copied, setCopied] = useState(false);
  const stickerRef = useRef<HTMLDivElement>(null);

  const menuUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://emprata.ai'}/${restaurantSlug}${tableNumber ? `?mesa=${tableNumber}` : ''}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Preview */}
      <div className="flex justify-center">
        <motion.div
          ref={stickerRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-[300px] bg-white rounded-3xl p-6 shadow-2xl text-black print:shadow-none"
          id="qr-sticker"
        >
          {/* Header */}
          <div className="text-center mb-4">
            {logoUrl ? (
              <img src={logoUrl} alt={restaurantName} className="h-12 mx-auto mb-2" />
            ) : (
              <h2 className="text-xl font-black tracking-tight">{restaurantName}</h2>
            )}
            {tableNumber && (
              <div className="inline-block bg-black text-white px-3 py-1 rounded-full text-sm font-bold">
                Mesa {tableNumber}
              </div>
            )}
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-black rounded-2xl p-4 mb-4">
            <div className="bg-white rounded-xl p-4 flex flex-col items-center">
              <QrCode size={120} className="text-black" />
              <p className="text-[10px] text-gray-500 mt-2 font-mono break-all text-center">
                {menuUrl}
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-lg font-black">
              <Smartphone size={20} />
              <span>Escaneie e Peça</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold">
                <Gift size={16} />
                <span>Ganhe R$ {discountAmount} na primeira compra!</span>
              </div>
            )}
            
            <p className="text-xs text-gray-400">
              Atendimento rápido • Sem espera
            </p>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-[10px] text-gray-400">
              Powered by <span className="font-bold">EMPRATA.AI</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto print:hidden">
        <button
          onClick={handleCopy}
          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
          {copied ? 'Copiado!' : 'Copiar Link'}
        </button>
        
        <button
          onClick={handlePrint}
          className="flex-1 bg-purple-500 hover:bg-purple-400 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Printer size={18} />
          Imprimir
        </button>
      </div>

      {/* Instructions */}
      <div className="max-w-md mx-auto bg-[#121212] border border-white/5 rounded-2xl p-6 print:hidden">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Gift className="text-purple-400" />
          Como usar o Adesivo
        </h3>
        <ol className="space-y-3 text-sm text-white/60">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs shrink-0">1</span>
            <span>Imprima em papel adesivo (ou normal e plastifique)</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs shrink-0">2</span>
            <span>Cole nas mesas do restaurante</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold text-xs shrink-0">3</span>
            <span className="text-green-400">Clientes escaneiam, você recebe pedidos direto no painel!</span>
          </li>
        </ol>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #qr-sticker, #qr-sticker * {
            visibility: visible;
          }
          #qr-sticker {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH GENERATOR (Multiple Tables)
// ═══════════════════════════════════════════════════════════════════════════

interface BatchQRGeneratorProps {
  restaurantName: string;
  restaurantSlug: string;
  tableCount: number;
}

export function BatchQRGenerator({ restaurantName, restaurantSlug, tableCount }: BatchQRGeneratorProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black mb-2">Adesivos para {tableCount} Mesas</h2>
        <p className="text-white/40">Imprima todos de uma vez</p>
      </div>
      
      <div className="grid grid-cols-2 gap-6 print:gap-0">
        {Array.from({ length: tableCount }).map((_, i) => (
          <div key={i} className="print:break-inside-avoid">
            <QRTableSticker
              restaurantName={restaurantName}
              restaurantSlug={restaurantSlug}
              tableNumber={i + 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
