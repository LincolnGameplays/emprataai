/**
 * ⚡ SMART HELP - Contextual Help Widget ⚡
 * Floating (?) button with slide-over panel
 * Shows page-specific help content based on current route
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, X, MessageCircle, Camera, Utensils, 
  Monitor, Printer, Users, Lightbulb, CheckCircle2,
  ChefHat, Palette, DollarSign, Share2, ExternalLink
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════
// HELP CONTENT BY ROUTE
// ══════════════════════════════════════════════════════════════════

interface HelpTip {
  icon: React.ElementType;
  title: string;
  content: string;
}

interface HelpPage {
  title: string;
  subtitle: string;
  tips: HelpTip[];
}

const HELP_CONTENTS: Record<string, HelpPage> = {
  '/studio': {
    title: 'Estúdio IA',
    subtitle: 'Dicas para fotos perfeitas',
    tips: [
      {
        icon: Camera,
        title: 'Tire uma foto bem iluminada',
        content: 'Luz natural (perto da janela) é melhor. Evite sombras fortes no prato.'
      },
      {
        icon: ChefHat,
        title: 'Como descrever um hambúrguer',
        content: 'Ex: "Burger artesanal com queijo derretendo, bacon crocante e molho especial brilhante"'
      },
      {
        icon: Palette,
        title: 'Escolha o estilo certo',
        content: '"Food Photography" = fundo limpo. "Fine Dining" = mais elegante. Experimente!'
      },
      {
        icon: Lightbulb,
        title: 'Dica de ouro',
        content: 'Adicione detalhes sensoriais: "fumaça saindo", "gelo escorrendo", "queijo puxando".'
      }
    ]
  },
  '/menu-builder': {
    title: 'Construtor de Cardápio',
    subtitle: 'Monte seu menu digital',
    tips: [
      {
        icon: Utensils,
        title: 'Como criar categorias',
        content: 'Clique em "+ Categoria" e organize: Entradas, Pratos Principais, Bebidas, Sobremesas.'
      },
      {
        icon: DollarSign,
        title: 'Preços estratégicos',
        content: 'Use R$ 24,90 ao invés de R$ 25. O ".90" aumenta conversão em até 15%!'
      },
      {
        icon: Camera,
        title: 'Fotos vendem mais',
        content: 'Itens com foto vendem 30% a mais. Use o Studio IA para gerar fotos profissionais.'
      },
      {
        icon: Share2,
        title: 'Compartilhe seu link',
        content: 'Copie o link do seu cardápio e coloque no Instagram Bio e WhatsApp Business.'
      }
    ]
  },
  '/kitchen-mode': {
    title: 'Tela da Cozinha (KDS)',
    subtitle: 'Sistema de pedidos em tempo real',
    tips: [
      {
        icon: Monitor,
        title: 'Como funciona o KDS',
        content: 'Os pedidos aparecem automaticamente. Clique para marcar como "Preparando" ou "Pronto".'
      },
      {
        icon: CheckCircle2,
        title: 'Significado das cores',
        content: '🟡 Amarelo = Pendente | 🔵 Azul = Preparando | 🟢 Verde = Pronto para servir'
      },
      {
        icon: Printer,
        title: 'Tela cheia recomendada',
        content: 'Pressione F11 para modo fullscreen. Ideal para tablets na cozinha.'
      }
    ]
  },
  '/tools': {
    title: 'Ferramentas & Apps',
    subtitle: 'Central de recursos',
    tips: [
      {
        icon: Monitor,
        title: 'Kitchen Display (KDS)',
        content: 'Tela dedicada para a cozinha ver pedidos em tempo real.'
      },
      {
        icon: Printer,
        title: 'QR Codes de Mesa',
        content: 'Imprima placas profissionais para cada mesa. O cliente escaneia e faz o pedido.'
      },
      {
        icon: Users,
        title: 'Gestão de Equipe',
        content: 'Cadastre garçons e motoboys. Cada um tem seu login por PIN.'
      }
    ]
  },
  '/dashboard': {
    title: 'Painel Principal',
    subtitle: 'Visão geral do seu negócio',
    tips: [
      {
        icon: Camera,
        title: 'Comece pelo Studio',
        content: 'Tire fotos dos seus pratos e transforme em profissionais com IA.'
      },
      {
        icon: Utensils,
        title: 'Monte seu Cardápio',
        content: 'Crie categorias, adicione itens e publique seu link de vendas.'
      },
      {
        icon: Monitor,
        title: 'Configure a Operação',
        content: 'Acesse Ferramentas para KDS, QR Codes e gestão de equipe.'
      }
    ]
  }
};

// Default help for unknown routes
const DEFAULT_HELP: HelpPage = {
  title: 'Central de Ajuda',
  subtitle: 'Navegue pela plataforma',
  tips: [
    {
      icon: Lightbulb,
      title: 'Precisa de ajuda?',
      content: 'Use o menu lateral para navegar entre as ferramentas do Emprata.'
    }
  ]
};

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function SmartHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Get help content for current route
  const getHelpContent = (): HelpPage => {
    // Try exact match first
    if (HELP_CONTENTS[location.pathname]) {
      return HELP_CONTENTS[location.pathname];
    }
    
    // Try partial match (e.g., /kitchen-mode matches /kitchen*)
    const partialMatch = Object.entries(HELP_CONTENTS).find(([route]) => 
      location.pathname.startsWith(route.replace('*', ''))
    );
    
    return partialMatch ? partialMatch[1] : DEFAULT_HELP;
  };

  const helpContent = getHelpContent();

  return (
    <>
      {/* Floating Help Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-110 transition-all"
        aria-label="Ajuda"
      >
        <HelpCircle className="w-6 h-6 text-white" />
      </motion.button>

      {/* Slide-over Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#0f0f0f] border-l border-white/10 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{helpContent.title}</h2>
                  <p className="text-sm text-white/40">{helpContent.subtitle}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {helpContent.tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <tip.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1">{tip.title}</h3>
                        <p className="text-sm text-white/60 leading-relaxed">{tip.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer - WhatsApp Support */}
              <div className="px-6 py-4 border-t border-white/10">
                <a
                  href="https://wa.me/5511999999999?text=Oi!%20Preciso%20de%20ajuda%20com%20o%20Emprata.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/40 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar com Suporte Humano
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
