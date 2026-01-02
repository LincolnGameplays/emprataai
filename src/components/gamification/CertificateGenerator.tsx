/**
 * 🏆 CertificateGenerator - Gerador de Certificados Virais
 * 
 * Gera uma imagem LINDÍSSIMA para o dono postar no Stories.
 * Efeito: Ele ganha status, e os seguidores veem a logo "EmprataAI".
 * 
 * Custo: ZERO
 * ROI: Marketing gratuito via viralização
 */

import { useRef, useState } from 'react';
import { Share2, Download, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { OwnerLevel } from '../../types/journey';

interface CertificateGeneratorProps {
  level: OwnerLevel;
  revenue: number;
}

export default function CertificateGenerator({ level, revenue }: CertificateGeneratorProps) {
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!ref.current) return;
    setLoading(true);
    
    try {
      // Importação dinâmica para evitar bundle desnecessário
      const { toPng } = await import('html-to-image');
      
      const dataUrl = await toPng(ref.current, { 
        pixelRatio: 3,
        backgroundColor: '#050505',
        cacheBust: true
      });
      
      // Download usando link criado dinamicamente
      const link = document.createElement('a');
      link.download = `Certificado_Emprata_${level.label.replace(/\s/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      
    } catch (err) {
      console.error('Erro ao gerar certificado:', err);
    }
    
    setLoading(false);
  };

  // Extrair cor base para gradientes
  const colorBase = level.color.split('-')[1]; // ex: 'blue' de 'text-blue-400'

  return (
    <div className="flex flex-col items-center gap-6">
      
      {/* ══════════════════════════════════════════════════════════════════
          A ÁREA DO CERTIFICADO
      ══════════════════════════════════════════════════════════════════ */}
      <div className="relative group shadow-2xl rounded-xl overflow-hidden border border-white/10">
        <div 
          ref={ref}
          className="w-[360px] h-[480px] bg-[#050505] relative flex flex-col items-center justify-between p-6 text-center font-sans"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {/* Background Effects */}
          <div className={`absolute inset-0 bg-gradient-to-b from-black via-black to-${colorBase}-900/30`} />
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ 
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
            }}
          />
          
          {/* Decorative Border */}
          <div className="absolute inset-3 border-2 border-white/10 rounded-lg pointer-events-none" />
          
          {/* ══════════════════════════════════════════════════════════════
              HEADER
          ══════════════════════════════════════════════════════════════ */}
          <div className="relative z-10 mt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles size={14} className="text-white/40" />
              <h2 className="text-xs font-black text-white/60 tracking-[0.3em] uppercase">
                Certificado de Conquista
              </h2>
              <Sparkles size={14} className="text-white/40" />
            </div>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto" />
          </div>

          {/* ══════════════════════════════════════════════════════════════
              CONTENT - Ícone e Nível
          ══════════════════════════════════════════════════════════════ */}
          <div className="relative z-10 flex flex-col items-center py-6">
            {/* Ícone com Glow */}
            <div 
              className="text-7xl mb-4"
              style={{ 
                filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))',
                textShadow: '0 0 40px rgba(255,255,255,0.3)'
              }}
            >
              {level.icon}
            </div>
            
            {/* Nome do Nível */}
            <h1 className={`text-2xl font-black ${level.color} uppercase tracking-tight mb-3`}>
              {level.label}
            </h1>
            
            {/* Descrição */}
            <p className="text-white/50 text-xs px-6 leading-relaxed">
              Certificamos que o estabelecimento{' '}
              <strong className="text-white">{user?.displayName || 'Restaurante'}</strong>{' '}
              atingiu a marca histórica de faturamento verificado na plataforma.
            </p>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              STATS BOX
          ══════════════════════════════════════════════════════════════ */}
          <div className="relative z-10 w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-4 backdrop-blur-sm">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">
              Faturamento Verificado
            </p>
            <p className="text-2xl font-black text-white">
              R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              BRANDING
          ══════════════════════════════════════════════════════════════ */}
          <div className="relative z-10 flex flex-col items-center gap-1">
            <div className="text-[10px] text-white/20 tracking-[0.4em] font-black uppercase">
              Powered by
            </div>
            <div className="text-sm font-black text-primary tracking-widest">
              EMPRATA.AI
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BOTÕES DE AÇÃO
      ══════════════════════════════════════════════════════════════════ */}
      <button 
        onClick={handleDownload}
        disabled={loading}
        className="bg-primary hover:bg-green-400 text-black px-8 py-3.5 rounded-xl font-black flex items-center gap-2 shadow-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin"/> 
            Gerando...
          </>
        ) : (
          <>
            <Share2 size={18} />
            COMPARTILHAR CONQUISTA
          </>
        )}
      </button>
      
      <p className="text-xs text-white/30 max-w-xs text-center">
        Poste no Instagram e marque <strong className="text-primary">@emprata.ai</strong> para ser repostado!
      </p>
    </div>
  );
}
