import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/components/auth/LoginPage';

const Index = () => {
  const { user, profile, session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const lastStateRef = useRef<string>('');
  const stuckCounterRef = useRef(0);
  const performanceStartRef = useRef(Date.now());

  // Prefer role from profile; fallback to session.user.user_metadata.role to avoid UI "travar" ao voltar para 
  // a home enquanto o perfil ainda carrega.
  const effectiveRole = useMemo(() => {
    return profile?.role || (session?.user?.user_metadata as any)?.role || null;
  }, [profile?.role, session?.user?.user_metadata]);

  // Sistema de detecção de travamento e recuperação automática
  useEffect(() => {
    const currentState = JSON.stringify({ 
      user: !!user, 
      profile: !!profile, 
      loading, 
      effectiveRole 
    });
    
    // Detectar se está preso no mesmo estado
    if (lastStateRef.current === currentState) {
      stuckCounterRef.current++;
      console.log(`🔍 Index: Estado repetido ${stuckCounterRef.current}x:`, currentState);
    } else {
      stuckCounterRef.current = 0;
      lastStateRef.current = currentState;
    }
    
    // Se está preso no mesmo estado por muito tempo, forçar recuperação
    if (stuckCounterRef.current >= 10) { // ~3 segundos de estado idêntico
      console.log('🚨 Index: TRAVAMENTO DETECTADO! Iniciando recuperação de emergência...');
      handleEmergencyRecovery();
    }
    
    // Performance monitoring - se passou de 30 segundos total, algo está errado
    const totalTime = Date.now() - performanceStartRef.current;
    if (totalTime > 30000 && !isRecovering) {
      console.log('⏱️ Index: Tempo limite de 30s excedido, forçando recuperação...');
      handleEmergencyRecovery();
    }
  }, [user, profile, loading, effectiveRole, isRecovering]);

  // Função de recuperação de emergência
  const handleEmergencyRecovery = async () => {
    if (isRecovering || recoveryAttempts >= 3) return;
    
    setIsRecovering(true);
    setRecoveryAttempts(prev => prev + 1);
    
    console.log(`🛠️ Index: Tentativa de recuperação ${recoveryAttempts + 1}/3`);
    
    try {
      // Limpeza agressiva de todos os dados
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpar cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      // Força logout
      await signOut();
      
      // Reset estados
      setLoadingTimeout(true);
      stuckCounterRef.current = 0;
      
      // Se já tentou 3 vezes, recarrega a página completamente
      if (recoveryAttempts >= 2) {
        console.log('🔄 Index: Múltiplas tentativas falharam, recarregando página...');
        window.location.reload();
        return;
      }
      
    } catch (error) {
      console.error('❌ Index: Erro na recuperação de emergência:', error);
      window.location.reload();
    } finally {
      setTimeout(() => setIsRecovering(false), 2000);
    }
  };

  // Timeout original mantido como backup
  useEffect(() => {
    if (user && !effectiveRole && !loading && !isRecovering) {
      const timer = setTimeout(() => {
        console.log('⏰ Index: Timeout de 5s - forçando logout');
        setLoadingTimeout(true);
        signOut();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [user, effectiveRole, loading, signOut, isRecovering]);

  useEffect(() => {
    if (user && effectiveRole) {
      const target = effectiveRole === 'ADMIN' ? '/admin' : '/client';
      navigate(target, { replace: true });
    }
  }, [user, effectiveRole, navigate]);

  // Show loading while checking auth (com timeout)
  if (loading || (user && !effectiveRole && !loadingTimeout)) {
    const totalTime = Math.floor((Date.now() - performanceStartRef.current) / 1000);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="animate-fade-in">
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold">Donely</div>
            <div className="text-sm text-muted-foreground">
              {isRecovering ? `🛠️ Recuperando sistema... (Tentativa ${recoveryAttempts}/3)` :
               loading ? 'Carregando...' : 'Verificando perfil...'}
            </div>
            <div className="text-xs text-gray-400">
              Tempo: {totalTime}s | Estados: {stuckCounterRef.current}
            </div>
            {totalTime > 10 && (
              <div className="text-xs text-yellow-400 max-w-md mx-auto">
                ⚠️ Carregamento demorado detectado. Sistema de recuperação ativo.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error if timeout occurred
  if (loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="animate-fade-in">
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold">Donely</div>
            <div className="text-sm text-red-400">
              Erro ao carregar perfil. Redirecionando para login...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Se chegou aqui, o efeito de navegação vai redirecionar conforme o role.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
      <div className="animate-fade-in">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold">Donely</div>
          <div className="text-sm text-muted-foreground">Redirecionando...</div>
        </div>
      </div>
    </div>
  );
};

export default Index;
