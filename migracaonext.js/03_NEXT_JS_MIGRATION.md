# 🚀 Guia de Migração: Express → Next.js

## 📊 Análise do Projeto Atual

Seu projeto é um **fullstack Express + Vanilla JS** com:
- **Backend**: Express.js + Supabase (autenticação, calendário, galeria, comentários)
- **Frontend**: Vanilla JS + HTML/CSS
- **Deploy**: Vercel (serverless)
- **DB**: Supabase (PostgreSQL)

## ✅ Por Que Migrar para Next.js?

| Aspecto | Express | Next.js |
|--------|---------|---------|
| **Performance** | Rápido | Mais rápido (SSR/SSG) |
| **Bundle Size** | Mais JS no cliente | Menos JS (otimizado) |
| **Desenvolvimento** | Separado (backend/frontend) | Unificado |
| **Deploy** | Precisa servidor | Vercel nativo (serverless) |
| **SEO** | Ruim | Excelente (SSR) |
| **DX** | Bom | Excelente |

## 🎯 O Que Precisa Ser Feito

### 1️⃣ **Setup Inicial** (30 min)
```bash
# Criar novo projeto Next.js
npx create-next-app@latest sala205-next --typescript

# Instalar dependências
npm install @supabase/supabase-js crypto-js
```

### 2️⃣ **Estrutura de Pastas** (Nova)
```
sala205-next/
├── app/
│   ├── layout.tsx              # Layout principal
│   ├── page.tsx                # Home (/) - substitui index.html
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx        # /login
│   │   ├── cadastro/
│   │   │   └── page.tsx        # /cadastro
│   │   └── admin/
│   │       └── page.tsx        # /admin
│   ├── api/
│   │   ├── comentarios/
│   │   │   ├── route.ts        # GET/POST /api/comentarios
│   │   │   └── [id]/route.ts   # DELETE /api/comentarios/[id]
│   │   ├── galeria/
│   │   │   └── route.ts
│   │   ├── calendario/
│   │   │   └── route.ts
│   │   ├── usuarios/
│   │   │   └── route.ts
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── cadastro/route.ts
│   │   └── descricao-turma/
│   │       └── route.ts
│   └── globals.css             # CSS global (substitui index.css)
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── HeroSection.tsx
│   ├── CommentsSidebar.tsx
│   └── ...
├── lib/
│   ├── supabase.ts             # Cliente Supabase
│   └── helpers.ts
├── public/
│   └── image/                  # Imagens (mesmo lugar)
└── .env.local                  # Variáveis de ambiente
```

### 3️⃣ **Migração Passo a Passo**

#### **PASSO 1: Mover Estilos**
```
public/index.css → app/globals.css
public/auth/login/login.css → components/Login.module.css
public/auth/cadastro/cadastro.css → components/Cadastro.module.css
public/auth/admin/admin.css → components/Admin.module.css
```

#### **PASSO 2: Criar Componentes React**
Em vez de HTML/JS direto, criar componentes:

```typescript
// components/Navbar.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  
  return (
    <nav className="navbar">
      {/* ... navbar content ... */}
    </nav>
  );
}
```

#### **PASSO 3: Mover Express Routes → API Routes Next.js**

**Antes (Express):**
```javascript
app.get('/api/comentarios', async (req, res) => {
  const { data } = await supabase.from('comentarios').select('*');
  res.json(data);
});
```

**Depois (Next.js):**
```typescript
// app/api/comentarios/route.ts
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { data } = await supabase.from('comentarios').select('*');
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { data } = await supabase.from('comentarios').insert([body]);
  return NextResponse.json(data, { status: 201 });
}
```

#### **PASSO 4: Atualizar Fetch Calls**
Não precisa mudar nada, mas pode melhorar:

```typescript
// Antes
const res = await fetch('/api/comentarios');

// Depois (mesmo funciona, mas pode usar Server Components)
const comentarios = await obterComentarios(); // No servidor!
```

#### **PASSO 5: Migrar Páginas**

