
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatCurrency } from '../utils/format';
import { QrCode, CheckCircle, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Simula a geração de Pix (No futuro, integrar com asaas/charge.ts)
const generatePixPayload = (amount: number, orderId: string) => {
  // Retorna um payload Pix Copia e Cola fictício para teste
  return `00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540${amount.toFixed(2).replace('.','')}5802BR5913EmprataAI6008SaoPaulo62070503***6304`;
};

export default function TableCheckout() {
  const { tableId, restaurantId } = useParams(); // URL ex: /pay/table/:restaurantId/:tableId
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentStep, setPaymentStep] = useState<'BILL' | 'PIX' | 'SUCCESS'>('BILL');
  const [pixString, setPixString] = useState('');

  useEffect(() => {
    if (!tableId || !restaurantId) return;

    // Busca pedidos PENDENTES ou PREPARING ou READY desta mesa
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      where('tableNumber', '==', tableId),
      where('paymentStatus', '==', 'PENDING'), // Só o que não foi pago
      where('status', 'in', ['PENDING', 'PREPARING', 'READY', 'DELIVERED']) // Pedidos ativos
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(docs);
      setLoading(false);
    });

    return () => unsub();
  }, [tableId, restaurantId]);

  const total = orders.reduce((acc, order) => acc + (order.total || order.financials?.total || 0), 0);
  const serviceFee = total * 0.10; // 10% opcional
  const grandTotal = total + serviceFee;

  const handleGeneratePix = () => {
    // Aqui você chamaria sua Cloud Function 'createCharge'
    const payload = generatePixPayload(grandTotal, `MESA-${tableId}`);
    setPixString(payload);
    setPaymentStep('PIX');
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixString);
    alert('Pix Copiado!');
    // Simula pagamento aprovado após 5 segundos para teste
    setTimeout(() => setPaymentStep('SUCCESS'), 5000);
  };

  if (loading) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-black italic">Mesa <span className="text-primary">{tableId}</span></h1>
        <p className="text-white/40 text-sm">Confira sua conta digital</p>
      </header>

      {orders.length === 0 && paymentStep !== 'SUCCESS' ? (
        <div className="text-center py-20 opacity-50">
          <p>Nenhum pedido aberto nesta mesa.</p>
        </div>
      ) : (
        <>
          {paymentStep === 'BILL' && (
            <div className="space-y-6">
              <div className="bg-[#121212] rounded-2xl p-4 border border-white/10">
                {orders.map(order => (
                  <div key={order.id} className="border-b border-white/5 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                    <p className="text-xs text-white/40 mb-2">Pedido #{order.id.slice(-4)}</p>
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm mb-1">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Serviço (10%)</span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-primary mt-4 pt-4 border-t border-white/10">
                  <span>TOTAL</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <button 
                onClick={handleGeneratePix}
                className="w-full py-4 bg-primary text-black font-black rounded-xl hover:brightness-110 flex items-center justify-center gap-2"
              >
                <QrCode size={20} /> PAGAR COM PIX
              </button>
            </div>
          )}

          {paymentStep === 'PIX' && (
            <div className="text-center space-y-6 animate-in fade-in zoom-in">
              <div className="bg-white p-4 rounded-xl inline-block">
                <QRCodeSVG value={pixString} size={200} />
              </div>
              <div>
                <p className="text-sm text-white/60 mb-2">Escaneie ou copie o código</p>
                <p className="text-2xl font-black text-primary">{formatCurrency(grandTotal)}</p>
              </div>
              <button 
                onClick={handleCopyPix}
                className="w-full py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20"
              >
                Copiar "Pix Copia e Cola"
              </button>
              <p className="text-xs text-yellow-500 animate-pulse">Aguardando pagamento...</p>
            </div>
          )}

          {paymentStep === 'SUCCESS' && (
            <div className="text-center py-20 space-y-6 animate-in fade-in slide-in-from-bottom">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                <CheckCircle size={48} className="text-black" />
              </div>
              <div>
                <h2 className="text-3xl font-black">Pago!</h2>
                <p className="text-white/60">Sua mesa foi liberada.</p>
              </div>
              <div className="p-4 bg-[#121212] rounded-xl border border-white/10 mt-8">
                <p className="text-xs text-white/40">Obrigado pela preferência!</p>
                <p className="font-bold italic mt-2">EmprataAI</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
