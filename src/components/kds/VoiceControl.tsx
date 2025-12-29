/**
 * ⚡ KDS VOICE COMMANDER - Siri-Style Voice Control ⚡
 * Continuous voice listener for kitchen display
 * 
 * Commands:
 * - "Pedido [N] pronto" / "Sai o [N]" → Move to 'ready'
 * - "Chamar garçom" / "Ajuda" → Alert waiter
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

interface VoiceCommand {
  type: 'complete_order' | 'call_waiter' | 'unknown';
  orderNumber?: string;
  confidence: number;
  transcript: string;
}

interface VoiceControlProps {
  onCompleteOrder: (orderShortId: string) => void;
  onCallWaiter: () => void;
}

// ══════════════════════════════════════════════════════════════════
// COMMAND PATTERNS (Fuzzy Matching)
// ══════════════════════════════════════════════════════════════════

const COMPLETE_PATTERNS = [
  /pedido\s*(\w+)\s*pronto/i,
  /sai\s*o\s*(\w+)/i,
  /finalizar\s*(\w+)/i,
  /pronto\s*o\s*(\w+)/i,
  /(\w+)\s*pronto/i,
  /terminou\s*o?\s*(\w+)/i
];

const WAITER_PATTERNS = [
  /chamar\s*garçom/i,
  /chama\s*garçom/i,
  /ajuda\s*(no\s*)?balcão/i,
  /garçom\s*aqui/i,
  /preciso\s*de\s*ajuda/i,
  /socorro/i
];

// ══════════════════════════════════════════════════════════════════
// SOUND EFFECTS
// ══════════════════════════════════════════════════════════════════

function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Two-tone success beep
    [880, 1100].forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const startTime = audioContext.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  } catch (e) {
    console.log('Audio not available');
  }
}

function playErrorSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = 200;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Audio not available');
  }
}

// ══════════════════════════════════════════════════════════════════
// COMMAND PARSER
// ══════════════════════════════════════════════════════════════════

function parseCommand(transcript: string): VoiceCommand {
  const normalized = transcript.toLowerCase().trim();

  // Check for order completion commands
  for (const pattern of COMPLETE_PATTERNS) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      return {
        type: 'complete_order',
        orderNumber: match[1].toUpperCase(),
        confidence: 0.9,
        transcript
      };
    }
  }

  // Check for waiter call commands
  for (const pattern of WAITER_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        type: 'call_waiter',
        confidence: 0.95,
        transcript
      };
    }
  }

  return {
    type: 'unknown',
    confidence: 0,
    transcript
  };
}

// ══════════════════════════════════════════════════════════════════
// SIRI-STYLE WAVE ANIMATION
// ══════════════════════════════════════════════════════════════════

function SoundWave({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center gap-0.5 h-8">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={isActive ? {
            height: [8, 24, 16, 28, 12, 8],
          } : { height: 8 }}
          transition={{
            duration: 0.8,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.1,
            ease: 'easeInOut'
          }}
          className="w-1 rounded-full bg-gradient-to-t from-primary to-orange-400"
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function VoiceControl({ onCompleteOrder, onCallWaiter }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [lastTranscript, setLastTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still enabled
      if (recognitionRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Failed to restart recognition');
          }
        }, 500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setIsSupported(false);
        toast.error('Microfone não permitido. Habilite nas configurações do navegador.');
      }
    };

    recognition.onresult = (event: any) => {
      const results = event.results;
      const latestResult = results[results.length - 1];
      
      if (latestResult.isFinal) {
        const transcript = latestResult[0].transcript;
        setLastTranscript(transcript);
        setIsProcessing(true);

        // Parse command
        const command = parseCommand(transcript);

        if (command.type === 'complete_order' && command.orderNumber) {
          toast.success(`🎯 Comando: Pedido ${command.orderNumber} → PRONTO`, {
            duration: 2000
          });
          playSuccessSound();
          onCompleteOrder(command.orderNumber);
        } else if (command.type === 'call_waiter') {
          toast.success('🔔 Chamando Garçom...', { duration: 2000 });
          playSuccessSound();
          onCallWaiter();
        } else {
          // Show what was heard
          toast(`👂 Ouvido: "${transcript}"`, {
            duration: 1500,
            style: { opacity: 0.7 }
          });
        }

        setTimeout(() => {
          setIsProcessing(false);
          setLastTranscript('');
        }, 1500);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      try {
        recognition.stop();
      } catch (e) {}
      recognitionRef.current = null;
    };
  }, [onCompleteOrder, onCallWaiter]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }, [isListening]);

  if (!isSupported) {
    return (
      <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
        <MicOff className="w-4 h-4 text-red-400" />
        <span className="text-xs text-red-400">Voz não suportada</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-50">
      {/* Main Button */}
      <motion.button
        onClick={toggleListening}
        whileTap={{ scale: 0.95 }}
        className={`relative group flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
          isListening 
            ? 'bg-primary/20 border-primary/50 shadow-lg shadow-primary/20' 
            : 'bg-white/10 border-white/10 hover:bg-white/15'
        }`}
      >
        {/* Pulsing Ring */}
        {isListening && (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl border-2 border-primary"
          />
        )}

        {/* Icon or Wave */}
        {isListening || isProcessing ? (
          <SoundWave isActive={isListening && !isProcessing} />
        ) : (
          <Mic className="w-5 h-5 text-white/60 group-hover:text-white" />
        )}

        {/* Label */}
        <span className={`text-sm font-bold ${isListening ? 'text-primary' : 'text-white/60'}`}>
          {isProcessing ? 'Processando...' : isListening ? 'Ouvindo' : 'Ativar Voz'}
        </span>
      </motion.button>

      {/* Transcript Bubble */}
      <AnimatePresence>
        {lastTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-black/90 border border-white/10 rounded-xl max-w-[200px]"
          >
            <p className="text-xs text-white/60">Ouvindo:</p>
            <p className="text-sm font-bold truncate">"{lastTranscript}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Commands Help Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 p-3 bg-black/90 border border-white/10 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity max-w-[220px]">
        <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Comandos de Voz</p>
        <div className="space-y-1 text-xs text-white/70">
          <p>🍔 "Pedido [N] pronto"</p>
          <p>🍔 "Sai o [número]"</p>
          <p>🔔 "Chamar garçom"</p>
        </div>
      </div>
    </div>
  );
}
