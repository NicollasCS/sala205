# Sala 205 - Quick Install Script
# Execute este script para instalar todas as dependências

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Sala 205 - Setup Automático" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Node.js está instalado
Write-Host "✓ Verificando Node.js..." -ForegroundColor Green
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "Baixe em: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Node.js $nodeVersion instalado ✓" -ForegroundColor Green

# Verificar se npm está instalado
Write-Host "✓ Verificando npm..." -ForegroundColor Green
$npmVersion = npm --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ npm não encontrado!" -ForegroundColor Red
    exit 1
}
Write-Host "  npm $npmVersion instalado ✓" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Instalando dependências..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Instalar dependências
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  ✓ Instalação Concluída!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Crie um arquivo .env na raiz do projeto" -ForegroundColor White
Write-Host "2. Configure as credenciais do Supabase" -ForegroundColor White
Write-Host "3. Execute: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Consulte SETUP.md para instruções detalhadas" -ForegroundColor Cyan