**index.html → app/page.tsx:**
```typescript
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      {/* ... outras seções ... */}
      <Footer />
    </>
  );
}
```

#### **PASSO 6: Autenticação**
```typescript
// lib/auth.ts
export async function login(usuario: string, senha: string) {
  const hash = md5(senha); // crypto-js
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, senha: hash })
  });
  const { token } = await response.json();
  localStorage.setItem('token', token);
}
```

### 4️⃣ **Dependências Necessárias**

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.37.0",
    "crypto-js": "^4.1.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0"
  }
}
```

### 5️⃣ **Variáveis de Ambiente**

**`.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://qdszkzvgtpejaknjjola.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ Só `NEXT_PUBLIC_` fica acessível no cliente!

## 🔄 Tempo Estimado

| Tarefa | Tempo |
|--------|-------|
| Setup + estrutura | 30 min |
| Componentes + CSS | 2-3 horas |
| API Routes | 1-2 horas |
| Testes + ajustes | 1 hora |
| **Total** | **4-6 horas** |

## ⚠️ Coisas Importantes

### ✅ **O que é mais fácil no Next.js**
- Layout compartilhado automático
- Otimização de imagens
- Roteamento intuitivo
- Melhor performance
- Melhor DX

### ❌ **Possíveis Problemas**
1. **localStorage**: Usar `useEffect` ou bibliotecas como `next-auth`
2. **Fetch no servidor**: Usar Server Components (mais rápido!)
3. **Cookies**: Next.js facilita (middleware + nativo)
4. **Revalidação**: Implementar ISR (Incremental Static Regeneration)

## 🛠️ Exemplo Completo: Página de Login

### Com Express (Atual):
```html
<!-- public/auth/login/login.html -->
<input id="nome" type="text">
<input id="senha" type="password">
<button onclick="handleLogin()">Entrar</button>

<script src="login.js"></script>
<!-- login.js com lógica -->
```

### Com Next.js (Novo):
```typescript
// app/(auth)/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import md5 from 'crypto-js/md5';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario,
        senha: md5(senha).toString()
      })
    });
    
    if (response.ok) {
      const { token } = await response.json();
      localStorage.setItem('token', token);
      router.push('/');
    }
  }

  return (
    <form onSubmit={handleLogin} className="login-form">
      <input
        type="text"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
        placeholder="Usuário"
      />
      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha"
      />
      <button type="submit">Entrar</button>
    </form>
  );
}
```

### E a API Route correspondente:
```typescript
// app/api/auth/login/route.ts
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import md5 from 'crypto-js/md5';

export async function POST(request: Request) {
  const { usuario, senha } = await request.json();

  // Validar credenciais
  const { data: user } = await supabase
    .from('usuarios')
    .select('*')
    .eq('nome', usuario)
    .eq('senha', senha)
    .single();

  if (!user) {
    return NextResponse.json(
      { error: 'Credenciais inválidas' },
      { status: 401 }
    );
  }

  // Gerar JWT (você já tem essa lógica)
  const token = generateJWT(user);
  
  return NextResponse.json({ token });
}
```

## 📋 Checklist de Migração

- [ ] Criar projeto Next.js
- [ ] Configurar Supabase
- [ ] Mover componentes CSS
- [ ] Criar componentes React
- [ ] Converter páginas HTML → TSX
- [ ] Mover Express routes → API routes
- [ ] Testar autenticação
- [ ] Testar comentários, galeria, calendário
- [ ] Otimizar imagens
- [ ] Configurar `.env.local`
- [ ] Deploy no Vercel

## 🚀 Próximos Passos

**Quer que eu:**
1. ✅ **Crie o novo projeto Next.js** com estrutura pronta?
2. ✅ **Converta os componentes principais**?
3. ✅ **Faça a migração das API routes**?
4. ✅ **Configure autenticação**?

---

**Dica**: Você pode fazer isso **gradualmente** - deixar Express rodando enquanto migra componentes para Next.js!
