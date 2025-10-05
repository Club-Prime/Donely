#!/bin/bash

# Script para iniciar o servidor Donely
# Uso: ./start-server.sh

echo "🚀 Iniciando servidor Donely..."

# Navegar para o diretório do projeto
cd "$(dirname "$0")"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Verifique se está no diretório correto."
    exit 1
fi

# Tentar usar npm run dev primeiro
echo "📦 Tentando iniciar com npm run dev..."
if npm run dev 2>/dev/null; then
    echo "✅ Servidor iniciado com npm run dev"
else
    echo "⚠️ npm run dev falhou, tentando com npx vite..."
    
    # Se falhar, usar npx vite
    if npx vite --port 8080; then
        echo "✅ Servidor iniciado com npx vite"
    else
        echo "❌ Erro: Não foi possível iniciar o servidor"
        echo "💡 Tente executar manualmente:"
        echo "   cd /home/luanps/Donely/donely-main"
        echo "   npx vite --port 8080"
        exit 1
    fi
fi

echo "🌐 Servidor disponível em: http://localhost:8080/"
echo "📊 Admin: http://localhost:8080/admin/projects/manage"
echo "🛑 Para parar: Ctrl+C"