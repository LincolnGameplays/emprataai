/**
 * 🛡️ API CLIENT - Guardião de Conexão
 * 
 * Resilience Layer que:
 * - Tenta requisições com retry automático
 * - Ativa Modo de Contingência (Mockups) em falha
 * - Notifica usuário elegantemente
 * - Nunca deixa a UI quebrar
 */

import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface RequestOptions<T> {
  /** O que retornar se der erro (Mock/Fallback) */
  fallback?: T;
  /** Se true, não mostra Toast de erro */
  silent?: boolean;
  /** Número de tentativas antes de desistir (default: 2) */
  retries?: number;
  /** Delay entre retries em ms (default: 1000) */
  retryDelay?: number;
  /** Mensagem customizada de sucesso */
  successMessage?: string;
}

interface ConnectionStatus {
  isOnline: boolean;
  lastCheck: Date;
  failedServices: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL CONNECTION STATE
// ═══════════════════════════════════════════════════════════════════════════

let connectionStatus: ConnectionStatus = {
  isOnline: navigator.onLine,
  lastCheck: new Date(),
  failedServices: []
};

// Listen to online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    connectionStatus.isOnline = true;
    connectionStatus.lastCheck = new Date();
    toast.success('Conexão restaurada!', { duration: 3000 });
  });

  window.addEventListener('offline', () => {
    connectionStatus.isOnline = false;
    connectionStatus.lastCheck = new Date();
    toast.error('Sem conexão com a internet', { 
      description: 'Usando dados offline quando disponível',
      duration: 5000 
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SAFE REQUEST - O Coração da Resiliência
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Executa uma requisição com retry automático e fallback
 * @param promiseFn Função que retorna a Promise (lazy execution para retry)
 * @param errorMessage Mensagem de erro amigável
 * @param options Configurações de retry e fallback
 */
export async function safeRequest<T>(
  promiseFn: () => Promise<T>,
  errorMessage: string,
  options: RequestOptions<T> = {}
): Promise<T> {
  const { 
    fallback, 
    silent = false, 
    retries = 2, 
    retryDelay = 1000,
    successMessage 
  } = options;

  // Check offline first
  if (!navigator.onLine && fallback !== undefined) {
    if (!silent) {
      toast.info('Modo Offline', { 
        description: 'Usando dados locais',
        duration: 3000 
      });
    }
    return fallback;
  }

  let lastError: any;

  // Retry loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await promiseFn();
      
      // Success!
      if (successMessage) {
        toast.success(successMessage, { duration: 2000 });
      }
      
      return result;

    } catch (error: any) {
      lastError = error;
      console.error(`[safeRequest] Attempt ${attempt + 1}/${retries + 1} failed:`, error.message);

      // Don't retry on specific errors
      if (isNonRetryableError(error)) {
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`[safeRequest] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  console.error(`[safeRequest] All retries exhausted:`, errorMessage, lastError);

  // Notify user (unless silent)
  if (!silent) {
    const errorType = categorizeError(lastError);
    
    toast.error(errorType.title, {
      description: fallback !== undefined 
        ? 'Ativando sistema de backup...' 
        : errorType.description,
      duration: 5000,
    });
  }

  // Return fallback if available
  if (fallback !== undefined) {
    return fallback;
  }

  // No fallback, throw the error
  throw lastError;
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CATEGORIZATION
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorCategory {
  title: string;
  description: string;
  type: 'network' | 'quota' | 'auth' | 'server' | 'unknown';
}

function categorizeError(error: any): ErrorCategory {
  const message = error?.message?.toLowerCase() || '';
  const status = error?.status || error?.response?.status;

  // Quota exceeded (429)
  if (status === 429 || message.includes('429') || message.includes('quota')) {
    return {
      title: 'IA Ocupada',
      description: 'Usando gerador local.',
      type: 'quota'
    };
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('cors') || !navigator.onLine) {
    return {
      title: 'Sem Conexão',
      description: 'Verifique sua internet.',
      type: 'network'
    };
  }

  // Auth errors
  if (status === 401 || status === 403 || message.includes('unauthorized') || message.includes('forbidden')) {
    return {
      title: 'Acesso Negado',
      description: 'Faça login novamente.',
      type: 'auth'
    };
  }

  // Server errors
  if (status >= 500 || message.includes('internal') || message.includes('server')) {
    return {
      title: 'Servidor Indisponível',
      description: 'Tente novamente em alguns minutos.',
      type: 'server'
    };
  }

  // Unknown
  return {
    title: 'Erro Inesperado',
    description: 'Tente novamente mais tarde.',
    type: 'unknown'
  };
}

function isNonRetryableError(error: any): boolean {
  const status = error?.status || error?.response?.status;
  // Don't retry auth errors or client errors (except 429)
  return (status >= 400 && status < 500 && status !== 429);
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  return { ...connectionStatus };
}

/**
 * Wrapper for fetch with automatic error handling
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  requestOptions?: RequestOptions<T>
): Promise<T> {
  return safeRequest(
    async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }
      
      return response.json();
    },
    `Erro ao carregar ${url}`,
    requestOptions
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HAPTIC FEEDBACK (Mobile UX)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Trigger haptic feedback on supported devices
 */
export function vibrate(pattern: number | number[] = 10): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/**
 * Light tap feedback
 */
export function hapticTap(): void {
  vibrate(10);
}

/**
 * Success feedback
 */
export function hapticSuccess(): void {
  vibrate([10, 50, 10]);
}

/**
 * Error feedback
 */
export function hapticError(): void {
  vibrate([50, 30, 50]);
}
