# 🌍 Guia de NODE_ENV - Projeto Sala 205

## O que é NODE_ENV?

`NODE_ENV` é uma variável de ambiente que define em qual contexto seu aplicativo está rodando.

**Valores comuns:**
- `development` - Desenvolvimento local (servidor em modo de recarga rápida, logs detalhados)
- `production` - Produção (otimizado, menos logs, sem informações sensíveis)
- `test` - Testes (ambiente de testes)

---

## ✅ Como está Configurado Agora

Seu projeto agora tem:
1. ✅ **NODE_ENV no `.env`** - Carregado automaticamente
2. ✅ **Supabase conectado** - Database configurada
3. ✅ **Scripts prontos** - Para facilitar o início

---

## 🚀 Como Usar

### **Opção 1: Usar Script PowerShell (Recomendado para Windows)**
```powershell
.\run-dev.ps1
```

### **Opção 2: Executar npm normalmente**
```bash
npm run dev
```
*(NODE_ENV será carregado automaticamente do `.env`)*

### **Opção 3: Setar NODE_ENV manualmente no PowerShell**
```powershell
$env:NODE_ENV = "development"
npm run dev
```

### **Opção 4: Setar NODE_ENV manualmente no CMD**
```cmd
set NODE_ENV=development
npm run dev
```

---

## 📋 Variáveis de Ambiente Disponíveis

Verifique o arquivo `.env` para ver todas as configurações:

```env
# Ambiente
NODE_ENV=development

# Supabase (Database)
SUPABASE_URL=https://qdszkzvgtpejaknjjola.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_KEY=...

# Servidor
PORT=6767
```

---

## 🔍 Como Verificar se Está Funcionando

### **1. Verificar se NODE_ENV está definido:**
```powershell
$env:NODE_ENV
```
Deve retornar: `development`

### **2. Verificar se .env está sendo carregado:**
```bash
npm run dev
```
Você deve ver:
```
Servidor rodando em http://localhost:6767
Conectado ao Supabase: https://qdszkzvgtpejaknjjola.supabase.co
```

### **3. Acessar o servidor:**
Abra o navegador em: **http://localhost:6767**

---

## 🚨 Se Algo não Funcionar

### **Problema: "Supabase não configurado"**
**Solução:** Verificar se as variáveis estão no `.env`:
```bash
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
```

### **Problema: Porta 6767 em uso**
**Solução:** Mudar a porta no `.env`:
```env
PORT=3000
```

### **Problema: NODE_ENV não definido**
**Solução:** Adicionar ao `.env`:
```env
NODE_ENV=development
```

---

## 📚 Referência Rápida

| Comando | O que faz |
|---------|----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento |
| `npm start` | Inicia servidor |
| `npm run reset-db` | Reseta banco de dados |
| `.\run-dev.ps1` | Inicia com NODE_ENV definido (Windows) |

---

## ✨ Resumo

**Seu projeto está configurado e funcionando!** 🎉

- ✅ NODE_ENV = `development`
- ✅ Supabase conectado
- ✅ Servidor rodando em porta 6767
- ✅ Todas as variáveis de ambiente carregadas

**Para iniciar o servidor:**
```bash
npm run dev
```

---

*Última atualização: 16/04/2026*
