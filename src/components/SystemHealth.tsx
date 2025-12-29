/**
 * ⚡ SYSTEM HEALTH - Self-Diagnostic Modal ⚡
 * Runs automated tests to help users troubleshoot issues
 * Shows ✅ or ❌ with friendly error messages
 */

import { useState, useEffect }from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Wifi, WifiOff, Clock, Chrome, HardDrive, 
  Printer, CheckCircle, XCircle, Loader2, RefreshCw,
  AlertTriangle, Activity
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════
// TEST DEFINITIONS
// ══════════════════════════════════════════════════════════════════

interface TestResult {
  id: string;
  name: string;
  icon: React.ElementType;
  status: 'pending' | 'running' | 'pass' | 'fail';
  message: string;
  errorHelp?: string;
}

const INITIAL_TESTS: TestResult[] = [
  { 
    id: 'internet', 
    name: 'Conexão com Internet', 
    icon: Wifi, 
    status: 'pending', 
    message: 'Verificando...' 
  },
  { 
    id: 'latency', 
    name: 'Latência do Servidor', 
    icon: Clock, 
    status: 'pending', 
    message: 'Verificando...' 
  },
  { 
    id: 'browser', 
    name: 'Navegador Compatível', 
    icon: Chrome, 
    status: 'pending', 
    message: 'Verificando...' 
  },
  { 
    id: 'storage', 
    name: 'Armazenamento Local', 
    icon: HardDrive, 
    status: 'pending', 
    message: 'Verificando...' 
  },
  { 
    id: 'print', 
    name: 'Sistema de Impressão', 
    icon: Printer, 
    status: 'pending', 
    message: 'Verificando...' 
  }
];

// ══════════════════════════════════════════════════════════════════
// TEST FUNCTIONS
// ══════════════════════════════════════════════════════════════════

