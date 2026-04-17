# Guia de Deployment - Sala 205

## Estrutura de Arquivos para Produção

### Vercel (Serverless)
- **`/api/index.js`** - Handler principal exportado como `export default app`
- **`/api/[...slug].js`** - Catch-all Vercel para redirecionar `/api/*` ao mesmo handler
- **`/vercel.json`** - Configuração do Vercel para o projeto
- **`/public`** - Arquivos estáticos (HTML, CSS, JS)

### Desenvolvimento Local
- **`/src/server.js`** - Servidor Node.js tradicional com `app.listen(3000)`
- **Comando**: `npm start`

## Variáveis de Ambiente

Configurar no Vercel (Project Settings > Environment Variables):

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
SUPABASE_KEY=sua-chave-publica
PORT=3000 (opcional, Vercel usa apenas serverless)
```

## Deploy Automático

Todo push na branch `dev` dispara build automático no Vercel.

**URL de Produção**: `https://sala205.vercel.app`

## Troubleshooting

### Erro 500: FUNCTION_INVOCATION_FAILED
- ✅ Verificar se `/api/index.js` existe e tem `export default app`
- ✅ Verificar variáveis de ambiente no Vercel (SUPABASE_URL, SUPABASE_KEY)
- ✅ Ver logs: `vercel logs` ou Vercel Dashboard

### Sintaxe do JavaScript
```bash
# Testar localmente
node -c src/server.js
node -c api/index.js
```

### Testar Rotas Localmente
```bash
npm start
# Visitar: http://localhost:3000/api/logs
```

## Commits Recentes

1. **ccea4cb** - Corrigir erro de sintaxe (function delete não fechada)
2. **fc5ab80** - Estrutura serverless para Vercel
3. **6195a56** - Remover bad-words e implementar filtro simples
4. **e80f1e3** - Redeploy trigger

## Checklist Final

- [x] Sintaxe validada em ambos os arquivos
- [x] Servidor local funcionando (`npm start`)
- [x] Variáveis de ambiente configuradas
- [x] Arquivo `/api/index.js` com export default
- [x] `vercel.json` apontando para `api/index.js`
- [x] Commits pusheados para GitHub
- [x] Deploy automático acionado

O Vercel deve fazer rebuild em poucos minutos. Se ainda houver erro 500, verificar:
1. Logs do Vercel
2. Variáveis de ambiente
3. Conectividade com Supabase
