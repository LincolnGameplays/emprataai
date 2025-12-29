/**
 * ⚡ ONBOARDING TOUR - Guided First Access Experience ⚡
 * Uses driver.js for interactive platform tour
 * Runs automatically on first access (localStorage check)
 */

import { useEffect, useState, useCallback } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

// ══════════════════════════════════════════════════════════════════
// CUSTOM HOOK: useOnboarding
// ══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'emprata_has_seen_tour';

export function useOnboarding() {
  const [hasSeenTour, setHasSeenTour] = useState(true); // Default to true to prevent flash
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const seen = localStorage.getItem(STORAGE_KEY);
    setHasSeenTour(seen === 'true');
    setIsReady(true);
  }, []);

  const markTourAsDone = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasSeenTour(true);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSeenTour(false);
  }, []);

  return { hasSeenTour, isReady, markTourAsDone, resetTour };
}

// ══════════════════════════════════════════════════════════════════
// TOUR STEPS DEFINITION
// ══════════════════════════════════════════════════════════════════

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: '🚀 Bem-vindo ao Emprata!',
      description: 'Vamos configurar sua <strong>máquina de vendas</strong> em 30 segundos. Clique em "Próximo" para começar!',
      side: 'bottom',
      align: 'center',
    }
  },
  {
    element: '#tour-studio-card',
    popover: {
      title: '📸 Crie Fotos Mágicas',
      description: 'Aqui é onde a <strong>IA transforma fotos de celular em estúdio profissional</strong>. Tire uma foto do seu prato e veja a mágica acontecer!',
      side: 'bottom',
      align: 'start',
    }
  },
  {
    element: '#tour-menu-card',
    popover: {
      title: '🍔 Publique seu Cardápio',
      description: 'Crie seu <strong>link de vendas personalizado</strong>, defina preços e categorias. Seus clientes poderão pedir direto pelo celular!',
      side: 'bottom',
      align: 'center',
    }
  },
  {
    element: '#tour-tools-card',
    popover: {
      title: '⚡ Operação Profissional',
      description: 'Acesse a <strong>tela da cozinha (KDS)</strong>, imprima QR Codes para mesas e gerencie sua equipe. Tudo para você operar como um restaurante top!',
      side: 'top',
      align: 'center',
    }
  },
  {
    popover: {
      title: '✅ Você está pronto!',
      description: 'Agora é só começar a criar. Se precisar de ajuda, clique no <strong>botão (?) no canto inferior direito</strong>. Boas vendas! 🎉',
      side: 'bottom',
      align: 'center',
    }
  }
];

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

interface OnboardingTourProps {
  forceStart?: boolean;
  onComplete?: () => void;
}

export default function OnboardingTour({ forceStart = false, onComplete }: OnboardingTourProps) {
  const { hasSeenTour, isReady, markTourAsDone } = useOnboarding();
  const [tourStarted, setTourStarted] = useState(false);

  useEffect(() => {
    // Don't start until ready and not already started
    if (!isReady || tourStarted) return;
    
    // Start tour if first access or forced
    if (!hasSeenTour || forceStart) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startTour();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isReady, hasSeenTour, forceStart, tourStarted]);

  const startTour = () => {
    setTourStarted(true);

    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Próximo →',
      prevBtnText: '← Anterior',
      doneBtnText: 'Começar! 🚀',
      progressText: '{{current}} de {{total}}',
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.85)',
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'emprata-tour-popover',
      steps: TOUR_STEPS,
      onDestroyStarted: () => {
        markTourAsDone();
        onComplete?.();
        driverObj.destroy();
      },
    });

    driverObj.drive();
  };

  return (
    <>
      {/* Inject custom styles for driver.js */}
      <style>{`
        .emprata-tour-popover {
          background: #18181b !important;
          color: #fff !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 16px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
        }

        .emprata-tour-popover .driver-popover-title {
          color: #fff !important;
          font-size: 1.25rem !important;
          font-weight: 800 !important;
        }

        .emprata-tour-popover .driver-popover-description {
          color: rgba(255,255,255,0.7) !important;
          font-size: 0.95rem !important;
          line-height: 1.6 !important;
        }

        .emprata-tour-popover .driver-popover-description strong {
          color: #FF6B00 !important;
        }

        .emprata-tour-popover .driver-popover-progress-text {
          color: rgba(255,255,255,0.4) !important;
          font-size: 0.75rem !important;
        }

        .emprata-tour-popover .driver-popover-navigation-btns {
          gap: 8px !important;
        }

        .emprata-tour-popover button.driver-popover-next-btn,
        .emprata-tour-popover button.driver-popover-prev-btn {
          background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%) !important;
          color: #fff !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 10px 20px !important;
          font-weight: 700 !important;
          font-size: 0.875rem !important;
          text-shadow: none !important;
          transition: all 0.2s !important;
        }

        .emprata-tour-popover button.driver-popover-prev-btn {
          background: rgba(255,255,255,0.1) !important;
        }

        .emprata-tour-popover button.driver-popover-next-btn:hover {
          filter: brightness(1.1) !important;
        }

        .emprata-tour-popover button.driver-popover-close-btn {
          color: rgba(255,255,255,0.4) !important;
        }

        .emprata-tour-popover button.driver-popover-close-btn:hover {
          color: #fff !important;
        }

        .driver-popover-arrow-side-left,
        .driver-popover-arrow-side-right,
        .driver-popover-arrow-side-top,
        .driver-popover-arrow-side-bottom {
          border-color: #18181b !important;
        }
      `}</style>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// STANDALONE TRIGGER BUTTON (for Settings/Profile page)
// ══════════════════════════════════════════════════════════════════

export function RestartTourButton() {
  const { resetTour } = useOnboarding();

  const handleClick = () => {
    resetTour();
    window.location.reload();
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors"
    >
      🎓 Refazer Tour Guiado
    </button>
  );
}
