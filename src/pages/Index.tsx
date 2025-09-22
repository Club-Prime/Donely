import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/components/auth/LoginPage';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on user role
      if (profile.role === 'ADMIN') {
        navigate('/admin');
      } else if (profile.role === 'CLIENT') {
        navigate('/client');
      }
    }
  }, [user, profile, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
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

  return <LoginPage />;
};

export default Index;
