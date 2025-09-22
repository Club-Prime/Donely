import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, User } from 'lucide-react';
import { AdminLogin } from './AdminLogin';
import { ClientLogin } from './ClientLogin';

type LoginMode = 'select' | 'admin' | 'client';

export const LoginPage = () => {
  const [mode, setMode] = useState<LoginMode>('select');

  if (mode === 'admin') {
    return <AdminLogin onBack={() => setMode('select')} />;
  }

  if (mode === 'client') {
    return <ClientLogin onBack={() => setMode('select')} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-primary">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Brand */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Donely
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestão de Entregas Semanais
          </p>
        </div>

        {/* Login Selection */}
        <Card className="bg-card/95 backdrop-blur-sm border-border shadow-medium">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Acesso ao Sistema</CardTitle>
            <CardDescription>
              Selecione o tipo de acesso adequado
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-left justify-start space-x-4 hover:bg-accent/50 border-border/50"
              onClick={() => setMode('admin')}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium">Administrador</div>
                <div className="text-sm text-muted-foreground">
                  Gerenciar projetos e relatórios
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-left justify-start space-x-4 hover:bg-accent/50 border-border/50"
              onClick={() => setMode('client')}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/20">
                <User className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="text-left">
                <div className="font-medium">Cliente</div>
                <div className="text-sm text-muted-foreground">
                  Acompanhar projeto específico
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Plataforma para transparência e acompanhamento de projetos
          </p>
        </div>
      </div>
    </div>
  );
};