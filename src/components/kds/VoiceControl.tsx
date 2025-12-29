import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceControlProps {
  onCommand: (command: string, value: string) => void;
}

export default function VoiceControl({ onCommand }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'listening' | 'processing' | 'success'>('idle');
  
  const recognitionRef = useRef<any>(null);
  const isMounted = useRef(true);
  const restartTimer = useRef<any>(null);

  useEffect(() => {
    isMounted.current = true;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (isMounted.current) {
        setIsListening(true);
        setFeedback('listening');
      }
    };

    recognition.onresult = (event: any) => {
      const currentResultIndex = event.resultIndex;
      const transcript = event.results[currentResultIndex][0].transcript.toLowerCase();
      setLastTranscript(transcript);

      if (event.results[currentResultIndex].isFinal) {
        processCommand(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      // IGNORA erros comuns de loop para não sujar o console
      if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'not-allowed') {
        return; 
      }
      console.warn('Voice Log:', event.error);
    };

    recognition.onend = () => {
      if (isMounted.current) {
        setIsListening(false);
        // DELAY DE SEGURANÇA: Espera 1s antes de reiniciar para evitar loop 'aborted'
        clearTimeout(restartTimer.current);
        restartTimer.current = setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            // Ignora se já estiver rodando
          }
        }, 1000); 
      }
    };

    recognitionRef.current = recognition;
    
    // Tenta iniciar
    try {
      recognition.start();
    } catch (e) { console.log("Start bloqueado, aguardando interação."); }

    return () => {
      isMounted.current = false;
      clearTimeout(restartTimer.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const processCommand = (text: string) => {
    setFeedback('processing');
    const readyPattern = /(pedido|comanda|sai|mesa|número|numero)\s+(\d+)/i;
    const callWaiterPattern = /(chamar|chama|ajuda)\s+(garçom|gerente)/i;

    const readyMatch = text.match(readyPattern);
    const waiterMatch = text.match(callWaiterPattern);

    if (readyMatch) {
      const number = readyMatch[2];
      setFeedback('success');
      onCommand('ready', number);
      toast.success(`Comando de Voz: Pedido #${number} PRONTO!`);
      setTimeout(() => setFeedback('listening'), 2000);
    } 
    else if (waiterMatch) {
      setFeedback('success');
      onCommand('call_waiter', 'all');
      toast.info("Chamando Garçom!");
      setTimeout(() => setFeedback('listening'), 2000);
    }
    else {
      setFeedback('listening');
    }
  };

  return (
    <div className={`
      fixed bottom-6 right-6 z-50 flex items-center gap-4 p-4 rounded-full border backdrop-blur-xl transition-all duration-300
      ${feedback === 'listening' ? 'bg-black/80 border-primary/50' : ''}
      ${feedback === 'success' ? 'bg-green-500/20 border-green-500' : ''}
      ${feedback === 'idle' ? 'bg-black/50 border-white/10 opacity-50' : ''}
    `}>
      <div className="hidden md:block">
        {lastTranscript && feedback !== 'idle' && (
          <span className="text-sm font-mono text-white/80 mr-2">"{lastTranscript}"</span>
        )}
      </div>
      <div className="relative">
        {feedback === 'listening' && <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></span>}
        {feedback === 'success' ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : isListening ? <Mic className="w-8 h-8 text-primary" /> : <MicOff className="w-8 h-8 text-red-500" />}
      </div>
    </div>
  );
}
