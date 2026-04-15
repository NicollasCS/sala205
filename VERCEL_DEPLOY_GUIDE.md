# 🚀 Guia de Deploy no Vercel

## ⚠️ Por que o site não abre?

Se o site não carrega no Vercel, pode ser:

1. **Variáveis de ambiente não configuradas**
2. **Erro no servidor Node.js**
3. **Logs não sendo exibidos**

## ✅ Checklist de Configuração

### 1️⃣ Adicionar Variáveis de Ambiente no Vercel

No [Vercel Dashboard](https://vercel.com/dashboard):

1. Seu projeto → **Settings** → **Environment Variables**
2. Adicione estas variáveis (copie do seu `.env` local):

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_KEY = eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY = eyJxxxxx...
NODE_ENV = production
```

3. **IMPORTANTE**: Clique em **Redeploy** após adicionar!

### 2️⃣ Redeployar

1. Vá em **Deployments**
2. Clique no último deploy (ou no ⋮ → Redeploy)
3. Espere terminar

### 3️⃣ Ver Logs

Se ainda não funcionar:

1. Vá em **Logs** ou **Function Logs**
2. Procure por erros
3. Copie a mensagem exata do erro

## 🔧 Arquivos Importantes

- `vercel.json` - Configuração de build e routing ✅
- `src/server.js` - Porta agora suporta variável `PORT` ✅
- `.vercelignore` - O que ignorar no deploy ✅

## 🐛 Problemas Comuns

**Erro: "Cannot find module"**
- Certifique-se que fez `npm install` antes de fazer push

**Erro: "Supabase URL not found"**
- Variáveis de ambiente não estão configuradas
- Vá em Settings → Environment Variables e adicione

**Site carrega mas mostra 404**
- É normal - o site deve servir arquivo index.html
- Tente acessar `/admin` ou `/index.html`

## 📝 Teste Local Antes de Deploy

```bash
npm run start
# Abra http://localhost:3000
```

Se funcionar localmente, geralmente funciona no Vercel também.

## 💡 Debug no Vercel

Para ver mais detalhes:

1. Instale Vercel CLI: `npm i -g vercel`
2. Execute localmente: `vercel dev`
3. Isso simula o ambiente Vercel
4. Veja os logs em tempo real

## ✨ Tudo Funcionando?

Se o site abrir em http://seu-projeto.vercel.app:
- ✅ Vá para http://seu-projeto.vercel.app/admin
- ✅ Logo com dev205-1 / dev205-1
- ✅ Teste upload de vídeo (vai pro Supabase Storage)
