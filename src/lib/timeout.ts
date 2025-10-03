/**
 * Utilitário para adicionar timeout a promessas
 * Evita travamentos em requisições que podem demorar demais
 */

export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = 10000,
  timeoutMessage: string = 'Operação demorou mais que o esperado'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout: ${timeoutMessage}`)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Hook para criar um timeout de segurança em useEffect
 * Força um estado de loading=false após um tempo limite
 */
export function createSafetyTimeout(
  callback: () => void, 
  timeoutMs: number = 15000,
  logMessage: string = 'Timeout de segurança ativado'
): { timeoutId: NodeJS.Timeout; cleanup: () => void } {
  const timeoutId = setTimeout(() => {
    console.log(`⚠️ ${logMessage}`);
    callback();
  }, timeoutMs);

  const cleanup = () => {
    clearTimeout(timeoutId);
  };

  return { timeoutId, cleanup };
}