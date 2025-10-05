import { ReactNode } from 'react';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/' 
}: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="animate-fade-in">
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold">Donely</div>
            <div className="text-sm text-muted-foreground">Verificando acesso...</div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Allow access if no specific roles required or if user has required role
  if (!allowedRoles || allowedRoles.length === 0 || (profile && allowedRoles.includes(profile.role))) {
    return <>{children}</>;
  }

  // If profile doesn't exist but user is authenticated, allow access (temporary fix)
  if (!profile) {
    console.warn('⚠️ User authenticated but no profile found - allowing access temporarily');
    return <>{children}</>;
  }

  // Check if user role is allowed
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};