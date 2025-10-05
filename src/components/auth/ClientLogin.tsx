import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClientLoginProps {
  onBack: () => void;
}

interface LoginForm {
  username: string;
  password: string;
}

export const ClientLogin = ({ onBack }: ClientLoginProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const debugUsers = async () => {
    try {
      console.log('=== DEBUG DE USUÁRIOS ===');
      console.log('Buscando todos os clientes...');
      const { data: allClients, error } = await supabase
        .from('profiles')
        .select('id, name, username, email, role, is_active')
        .eq('role', 'CLIENT');
      
      console.log('Todos os clientes encontrados:', allClients);
      if (error) console.error('Erro ao buscar clientes:', error);
      
      if (!allClients || allClients.length === 0) {
        console.log('Buscando todos os perfis para debug...');
        const { data: allProfiles, error: allError } = await supabase
          .from('profiles')
          .select('id, name, username, email, role, is_active');
        
        console.log('Todos os perfis encontrados:', allProfiles);
        if (allError) console.error('Erro ao buscar perfis:', allError);
        
        // Mostrar estatísticas de roles
        const roleStats = allProfiles?.reduce((acc, profile) => {
          acc[profile.role] = (acc[profile.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        console.log('Estatísticas por role:', roleStats);
        
        toast({
          title: "Debug",
          description: `Nenhum cliente CLIENT encontrado. Total de perfis: ${allProfiles?.length || 0}. Verifique o console.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Debug",
          description: `Encontrados ${allClients?.length || 0} clientes. Verifique o console.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erro no debug:', error);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    
    try {
      console.log('=== INICIO DO LOGIN DE CLIENTE ===');
      console.log('Tentando fazer login com username:', data.username);
      
      // First, find the user by username to get their real email
      console.log('Buscando perfil com username:', data.username);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, is_active, user_id, name, role, username')
        .eq('username', data.username)
        .eq('role', 'CLIENT')
        .maybeSingle();

      console.log('Resultado da busca por username:', { profileData, profileError });

      // Se não encontrou, tentar busca sem filtro de role para debug
      if (profileError || !profileData) {
        console.log('Tentando busca sem filtro de role...');
        const { data: debugProfile, error: debugError } = await supabase
          .from('profiles')
          .select('email, is_active, user_id, name, role, username')
          .eq('username', data.username)
          .maybeSingle();
        
        console.log('Resultado da busca sem filtro:', { debugProfile, debugError });
        
        // Se encontrou mas com role diferente
        if (debugProfile && debugProfile.role !== 'CLIENT') {
          console.log('Usuário encontrado mas com role:', debugProfile.role);
          toast({
            title: "Erro no login",
            description: `Este usuário tem perfil ${debugProfile.role}, não CLIENT.`,
            variant: "destructive",
          });
          return;
        }
        
        if (!debugProfile) {
          console.log('Username não encontrado na base de dados');
          // Buscar todos os usernames que começam similar para debug
          const { data: similarUsers } = await supabase
            .from('profiles')
            .select('username, role')
            .ilike('username', `%${data.username.substring(0, 4)}%`)
            .limit(5);
          
          console.log('Usernames similares encontrados:', similarUsers);
          
          toast({
            title: "Erro no login", 
            description: "Username não encontrado. Verifique se foi digitado corretamente.",
            variant: "destructive",
          });
          return;
        }
      }

      if (profileError || !profileData) {
        console.error('Usuário não encontrado:', profileError);
        toast({
          title: "Erro no login",
          description: "Usuário não encontrado. Verifique se o username está correto.",
          variant: "destructive",
        });
        return;
      }

      if (!profileData.is_active) {
        console.log('Conta desativada para usuário:', data.username);
        toast({
          title: "Conta desativada",
          description: "Sua conta foi desativada. Entre em contato com o administrador.",
          variant: "destructive",
        });
        return;
      }

      console.log('Tentando fazer login com email:', profileData.email);

      // Use the real email to sign in
      const { error } = await signIn(profileData.email, data.password);
      
      if (error) {
        console.error('Erro no signIn:', error);
        toast({
          title: "Erro no login",
          description: "Usuário ou senha incorretos.",
          variant: "destructive",
        });
      } else {
        console.log('Login realizado com sucesso para:', profileData.name);
        toast({
          title: "Login realizado",
          description: `Bem-vindo, ${profileData.name}!`,
        });
      }
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-primary">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        {/* Header with back button */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-accent/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-secondary/20 mb-4">
            <User className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Acesso do Cliente</h1>
          <p className="text-muted-foreground text-sm">
            Acompanhe o progresso do seu projeto
          </p>
        </div>

        {/* Login Form */}
        <Card className="bg-card/95 backdrop-blur-sm border-border shadow-medium">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Entrar como Cliente</CardTitle>
            <CardDescription>
              Use as credenciais fornecidas pelo administrador
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu username (ex: joao_silva)"
                  className="bg-input/50 border-border/50 focus:border-ring"
                  {...register('username', {
                    required: 'Usuário é obrigatório',
                    pattern: {
                      value: /^[a-zA-Z0-9_-]+$/,
                      message: 'Usuário deve conter apenas letras, números, _ ou -'
                    }
                  })}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="bg-input/50 border-border/50 focus:border-ring pr-10"
                    {...register('password', {
                      required: 'Senha é obrigatória'
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Acessar Projeto'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Não possui acesso? Entre em contato com o administrador.</p>
            <p>Cada projeto possui credenciais específicas.</p>
          </div>
        </div>
      </div>
    </div>
  );
};