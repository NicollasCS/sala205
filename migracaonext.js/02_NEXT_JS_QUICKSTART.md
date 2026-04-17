# 🚀 Início Rápido: Migração Next.js

## 3 Passos para Começar

### 1️⃣ **Leia o Guia Completo**
👉 [`docs/NEXT_JS_MIGRATION.md`](docs/NEXT_JS_MIGRATION.md)

Este arquivo tem TUDO que você precisa:
- ✅ Por que migrar
- ✅ Estrutura nova
- ✅ Passo a passo
- ✅ Exemplos práticos
- ✅ Dependências
- ✅ Checklist

### 2️⃣ **Crie um Novo Projeto Next.js**

```bash
# Criar projeto novo
npx create-next-app@latest sala205-next --typescript

# Ou se preferir sem TypeScript:
# npx create-next-app@latest sala205-next
```

**Respostas sugeridas:**
```
✅ Use TypeScript? Yes
✅ Use ESLint? Yes
✅ Use Tailwind? No (use seu CSS atual)
✅ Use `src/` directory? Yes
✅ Use App Router? Yes ← IMPORTANTE!
✅ Use Turbopack? No (por enquanto)
✅ Customize import alias? No
```

### 3️⃣ **Siga o Passo a Passo**

O guia em `docs/NEXT_JS_MIGRATION.md` tem 5 seções principais:

```
1. Setup Inicial (30 min)
   ↓
2. Estrutura de Pastas (preparar)
   ↓
3. Migração Passo a Passo (2-3 horas)
   ├ PASSO 1: Mover Estilos
   ├ PASSO 2: Criar Componentes React
   ├ PASSO 3: Mover Routes Express → Next.js API Routes
   ├ PASSO 4: Atualizar Fetch Calls
   ├ PASSO 5: Migrar Páginas
   └ PASSO 6: Autenticação
   ↓
4. Dependências (já listadas)
   ↓
5. Variáveis de Ambiente
```

---

## ⏱️ Tempo Estimado

| Tarefa | Tempo |
|--------|-------|
| Setup novo projeto | 15 min |
| Copiar CSS | 20 min |
| Criar componentes | 2 horas |
| Migrar API routes | 1 hora |
| Testes + ajustes | 1 hora |
| **TOTAL** | **4-5 horas** |

---

## 📋 Checklist Rápido

- [ ] Li `docs/NEXT_JS_MIGRATION.md`
- [ ] Criei novo projeto Next.js
- [ ] Instalei dependências (`npm install`)
- [ ] Configurei `.env.local`
- [ ] Testei primeira página (já funciona por padrão)
- [ ] Movei CSS global
- [ ] Criei primeiro componente React
- [ ] Testei conexão com Supabase
- [ ] Deploy no Vercel

---

## 🎯 Estrutura Básica que Você Vai Criar

```
sala205-next/
├── app/
│   ├── layout.tsx              # Layout principal
│   ├── page.tsx                # Home (/)
│   ├── globals.css             # CSS global
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── cadastro/page.tsx
│   │   └── admin/page.tsx
│   └── api/
│       ├── comentarios/route.ts
│       ├── galeria/route.ts
│       ├── calendario/route.ts
│       ├── usuarios/route.ts
│       └── auth/
│           ├── login/route.ts
│           └── cadastro/route.ts
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── HeroSection.tsx
│   └── ...
├── lib/
│   ├── supabase.ts
│   └── helpers.ts
├── public/image/
└── .env.local
```

---

## 🔥 Exemplo Mínimo (5 minutos)

Este é o mínimo que você precisa para funcionar:

### 1. Arquivo: `app/page.tsx`
```typescript
export default function Home() {
  return <h1>Sala 205</h1>;
}
```

### 2. Arquivo: `lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 3. Arquivo: `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Rodar!
```bash
npm run dev
# Vai abrir em http://localhost:3000
```

**Pronto!** Agora você tem um Next.js rodando. Siga o guia para adicionar as features.

---

## ⚠️ Coisas Importantes

### ✅ **O que funciona igual**
- Fetch calls funcionam da mesma forma
- localStorage funciona (com `useEffect`)
- CSS funciona (adicione em `globals.css`)
- Autenticação funciona (mesma lógica)

### ❌ **O que muda**
- HTML direto → Componentes React
- Arquivos JS → Arquivos TSX
- CSS global num arquivo → `globals.css`
- API Express → API Routes Next.js
- Deploy: Vercel reconhece automaticamente

---

## 💡 Dicas

1. **Comece pequeno**: Faça uma página e uma API route primeiro
2. **Use TypeScript**: Ajuda a pegar erros cedo
3. **Teste localmente**: `npm run dev`
4. **Deploy fácil**: `git push` e Vercel faz o resto
5. **Documentação Next.js**: https://nextjs.org/docs

---

## 🆘 Se Travar

1. **Erro de import?** → Verifique paths em `tsconfig.json`
2. **Erro no Supabase?** → Verifique `.env.local`
3. **Página branca?** → Abra console (F12) e veja o erro
4. **API não responde?** → Teste com `curl http://localhost:3000/api/...`

---

## 🎓 Recursos Úteis

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase + Next.js**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **Vercel Deploy**: https://vercel.com/docs
- **TypeScript Guide**: https://www.typescriptlang.org/docs/

---

## 📞 Próximos Passos

1. ✅ **Agora**: Leia `docs/NEXT_JS_MIGRATION.md`
2. ✅ **Depois**: Crie novo projeto com `create-next-app`
3. ✅ **Então**: Siga o passo a passo
4. ✅ **Finalmente**: Deploy no Vercel

---

**Bora lá! Você consegue! 🚀**

Qualquer dúvida, volta em `docs/NEXT_JS_MIGRATION.md` - está tudo lá!
