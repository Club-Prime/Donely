import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search, Bug, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("🚫 404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-6 w-28 h-28 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
            <Bug className="w-14 h-14 text-red-600" />
          </div>
          <CardTitle className="text-5xl font-bold text-gray-800 mb-2">404</CardTitle>
          <CardDescription className="text-xl text-gray-600">
            Oops! Página não encontrada
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-8">
          <div className="space-y-4">
            <p className="text-gray-700 text-lg">
              A página <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600">
                {location.pathname}
              </code> não existe ou foi movida.
            </p>
            <p className="text-gray-600">
              Não se preocupe, isso acontece! Vamos te ajudar a voltar ao caminho certo.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              asChild 
              className="bg-blue-600 hover:bg-blue-700 transition-colors"
              size="lg"
            >
              <Link to="/">
                <Home className="w-5 h-5 mr-2" />
                Ir para o início
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              size="lg"
              className="border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Página anterior
            </Button>
          </div>
          
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              onClick={handleRefresh}
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar recarregar
            </Button>
          </div>
          
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              💡 <strong>Dicas úteis:</strong>
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Search className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                <span>Verifique se o URL está correto</span>
              </div>
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                <span>Use o menu de navegação</span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            <p>🆘 Se o problema persistir, entre em contato com o suporte</p>
            <p className="mt-1">Donely - Gestão de Projetos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
