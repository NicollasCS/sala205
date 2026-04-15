# 🔴 ERRO 404 NO VERCEL - SOLUÇÃO RÁPIDA

## Você está vendo isto?
```
404: NOT_FOUND
Code: `NOT_FOUND`
```

## ✅ SOLUÇÃO (3 minutos):

### 1️⃣ Abra o `.env` local:

```bash
# No seu computador, abra o arquivo: .env
# Você vai ver algo como isto:

SUPABASE_URL=https://qdszkzvgtpejaknjjola.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**COPIE ESTES 3 VALORES!** (colinha com Ctrl+C)

---

### 2️⃣ Ir para Vercel (PASSO A PASSO):

1. Abra: https://vercel.com/dashboard
2. Clique no seu projeto **sala205**
3. Clique em **Settings** (botão no topo)
4. Clique em **Environment Variables** (menu esquerda)

---

### 3️⃣ Adicionar PRIMEIRA variável:

**Variável 1: SUPABASE_URL**

1. No campo "Name" (esquerda): Escreva `SUPABASE_URL`
2. No campo "Value" (direita): COLA de Ctrl+V o valor de SUPABASE_URL = https://xxx.supabase.co
3. Clique **"Save"**

---

**Variável 2: SUPABASE_KEY**

1. Clique em **"Add New"** (botão branco)
2. Name: `SUPABASE_KEY`
3. Value: COLA o valor (eyJ...)
4. Clique **"Save"**

---

**Variável 3: SUPABASE_SERVICE_ROLE_KEY**

1. Clique em **"Add New"**
2. Name: `SUPABASE_SERVICE_ROLE_KEY`
3. Value: COLA o valor (eyJ...)
4. Clique **"Save"**

---

### 4️⃣ Fazer REDEPLOY:

1. Clique em **Deployments** (no topo, perto de Settings)
2. Vê o deploy mais recente (topo da lista)
3. Clique nos **3 pontinhos (...)** ao lado
4. Clique em **Redeploy**
5. **Aguarde 2-3 minutos** até ficar verde ✅

---

### 5️⃣ TESTAR:

Quando terminar (fica verde), clique no link do seu projeto:

```
https://sala205-chi.vercel.app/admin
```

(Troca `sala205-chi` pelo seu nome real de projeto)

---

## ✨ Se funcionar:

- ✅ Vai abrir a página de login
- ✅ Login: `dev205-1 / dev205-1`
- ✅ Entra no admin

---

## 🐛 Se AINDA não funcionar:

1. Vercel → Seu projeto → **Deployments**
2. Clique no deploy (o mais recente)
3. Clique em **Function Logs** (canto direito)
4. **COPIE o erro que aparecer**
5. **Me manda o erro!**

Aí eu posso ver o que é!
