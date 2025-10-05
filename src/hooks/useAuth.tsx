import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export type UserRole = 'ADMIN' | 'CLIENT';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, username: string, role: UserRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for user ID:', userId);
      console.log('🔍 Supabase client:', !!supabase);

      // Criar uma promise com timeout
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 5000); // 5 segundos timeout
      });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('🔍 Query result - data:', data);
      console.log('🔍 Query result - error:', error);

      if (error) {
        console.error('❌ Error fetching profile:', error);
        console.error('❌ Error details:', error.message, error.details, error.hint);
        return null;
      }

      if (!data) {
        console.log('⚠️ No profile found for user ID:', userId);
        console.log('⚠️ This might indicate the profile table is empty or user_id mismatch');
        return null;
      }

      console.log('✅ Profile found:', data);
      console.log('✅ Profile role:', data.role);
      return data as Profile;
    } catch (error: any) {
      console.error('💥 Exception in fetchProfile:', error);
      console.error('💥 Error message:', error.message);
      if (error.message === 'Query timeout') {
        console.warn('⚠️ Profile fetch timed out - allowing access without profile');
      }
      return null;
    }
  };

  const refetchProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleSession = async (session: Session | null) => {
      console.log('🔄 handleSession called with session:', !!session);
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      const currentSession = session;

      console.log('🔄 Setting user and session:', !!currentUser, !!currentSession);
      setSession(currentSession);
      setUser(currentUser);

      try {
        if (currentUser) {
          console.log('🔄 Fetching profile for user:', currentUser.id);
          const profileData = await fetchProfile(currentUser.id);
          console.log('🔄 Profile fetch result:', !!profileData);
          if (mounted) {
            setProfile(profileData);
            setLoading(false);
            console.log('✅ Loading set to false (with user)');
          }
        } else {
          console.log('🔄 No user, setting profile to null');
          if (mounted) {
            setProfile(null);
            setLoading(false);
            console.log('✅ Loading set to false (no user)');
          }
        }
      } catch (error) {
        console.error('❌ Error in handleSession:', error);
        // Mesmo com erro, permitir que o usuário continue sem perfil
        if (mounted) {
          setProfile(null);
          setLoading(false);
          console.log('✅ Loading set to false (error - allowing access without profile)');
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        await handleSession(session);
      }
    );

    // Check for existing session only once
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Erro inesperado durante o login' };
    }
  };

  const signUp = async (email: string, password: string, name: string, username: string, role: UserRole) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            username,
            role,
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Erro inesperado durante o registro' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      // Limpar tokens duplicados específicos primeiro
      localStorage.removeItem('donely-auth-token');
      localStorage.removeItem('sb-mwtuixdmiahthqeswdqb-auth-token');
      
      // Limpeza agressiva de todos os storages
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpar cookies específicos do Supabase (se existirem)
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.supabase.co`;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      });

      setUser(null);
      setProfile(null);
      setSession(null);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      
      // Mesmo com erro, force a limpeza
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setProfile(null);
      setSession(null);
      
      toast({
        title: "Logout forçado",
        description: "Sessão limpa localmente.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};