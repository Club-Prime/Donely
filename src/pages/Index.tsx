import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/components/auth/LoginPage';

const Index = () => {
  const { user, profile, session, loading } = useAuth();
  const navigate = useNavigate();

  // Prefer role from profile; fallback to session.user.user_metadata.role to avoid UI "travar" ao voltar para 
  // a home enquanto o perfil ainda carrega.
  const effectiveRole = useMemo(() => {
    return profile?.role || (session?.user?.user_metadata as any)?.role || null;
  }, [profile?.role, session?.user?.user_metadata]);

  useEffect(() => {
    if (user && effectiveRole) {
      const target = effectiveRole === 'ADMIN' ? '/admin' : '/client';
      navigate(target, { replace: true });
    }
  }, [user, effectiveRole, navigate]);

  // Show loading while checking auth
  if (loading || (user && !effectiveRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="animate-fade-in">
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold">Donely</div>
            <div className="text-sm text-muted-foreground">Carregando...</div>
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