async function runTests(onUpdate: (id: string, result: Partial<TestResult>) => void) {
  // Test 1: Internet Connection
  onUpdate('internet', { status: 'running' });
  await sleep(300);
  
  if (navigator.onLine) {
    onUpdate('internet', { status: 'pass', message: 'Conectado à internet' });
  } else {
    onUpdate('internet', { 
      status: 'fail', 
      message: 'Sem conexão com a internet',
      errorHelp: 'Parece que sua conexão caiu. O Emprata precisa de internet para gerar a IA. Verifique seu Wi-Fi ou dados móveis.'
    });
  }

  // Test 2: Latency (ping Google)
  onUpdate('latency', { status: 'running' });
  const latencyStart = performance.now();
  
  try {
    await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
    const latency = Math.round(performance.now() - latencyStart);
    
    if (latency < 500) {
      onUpdate('latency', { status: 'pass', message: `${latency}ms - Excelente` });
    } else if (latency < 1500) {
      onUpdate('latency', { status: 'pass', message: `${latency}ms - Aceitável` });
    } else {
      onUpdate('latency', { 
        status: 'fail', 
        message: `${latency}ms - Muito lento`,
        errorHelp: 'Sua internet está muito lenta. Isso pode causar erros ao salvar fotos. Tente se aproximar do roteador Wi-Fi.'
      });
    }
  } catch {
    onUpdate('latency', { 
      status: 'fail', 
      message: 'Falha ao conectar',
      errorHelp: 'Não foi possível verificar a conexão. Pode haver um firewall bloqueando.'
    });
  }

  // Test 3: Browser Compatibility
  onUpdate('browser', { status: 'running' });
  await sleep(200);
  
  const ua = navigator.userAgent.toLowerCase();
  const isChrome = ua.includes('chrome');
  const isSafari = ua.includes('safari') && !ua.includes('chrome');
  const isEdge = ua.includes('edg');
  const isFirefox = ua.includes('firefox');
  
  if (isChrome || isSafari || isEdge) {
    const browserName = isChrome ? 'Chrome' : isEdge ? 'Edge' : 'Safari';
    onUpdate('browser', { status: 'pass', message: `${browserName} - Compatível` });
  } else if (isFirefox) {
    onUpdate('browser', { 
      status: 'pass', 
      message: 'Firefox - Compatível (recomendamos Chrome)'
    });
  } else {
    onUpdate('browser', { 
      status: 'fail', 
      message: 'Navegador não recomendado',
      errorHelp: 'Recomendamos usar Google Chrome, Safari ou Microsoft Edge para a melhor experiência.'
    });
  }

  // Test 4: LocalStorage
  onUpdate('storage', { status: 'running' });
  await sleep(200);
  
  try {
    const testKey = '__emprata_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    // Check available space (rough estimate)
    let usedSpace = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        usedSpace += localStorage[key].length * 2; // UTF-16
      }
    }
    const usedMB = (usedSpace / (1024 * 1024)).toFixed(1);
    
    onUpdate('storage', { status: 'pass', message: `Disponível (usando ${usedMB}MB)` });
  } catch {
    onUpdate('storage', { 
      status: 'fail', 
      message: 'Armazenamento bloqueado',
      errorHelp: 'O navegador está em modo privado ou bloqueou o armazenamento. Tente sair do modo anônimo.'
    });
  }

  // Test 5: Print capability
  onUpdate('print', { status: 'running' });
  await sleep(200);
  
  if (typeof window.print === 'function') {
    onUpdate('print', { status: 'pass', message: 'Sistema de impressão disponível' });
  } else {
    onUpdate('print', { 
      status: 'fail', 
      message: 'Impressão não disponível',
      errorHelp: 'A função de impressão não está disponível neste navegador. Use Chrome para imprimir QR Codes.'
    });
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

interface SystemHealthProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemHealth({ isOpen, onClose }: SystemHealthProps) {
  const [tests, setTests] = useState<TestResult[]>(INITIAL_TESTS);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  // Run tests when modal opens
  useEffect(() => {
    if (isOpen && !hasRun) {
      runAllTests();
    }
  }, [isOpen, hasRun]);

  const runAllTests = async () => {
    setIsRunning(true);
    setTests(INITIAL_TESTS);

    await runTests((id, result) => {
      setTests(prev => prev.map(test => 
        test.id === id ? { ...test, ...result } : test
      ));
    });

    setIsRunning(false);
    setHasRun(true);
  };

  const handleRetest = () => {
    setHasRun(false);
    runAllTests();
  };

  const passCount = tests.filter(t => t.status === 'pass').length;
  const failCount = tests.filter(t => t.status === 'fail').length;
  const allPassed = failCount === 0 && passCount === tests.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121212] w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  allPassed ? 'bg-green-500/20' : failCount > 0 ? 'bg-red-500/20' : 'bg-white/10'
                }`}>
                  <Activity className={`w-5 h-5 ${
                    allPassed ? 'text-green-400' : failCount > 0 ? 'text-red-400' : 'text-white'
                  }`} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Diagnóstico do Sistema</h2>
                  <p className="text-xs text-white/40">
                    {isRunning ? 'Verificando...' : `${passCount}/${tests.length} testes OK`}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tests List */}
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {tests.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border transition-colors ${
                    test.status === 'pass' 
                      ? 'bg-green-500/10 border-green-500/20'
                      : test.status === 'fail'
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      test.status === 'pass' ? 'bg-green-500/20' :
                      test.status === 'fail' ? 'bg-red-500/20' :
                      'bg-white/10'
                    }`}>
                      {test.status === 'running' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                      ) : test.status === 'pass' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : test.status === 'fail' ? (
                        <XCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <test.icon className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{test.name}</p>
                      <p className={`text-xs ${
                        test.status === 'pass' ? 'text-green-400/70' :
                        test.status === 'fail' ? 'text-red-400/70' :
                        'text-white/40'
                      }`}>
                        {test.message}
                      </p>
                    </div>
                  </div>

                  {/* Error Help */}
                  {test.status === 'fail' && test.errorHelp && (
                    <div className="mt-3 p-3 bg-red-500/10 rounded-lg flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400/80 leading-relaxed">
                        {test.errorHelp}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={handleRetest}
                disabled={isRunning}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                Testar Novamente
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-primary rounded-xl font-bold text-sm transition-colors hover:brightness-110"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════════════════
// TRIGGER BUTTON (for use in settings)
// ══════════════════════════════════════════════════════════════════

export function SystemHealthButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
      >
        <Activity className="w-4 h-4" />
        Diagnóstico do Sistema
      </button>
      <SystemHealth isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
