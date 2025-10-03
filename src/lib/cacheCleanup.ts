/**
 * Utilitário para limpeza específica de cookies e cache
 * Foca nos problemas mais comuns que causam travamentos
 */

export interface CacheCleanupOptions {
  includeBrowserCache?: boolean;
  includeServiceWorkers?: boolean;
  includeIndexedDB?: boolean;
  verbose?: boolean;
}

export class CacheCleanupService {
  private static log(message: string, verbose = true) {
    if (verbose) {
      console.log(`🧹 CacheCleanup: ${message}`);
    }
  }

  /**
   * Limpa cookies específicos que podem causar conflitos
   */
  static async clearProblematicCookies(verbose = true) {
    this.log('Iniciando limpeza de cookies problemáticos...', verbose);
    
    const problematicCookies = [
      // Cookies do Supabase
      'sb-mwtuixdmiahthqeswdqb-auth-token',
      'sb-auth-token', 
      'supabase.auth.token',
      'supabase-auth-token',
      
      // Cookies do Cloudflare que podem causar problemas
      '__cf_bm',
      '__cfruid', 
      '__cflb',
      'cf_clearance',
      
      // Cookies de sessão genéricos
      'session',
      'sessionid',
      'JSESSIONID',
      'PHPSESSID',
      
      // Cookies de autenticação
      'auth',
      'authentication',
      'access_token',
      'refresh_token',
    ];

    const domains = [
      window.location.hostname,
      '.supabase.co',
      '.mwtuixdmiahthqeswdqb.supabase.co',
      'donely.site',
      '.donely.site',
      'donely-ax96m.ondigitalocean.app',
      '.ondigitalocean.app',
      '.digitalocean.app'
    ];

    let clearedCount = 0;

    // Limpar cookies específicos
    for (const cookieName of problematicCookies) {
      for (const domain of domains) {
        try {
          // Múltiplas tentativas com diferentes caminhos e domínios
          const cookieStrings = [
            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`,
            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain};`,
            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}; secure;`,
            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}; samesite=strict;`
          ];

          cookieStrings.forEach(cookieString => {
            document.cookie = cookieString;
          });
          
          clearedCount++;
        } catch (error) {
          this.log(`Erro ao limpar cookie ${cookieName} para ${domain}: ${error}`, verbose);
        }
      }
    }

    // Limpar TODOS os cookies atuais também
    try {
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        
        if (name) {
          domains.forEach(domain => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain};`;
          });
        }
      });
    } catch (error) {
      this.log(`Erro na limpeza geral de cookies: ${error}`, verbose);
    }

    this.log(`Cookies limpos: ${clearedCount}`, verbose);
  }

  /**
   * Limpa storage específico
   */
  static async clearStorage(verbose = true) {
    this.log('Limpando storage...', verbose);
    
    try {
      // localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorage.clear();
      this.log(`localStorage limpo: ${localStorageKeys.length} itens`, verbose);

      // sessionStorage  
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorage.clear();
      this.log(`sessionStorage limpo: ${sessionStorageKeys.length} itens`, verbose);

    } catch (error) {
      this.log(`Erro ao limpar storage: ${error}`, verbose);
    }
  }

  /**
   * Limpa cache do navegador (quando possível)
   */
  static async clearBrowserCache(verbose = true) {
    this.log('Tentando limpar cache do navegador...', verbose);
    
    try {
      // Cache API (Service Workers)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            this.log(`Removendo cache: ${cacheName}`, verbose);
            return caches.delete(cacheName);
          })
        );
        this.log(`Caches removidos: ${cacheNames.length}`, verbose);
      }

      // IndexedDB
      if ('indexedDB' in window) {
        // Não podemos listar todos os DBs, mas podemos tentar alguns conhecidos
        const knownDBs = ['supabase-cache', 'auth-cache', 'app-cache'];
        
        for (const dbName of knownDBs) {
          try {
            indexedDB.deleteDatabase(dbName);
            this.log(`IndexedDB removido: ${dbName}`, verbose);
          } catch (error) {
            // Ignorar erros - DB pode não existir
          }
        }
      }

    } catch (error) {
      this.log(`Erro ao limpar cache: ${error}`, verbose);
    }
  }

  /**
   * Limpeza completa e agressiva
   */
  static async performFullCleanup(options: CacheCleanupOptions = {}) {
    const { 
      includeBrowserCache = true, 
      includeServiceWorkers = true, 
      includeIndexedDB = true,
      verbose = true 
    } = options;

    this.log('=== INICIANDO LIMPEZA COMPLETA ===', verbose);
    
    // 1. Cookies problemáticos
    await this.clearProblematicCookies(verbose);
    
    // 2. Storage
    await this.clearStorage(verbose);
    
    // 3. Cache do navegador
    if (includeBrowserCache) {
      await this.clearBrowserCache(verbose);
    }

    // 4. Service Workers
    if (includeServiceWorkers && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => {
            this.log(`Removendo Service Worker: ${registration.scope}`, verbose);
            return registration.unregister();
          })
        );
        this.log(`Service Workers removidos: ${registrations.length}`, verbose);
      } catch (error) {
        this.log(`Erro ao remover Service Workers: ${error}`, verbose);
      }
    }

    this.log('=== LIMPEZA COMPLETA FINALIZADA ===', verbose);
  }

  /**
   * Força reload com cache busting
   */
  static forceReload() {
    // Adiciona timestamp para evitar cache
    const url = new URL(window.location.href);
    url.searchParams.set('_t', Date.now().toString());
    url.searchParams.set('_cache_bust', Math.random().toString(36));
    
    window.location.href = url.toString();
  }
}

// Função de conveniência para uso rápido
export const emergencyCleanup = () => CacheCleanupService.performFullCleanup({ verbose: true });