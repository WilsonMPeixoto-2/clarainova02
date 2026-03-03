#!/bin/bash

# Vercel Deployment Readiness Checker
# Este script verifica se o projeto está pronto para deploy na Vercel

echo "🔍 Verificando prontidão para deploy na Vercel..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2"
        ((ERRORS++))
        return 1
    fi
}

# Function to check content in file
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        return 0
    else
        echo -e "${RED}✗${NC} $3"
        ((ERRORS++))
        return 1
    fi
}

# Function to warn
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "📦 Verificando arquivos essenciais..."
check_file "package.json" "package.json existe"
check_file "vercel.json" "vercel.json existe"
check_file ".env.example" ".env.example existe"
check_file ".gitignore" ".gitignore existe"
check_file "vite.config.ts" "vite.config.ts existe"
echo ""

echo "🔧 Verificando configuração do Vercel..."
check_content "vercel.json" "rewrites" "vercel.json tem configuração de rewrites para SPA"
check_content "vercel.json" "index.html" "vercel.json redireciona para index.html"
echo ""

echo "🔐 Verificando variáveis de ambiente..."
check_content ".env.example" "VITE_SUPABASE_URL" ".env.example contém VITE_SUPABASE_URL"
check_content ".env.example" "VITE_SUPABASE_PUBLISHABLE_KEY" ".env.example contém VITE_SUPABASE_PUBLISHABLE_KEY"
check_content ".env.example" "VITE_SUPABASE_PROJECT_ID" ".env.example contém VITE_SUPABASE_PROJECT_ID"
echo ""

echo "🛡️ Verificando segurança..."
check_content ".gitignore" ".env" ".env está no .gitignore"
check_content ".gitignore" "dist" "dist está no .gitignore"
check_content ".gitignore" "node_modules" "node_modules está no .gitignore"

if [ -f ".env" ]; then
    warn ".env existe localmente (não faça commit deste arquivo)"
fi
echo ""

echo "📝 Verificando scripts de build..."
if grep -q '"build".*"vite build"' "package.json"; then
    echo -e "${GREEN}✓${NC} Script de build configurado"
else
    echo -e "${RED}✗${NC} Script de build não encontrado"
    ((ERRORS++))
fi

if grep -q '"preview".*"vite preview"' "package.json"; then
    echo -e "${GREEN}✓${NC} Script de preview configurado"
else
    warn "Script de preview não encontrado (opcional)"
fi
echo ""

echo "📚 Verificando documentação..."
check_file "README.md" "README.md existe"
check_file "docs/DEPLOYMENT.md" "Guia de deployment existe"
check_content "README.md" "Vercel" "README menciona Vercel"
echo ""

echo "🔍 Verificando estrutura do projeto..."
check_file "src/main.tsx" "src/main.tsx existe (entry point)"
check_file "index.html" "index.html existe"
check_file "public/favicon.ico" "favicon.ico existe"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ PRONTO PARA DEPLOY!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Configure as variáveis de ambiente na Vercel"
    echo "2. Execute: npm install -g vercel"
    echo "3. Execute: vercel --prod"
    echo ""
    echo "Ou importe via GitHub em: https://vercel.com/new"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}✓ Pronto com $WARNINGS avisos${NC}"
    echo ""
    echo "O projeto está pronto, mas verifique os avisos acima."
    exit 0
else
    echo -e "${RED}✗ Encontrados $ERRORS erros e $WARNINGS avisos${NC}"
    echo ""
    echo "Corrija os erros acima antes de fazer o deploy."
    exit 1
fi
