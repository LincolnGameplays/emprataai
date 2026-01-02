/**
 * Order Success Viral - Growth Hack Component
 * 
 * The moment after order confirmation is the "golden moment" for viral growth.
 * This component incentivizes sharing with a referral reward.
 */

import { motion } from 'framer-motion';
import { Share2, Copy, Gift, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

interface OrderSuccessViralProps {
  orderId: string;
  deliveryPin: string;
  total: number;
  restaurantName?: string;
  onDismiss: () => void;
}

export function OrderSuccessViral({ orderId, deliveryPin, total, restaurantName, onDismiss }: OrderSuccessViralProps) {
  const { user } = useAuth();
  
  // Generate unique referral link for this user
  const referralCode = user?.uid ? user.uid.slice(0, 8) : Math.random().toString(36).slice(2, 10);
  const shareLink = `${window.location.origin}/invite/${referralCode}`;
  
  const shareMessage = `🔥 Acabei de pedir no ${restaurantName || 'Emprata'} e a comida é surreal!\n\n💰 Use meu código e ganhe R$ 10 de desconto no primeiro pedido:\n${shareLink}`;

  const handleShare = async () => {
    // Track share attempt
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'share', {
        method: 'native',
        content_type: 'referral',
        item_id: orderId
      });
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ganhe R$ 10 no Emprata',
          text: shareMessage,
          url: shareLink
        });
        toast.success('Compartilhado! 🎉');
      } catch (e) {
        // User cancelled or error - fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copiado! Mande para seus amigos 🚀");
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 via-black to-purple-900/20" />
      
      {/* Success Icon */}
      <motion.div 
        initial={{ scale: 0 }} 
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative mb-6"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl"
        />
        <div className="relative w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.4)]">
          <CheckCircle size={48} className="text-white" strokeWidth={2.5} />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-black italic mb-2 relative z-10"
      >
        Pedido Confirmado!
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white/50 mb-6 relative z-10"
      >
        A cozinha já está preparando seu pedido.
      </motion.p>

      {/* Delivery PIN */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-8 relative z-10"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">PIN DE ENTREGA</p>
        <p className="text-5xl font-black text-primary tracking-[0.2em]">{deliveryPin}</p>
        <p className="text-[10px] text-white/30 mt-2">Mostre este código ao entregador</p>
      </motion.div>

      {/* VIRAL GROWTH HACK */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/20 p-6 rounded-2xl w-full max-w-sm relative overflow-hidden z-10"
      >
        {/* Decorative sparkle */}
        <Sparkles className="absolute top-3 right-3 text-yellow-400/50" size={20} />
        
        <div className="flex items-center gap-2 mb-3">
          <Gift className="text-yellow-400" size={20} />
          <span className="text-xs font-black uppercase tracking-widest text-yellow-400">
            Não coma sozinho
          </span>
        </div>
        
        <p className="text-white font-bold mb-4 text-sm leading-relaxed">
          Mande seu link para um amigo. Se ele pedir,{' '}
          <span className="text-green-400 block text-lg mt-1">VOCÊS DOIS GANHAM R$ 10,00</span>
        </p>

        {/* Share Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className="flex-1 bg-white text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
          >
            <Share2 size={18} /> COMPARTILHAR
          </button>
          <button 
            onClick={handleCopy}
            className="bg-white/10 text-white p-4 rounded-xl hover:bg-white/20 transition-colors border border-white/10"
          >
            <Copy size={18} />
          </button>
        </div>

        {/* Share link preview */}
        <div className="mt-4 bg-black/30 rounded-lg p-2 border border-white/5">
          <p className="text-[10px] text-white/40 font-mono truncate">{shareLink}</p>
        </div>
      </motion.div>

      {/* Dismiss Button */}
      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={onDismiss}
        className="mt-6 text-white/40 hover:text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2 relative z-10"
      >
        Fazer novo pedido <ArrowRight size={16} />
      </motion.button>
    </div>
  );
}
