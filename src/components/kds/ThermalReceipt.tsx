
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptProps {
  order: any;
}

export const ThermalReceipt = ({ order }: ReceiptProps) => {
  // URL do seu cardápio próprio
  const menuUrl = `https://emprata.ai/menu/${order.restaurantId}`;

  return (
    <div className="w-[80mm] p-2 font-mono text-black text-xs leading-tight">
      {/* CABEÇALHO */}
      <div className="text-center border-b border-black pb-2 mb-2">
        <h1 className="text-lg font-black uppercase">EmprataAI</h1>
        <p>Senha: #{order.id.slice(-4).toUpperCase()}</p>
        <p>{new Date().toLocaleString()}</p>
      </div>

      {/* DADOS DO CLIENTE */}
      <div className="mb-2">
        <p className="font-bold text-sm">{order.customer.name}</p>
        <p>Origem: {order.source || 'App Próprio'}</p>
      </div>

      {/* ITENS */}
      <div className="border-b border-black pb-2 mb-2">
        {order.items.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between mb-1">
            <span className="font-bold w-6">{item.quantity}x</span>
            <span className="flex-1">{item.name}</span>
            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* TOTAIS */}
      <div className="text-right font-bold text-sm mb-4">
        <p>Total: R$ {order.financials?.total?.toFixed(2) || order.total?.toFixed(2)}</p>
      </div>

      {/* --- ESTRATÉGIA DE CONVERSÃO (FÍSICO -> DIGITAL) --- */}
      {order.source !== 'APP_PROPRIO' && (
        <div className="border-2 border-dashed border-black p-2 text-center rounded-lg mt-4">
          <p className="font-bold text-sm mb-1">Ganhe 10% OFF no próximo!</p>
          <p className="text-[10px] mb-2">Escaneie e peça direto pelo nosso App:</p>
          
          <div className="flex justify-center my-2">
            <QRCodeSVG value={menuUrl} size={100} />
          </div>
          
          <p className="text-[10px] font-bold">emprata.ai/menu/seurestaurante</p>
        </div>
      )}
      
      <div className="text-center text-[10px] mt-4">
        Powered by Emprata.ai
      </div>
    </div>
  );
};
