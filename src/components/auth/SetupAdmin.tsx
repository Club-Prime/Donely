import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SetupAdminProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const SetupAdmin = ({ onComplete, onCancel }: SetupAdminProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@donely.com');
  const [password, setPassword] = useState('admin123');
  const [confirmPassword, setConfirmPassword] = useState('admin123');
  const { toast } = useToast();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro", 
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Tentar criar o usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.user) {
        // Criar ou atualizar o perfil admin
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: authData.user.id,
            name: 'Administrador',
            email: email,
            username: 'admin',
            role: 'ADMIN',
            is_active: true
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          // Não vamos falhar se o perfil não for criado, o usuário pode ser criado depois
        }

        toast({
          title: "Sucesso",
          description: "Usuário administrador criado com sucesso!",
        });

        onComplete();
      }
    } catch (error) {
      console.error('Erro no setup:', error);
      toast({
        title: "Erro",
        description: `Falha ao criar administrador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-primary">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 mb-4">
            <KeyRound className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold">Configuração Inicial</h1>
          <p className="text-muted-foreground text-sm">
            Configure o primeiro usuário administrador
          </p>
        </div>

        <Card className="bg-card/95 backdrop-blur-sm border-border shadow-medium">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Setup Admin
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Crie o primeiro usuário administrador do sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setup-email" className="text-foreground">Email do Administrador</Label>
                <Input
                  id="setup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@donely.com"
                  className="bg-input/50 border-border/50 focus:border-ring"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-password" className="text-foreground">Senha</Label>
                <Input
                  id="setup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-input/50 border-border/50 focus:border-ring"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-confirm" className="text-foreground">Confirmar Senha</Label>
                <Input
                  id="setup-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-input/50 border-border/50 focus:border-ring"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Configurando...' : 'Criar Admin'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            ⚠️ Esta opção deve ser usada apenas na configuração inicial
          </p>
        </div>
      </div>
    </div>
  );
};