import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/components/auth/LoginPage';

const Index = () => {
  const { user, profile, session, loading } = useAuth();
  const navigate = useNavigate();

  // Determinar o papel efetivo do usuário
  const effectiveRole = useMemo(() => {
    return profile?.role || (session?.user?.user_metadata as any)?.role || null;
  }, [profile?.role, session?.user?.user_metadata]);

  // Navegação automática baseada no papel do usuário
  useEffect(() => {
    if (user && effectiveRole && !loading) {
      console.log('Navegando para dashboard:', effectiveRole);
      const target = effectiveRole === 'ADMIN' ? '/admin' : '/client';
      navigate(target, { replace: true });
    }
  }, [user?.id, effectiveRole, loading]); // Usar user.id em vez de user para evitar re-execuções // Removido navigate das dependências

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="animate-fade-in">
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold text-white">Donely</div>
            <div className="text-sm text-gray-300">Carregando...</div>
          </div>
        </div>
      </div>
    );
  }

  // Usuário logado mas sem perfil válido
  if (user && !effectiveRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="animate-fade-in">
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold text-white">Donely</div>
            <div className="text-sm text-gray-300">Configurando perfil...</div>
          </div>
        </div>
      </div>
    );
  }

  // Não logado - mostrar tela de login
  return <LoginPage />;
};

export default Index;
