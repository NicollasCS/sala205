#!/bin/bash

# Sala 205 - Quick Install Script
# Execute: bash install.sh

echo "================================"
echo "  Sala 205 - Setup Automático"
echo "================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Verificar se Node.js está instalado
echo -e "${GREEN}✓${NC} Verificando Node.js..."
NODE_VERSION=$(node --version)
if [ $? -ne 0 ]; then
    echo -e "${RED}✗${NC} Node.js não encontrado!"
    echo -e "${YELLOW}Baixe em: https://nodejs.org/${NC}"
    exit 1
fi
echo -e "  Node.js $NODE_VERSION instalado ${GREEN}✓${NC}"

# Verificar se npm está instalado
echo -e "${GREEN}✓${NC} Verificando npm..."
NPM_VERSION=$(npm --version)
if [ $? -ne 0 ]; then
    echo -e "${RED}✗${NC} npm não encontrado!"
    exit 1
fi
echo -e "  npm $NPM_VERSION instalado ${GREEN}✓${NC}"

echo ""
echo "================================"
echo -e "  ${YELLOW}Instalando dependências...${NC}"
echo "================================"
echo ""

# Instalar dependências
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}✗${NC} Erro ao instalar dependências!"
    exit 1
fi

echo ""
echo "================================"
echo -e "  ${GREEN}✓ Instalação Concluída!${NC}"
echo "================================"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo -e "1. ${NC}Crie um arquivo .env na raiz do projeto"
echo -e "2. ${NC}Configure as credenciais do Supabase"
echo -e "3. ${NC}Execute: npm run dev"
echo ""
echo -e "${CYAN}Consulte SETUP.md para instruções detalhadas${NC}"
