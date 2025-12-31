/**
 * 🎁 REFERRAL CARD - Member Get Member (MGM) System
 * 
 * Zero-Budget Growth: Cliente traz cliente, ambos ganham R$ 10,00
 * CAC (Custo de Aquisição) = R$ 0,00
 */

import { Gift, Copy, Share2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

export function ReferralCard() {
  const { user } = useAuth();
  
  // O código de convite são os primeiros 6 dígitos do ID do usuário
  const referralCode = user?.uid.slice(0, 6).toUpperCase() || 'EMPRATA';
  const referralUrl = `https://emprata.ai/r/${referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Código copiado! Mande para um amigo.");
  };

  const shareReferral = async () => {
    const shareData = {
      title: '🍔 Peça comida e ganhe R$ 10,00!',
      text: `Use meu código ${referralCode} no EmprataAI e ganhe R$ 10,00 no primeiro pedido!`,
      url: referralUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Link compartilhado!");
      } catch (err) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  if (!user) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900/80 to-blue-900/80 p-6 rounded-2xl relative overflow-hidden border border-white/10 mt-6 backdrop-blur-sm">
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 text-yellow-400">
          <Gift className="animate-bounce" size={20} />
          <h3 className="font-black uppercase text-sm tracking-wider">Coma de Graça</h3>
        </div>
        
        {/* Description */}
        <p className="text-white text-sm font-bold mb-4 w-3/4 leading-relaxed">
          Convide um amigo. Ele ganha <span className="text-green-400">R$ 10,00</span> e você ganha <span className="text-green-400">R$ 10,00</span> no próximo pedido.
        </p>
        
        {/* Code Display */}
        <div className="flex gap-2">
          <div className="bg-black/40 border border-white/20 rounded-xl px-4 py-3 font-mono text-xl tracking-widest text-white flex-1 text-center select-all">
            {referralCode}
          </div>
          <button 
            onClick={copyCode} 
            className="bg-white/10 text-white font-bold px-4 rounded-xl hover:bg-white/20 transition-colors border border-white/10"
            title="Copiar código"
          >
            <Copy size={20} />
          </button>
          <button 
            onClick={shareReferral} 
            className="bg-green-600 text-white font-bold px-4 rounded-xl hover:bg-green-700 transition-colors"
            title="Compartilhar"
          >
            <Share2 size={20} />
          </button>
        </div>

        {/* Stats (if implemented) */}
        <p className="text-[10px] text-white/30 mt-3 text-center">
          Quanto mais amigos você indicar, mais prêmios você ganha! 🚀
        </p>
      </div>
      
      {/* Background Decoration */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
    </div>
  );
}
