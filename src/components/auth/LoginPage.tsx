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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-500/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-yellow-600/5 rounded-full blur-lg animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-1/2 left-3/4 w-16 h-16 bg-yellow-400/5 rounded-full blur-md animate-ping" style={{ animationDuration: '4s' }}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyMTUsMCwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        
        {/* Animated data streams */}
        <div className="absolute top-1/4 right-1/6 w-px h-16 bg-gradient-to-b from-yellow-400/30 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/5 w-px h-12 bg-gradient-to-t from-yellow-500/30 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-2/3 right-1/3 w-px h-8 bg-gradient-to-b from-yellow-300/30 to-transparent animate-pulse" style={{ animationDelay: '2.5s' }}></div>
        
        {/* Circuit-like patterns */}
        <div className="absolute top-1/6 left-1/2 w-8 h-8 border border-yellow-400/20 rounded rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
        <div className="absolute bottom-1/6 right-1/2 w-6 h-6 border border-yellow-500/20 rounded rotate-12 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-gray-900/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800/20 via-transparent to-black/20"></div>
      </div>
      
      <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center justify-center w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-gray-700/50 to-gray-800/50 backdrop-blur-sm border border-gray-600 mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 animate-pulse"></div>
            <div className="relative z-10 flex items-center justify-center">
              {/* Custom D with check icon */}
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* D shape */}
                <path d="M12 8C12 6.89543 12.8954 6 14 6H24C29.5228 6 34 10.4772 34 16V32C34 37.5228 29.5228 42 24 42H14C12.8954 42 12 41.1046 12 40V8Z" 
                      stroke="url(#goldGradient)" strokeWidth="2" fill="none"/>
                <path d="M18 12C18 10.8954 18.8954 10 20 10H26C28.2091 10 30 11.7909 30 14V34C30 36.2091 28.2091 38 26 38H20C18.8954 38 18 37.1046 18 36V12Z" 
                      fill="url(#goldGradient)" fillOpacity="0.1"/>
                
                {/* Check mark in the middle */}
                <path d="M20 24L23 27L28 22" stroke="url(#goldGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                
                {/* Decorative lines */}
                <line x1="16" y1="14" x2="18" y2="14" stroke="url(#goldGradient)" strokeWidth="1" opacity="0.6"/>
                <line x1="16" y1="18" x2="18" y2="18" stroke="url(#goldGradient)" strokeWidth="1" opacity="0.6"/>
                <line x1="16" y1="30" x2="18" y2="30" stroke="url(#goldGradient)" strokeWidth="1" opacity="0.6"/>
                <line x1="16" y1="34" x2="18" y2="34" stroke="url(#goldGradient)" strokeWidth="1" opacity="0.6"/>
                
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37"/>
                    <stop offset="50%" stopColor="#FFD700"/>
                    <stop offset="100%" stopColor="#B8860B"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <h1 className="text-6xl font-bold tracking-tight text-white relative">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Donely
            </span>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"></div>
          </h1>
          <p className="text-gray-400 text-sm font-medium">
            Gestão de Entregas Semanais
          </p>
        </div>

        {/* Login Selection */}
        <Card className="bg-black/60 backdrop-blur-xl border-gray-700/50 shadow-2xl relative overflow-hidden">
          {/* Card inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-gray-500/5 to-yellow-500/5 rounded-lg"></div>
          
          <CardHeader className="text-center pb-4 relative z-10">
            <CardTitle className="text-xl text-white font-semibold">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-gray-300">
              Selecione o tipo de acesso adequado
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 relative z-10">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-left justify-start space-x-4 hover:bg-yellow-500/10 border-gray-600 hover:border-yellow-500/40 text-white transition-all duration-300 group relative overflow-hidden"
              onClick={() => setMode('admin')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700/50 group-hover:bg-yellow-500/20 transition-colors duration-300 relative z-10">
                <Shield className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-left relative z-10">
                <div className="font-medium text-white">Administrador</div>
                <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Gerenciar projetos e relatórios
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-left justify-start space-x-4 hover:bg-yellow-500/10 border-gray-600 hover:border-yellow-500/40 text-white transition-all duration-300 group relative overflow-hidden"
              onClick={() => setMode('client')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700/50 group-hover:bg-yellow-500/20 transition-colors duration-300 relative z-10">
                <User className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-left relative z-10">
                <div className="font-medium text-white">Cliente</div>
                <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Acompanhar projeto específico
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-300">
              Plataforma para transparência e acompanhamento de projetos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};