import { toast } from 'sonner';

interface RequestOptions {
  retries?: number;
  backoff?: number;
  fallback?: any;
  silent?: boolean; // Se true, não mostra toast de erro
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enterprise-grade API Wrapper com Retry Exponencial e Fallback
 */
export async function safeRequest<T>(
  promise: Promise<T> | (() => Promise<T>),
  errorMsg: string,
  options: RequestOptions = {}
): Promise<T> {
  const { retries = 3, backoff = 1000, fallback, silent = false } = options;

  // 1. Verificação de Conectividade (Offline-First)
  if (!navigator.onLine) {
    if (fallback !== undefined) {
      if (!silent) toast.warning("Modo Offline: Usando dados locais.");
      return fallback;
    }
    const msg = "Sem conexão com a internet. Ação indisponível offline.";
    if (!silent) toast.error(msg);
    throw new Error(msg);
  }

  // 2. Lógica de Retry (Tentativas)
  let attempt = 0;
  while (attempt <= retries) {
    try {
      // Suporta tanto Promises diretas quanto funções que retornam Promises
      const result = typeof promise === 'function' ? await promise() : await promise;
      return result;
    } catch (error: any) {
      attempt++;
      console.error(`API Error (Attempt ${attempt}/${retries + 1}):`, error);

      // Se for erro crítico (4xx), não adianta tentar de novo
      const isCritical = error?.response?.status >= 400 && error?.response?.status < 500;
      if (isCritical || attempt > retries) {
        if (!silent) toast.error(errorMsg || "Erro de conexão com o servidor.");
        
        if (fallback !== undefined) return fallback;
        throw error;
      }

      // Espera exponencial (1s, 2s, 4s...) antes de tentar de novo
      await sleep(backoff * Math.pow(2, attempt - 1));
    }
  }

  throw new Error("Max retries reached");
}
