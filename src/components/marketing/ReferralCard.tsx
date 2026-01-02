/**
 * 🎁 REFERRAL CARD - Componente de Compartilhamento Viral
 * 
 * Card que exibe:
 * - Código de indicação do usuário
 * - Botão de copiar
 * - Botão de WhatsApp Share
 * - QR Code para scan
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Share2, MessageCircle, QrCode, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getOrCreateReferralCode, 
  generateReferralLink,
  generateWhatsAppShareMessage,
  getCashbackBalance,
  REFERRAL_CONFIG
} from '../../services/referralService';
import { useAuth } from '../../hooks/useAuth';
import { hapticSuccess } from '../../services/apiClient';

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface ReferralCardProps {
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ReferralCard({ 
  restaurantId, 
  restaurantName,
  restaurantSlug,
  className = '' 
}: ReferralCardProps) {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [cashbackBalance, setCashbackBalance] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // LOAD REFERRAL DATA
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    async function loadReferralData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get or create referral code
        const code = await getOrCreateReferralCode(
          user.uid,
          user.displayName || 'Amigo',
          restaurantId,
          restaurantSlug
        );
        
        setReferralCode(code.code);
        setReferralLink(generateReferralLink(code.code, restaurantSlug));

        // Get cashback balance
        const balance = await getCashbackBalance(user.uid, restaurantId);
        setCashbackBalance(balance);

      } catch (error) {
        console.error('[ReferralCard] Error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReferralData();
  }, [user, restaurantId, restaurantSlug]);

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      hapticSuccess();
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const handleWhatsAppShare = () => {
    hapticSuccess();
    const message = generateWhatsAppShareMessage(referralCode, restaurantName, referralLink);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      hapticSuccess();
      try {
        await navigator.share({
          title: `Ganhe R$ ${REFERRAL_CONFIG.REFERRED_DISCOUNT} no ${restaurantName}!`,
          text: `Use meu código ${referralCode} e ganhe desconto!`,
          url: referralLink,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className={`bg-[#121212] rounded-3xl p-6 animate-pulse ${className}`}>
        <div className="h-6 bg-white/10 rounded w-32 mb-4" />
        <div className="h-12 bg-white/10 rounded mb-4" />
        <div className="h-10 bg-white/10 rounded" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NOT LOGGED IN
  // ═══════════════════════════════════════════════════════════════════════

  if (!user) {
    return (
      <div className={`bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-3xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Gift className="text-purple-400" size={24} />
          <h3 className="font-bold text-lg">Ganhe Cashback!</h3>
        </div>
        <p className="text-white/60 text-sm mb-4">
          Faça login para gerar seu código de indicação e ganhar R$ {REFERRAL_CONFIG.REFERRER_REWARD} por cada amigo.
        </p>
        <a 
          href="/auth" 
          className="block w-full bg-purple-500 text-white text-center py-3 rounded-xl font-bold hover:bg-purple-400 transition-colors"
        >
          Fazer Login
        </a>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-[#1a1a2e] to-[#121212] border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden ${className}`}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
            <Gift className="text-purple-400" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Indique & Ganhe</h3>
            <p className="text-white/40 text-xs">R$ {REFERRAL_CONFIG.REFERRER_REWARD} por indicação</p>
          </div>
        </div>
        
        {/* Cashback Balance */}
        {cashbackBalance > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
            <p className="text-[10px] text-green-400/60 uppercase font-bold">Seu Saldo</p>
            <p className="text-lg font-black text-green-400">
              R$ {cashbackBalance.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Referral Code Box */}
      <div className="bg-black/40 rounded-2xl p-4 mb-4 border border-white/5">
        <p className="text-xs text-white/40 mb-2 uppercase font-bold tracking-wider">Seu Código</p>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-black tracking-wider text-white">{referralCode}</p>
          <button
            onClick={handleCopy}
            className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            {copied ? <Check className="text-green-400" size={20} /> : <Copy className="text-white/60" size={20} />}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          onClick={handleWhatsAppShare}
          className="flex flex-col items-center gap-2 p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl transition-colors"
        >
          <MessageCircle className="text-[#25D366]" size={24} />
          <span className="text-xs font-bold text-[#25D366]">WhatsApp</span>
        </button>
        
        <button
          onClick={handleNativeShare}
          className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-colors"
        >
          <Share2 className="text-blue-400" size={24} />
          <span className="text-xs font-bold text-blue-400">Compartilhar</span>
        </button>
        
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex flex-col items-center gap-2 p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl transition-colors"
        >
          <QrCode className="text-purple-400" size={24} />
          <span className="text-xs font-bold text-purple-400">QR Code</span>
        </button>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl p-6 mb-4 flex flex-col items-center"
        >
          {/* QR Code Placeholder - In production use a library like qrcode.react */}
          <div className="w-48 h-48 bg-white flex items-center justify-center border-8 border-black rounded-xl">
            <div className="text-center">
              <QrCode size={80} className="text-black mx-auto mb-2" />
              <p className="text-xs text-black font-mono">{referralCode}</p>
            </div>
          </div>
          <p className="text-black text-xs mt-4 text-center font-medium">
            Escaneie para ganhar R$ {REFERRAL_CONFIG.REFERRED_DISCOUNT} de desconto!
          </p>
        </motion.div>
      )}

      {/* How it Works */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Como Funciona</p>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs">1</div>
          <span>Compartilhe seu código com amigos</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs">2</div>
          <span>Amigo ganha R$ {REFERRAL_CONFIG.REFERRED_DISCOUNT} no primeiro pedido</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold text-xs">
            <Zap size={12} />
          </div>
          <span className="text-green-400 font-bold">Você ganha R$ {REFERRAL_CONFIG.REFERRER_REWARD} de crédito!</span>
        </div>
      </div>
    </motion.div>
  );
}
