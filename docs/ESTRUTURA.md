# 📂 ESTRUTURA COMPLETA DO PROJETO

```
sala205/
├── 📄 package.json               ← npm scripts (start, dev, etc)
├── 📄 vercel.json                ← Deploy Vercel
├── 📄 .env                        ← Variáveis de ambiente
├── 📄 .gitignore
│
├── 📋 DOCUMENTAÇÃO
│   ├── 📖 README.md              ← Guia principal
│   ├── 📖 REFATORACAO_GUIA.md    ← 🆕 Como usar novo servidor
│   ├── 📖 ARQUITETURA.md         ← 🆕 Visualização da estrutura
│   ├── 📖 DEPLOYMENT_GUIDE.md    ← Deploy no Vercel
│   ├── 📖 SETUP_DATABASE.md      ← Setup Supabase
│   ├── 📖 NODE_ENV_GUIDE.md      ← Variáveis de ambiente
│   └── 📖 ESTRUTURA.md           ← Este arquivo
│
├── 📊 BANCO DE DADOS (SQL)
│   ├── 📄 SUPABASE_SETUP_SIMPLES.sql    ← ⭐ Use este para novo setup
│   ├── 📄 SUPABASE_SETUP.sql            ← Setup completo (referência)
│   ├── 📄 SUPABASE_ADD_COLUMNS.sql      ← Adicionar colunas faltantes
│   └── 📄 SUPABASE_INSERT_DATA.sql      ← Inserir dados iniciais
│
├── 📁 api/                       ← VERCEL (Produção)
│   ├── 📄 index.js               ← Handler principal
│   ├── 📄 [...slug].js           ← Catch-all para /api/*
│   └── 📄 health.js              ← Health check
│
├── 📁 public/                    ← FRONTEND ESTÁTICO
│   ├── 📄 index.html             ← Página principal
│   ├── 📄 index.js               ← JavaScript do cliente
│   ├── 📄 index.css              ← Estilos
│   │
│   ├── 📁 auth/
│   │   ├── 📁 admin/
│   │   │   ├── admin.html
│   │   │   ├── admin.js
│   │   │   └── admin.css
│   │   │
│   │   ├── 📁 aluno205-1/
│   │   │   ├── calendario.html
│   │   │   └── calendario.js
│   │   │
│   │   ├── 📁 cadastro/
│   │   │   ├── cadastro.html
│   │   │   └── cadastro.js
│   │   │
│   │   └── 📁 login/
│   │       ├── login.html
│   │       └── login.js
│   │
│   └── 📁 image/
│       └── icon.png
│
├── 📁 src/                       ← BACKEND (Node.js)
│   │
│   ├── 📄 server.js              ← Antigo (mantém compatibilidade)
│   ├── 📄 server-novo.js         ← 🆕 NOVO - Use este!
│   │
│   ├── 📁 config/
│   │   └── 📄 constants.js       ← Constantes (PORT, TOKENS, etc)
│   │
│   ├── 📁 middleware/
│   │   └── 📄 auth.js            ← Autenticação e autorização
│   │
│   ├── 📁 utils/
│   │   ├── 📄 supabase.js        ← Inicialização Supabase
│   │   └── 📄 helpers.js         ← Funções auxiliares
│   │
│   ├── 📁 controllers/           ← LÓGICA DE NEGÓCIO
│   │   ├── 📄 authController.js         ← Login/Cadastro
│   │   ├── 📄 usuariosController.js     ← Gerenciar usuários
│   │   ├── 📄 calendarioController.js   ← Gerenciar eventos
│   │   ├── 📄 galeriaController.js      ← Gerenciar mídia
│   │   ├── 📄 comentariosController.js  ← Gerenciar comentários
│   │   └── 📄 adminController.js        ← Admin e sistema
│   │
│   ├── 📁 routes/                ← DEFINIÇÃO DE ROTAS
│   │   ├── 📄 index.js           ← Router principal (agregador)
│   │   ├── 📄 authRoutes.js      ← POST /api/auth
│   │   ├── 📄 usuariosRoutes.js  ← /api/usuarios
│   │   ├── 📄 calendarioRoutes.js ← /api/calendario
│   │   ├── 📄 galeriaRoutes.js   ← /api/galeria
│   │   ├── 📄 comentariosRoutes.js ← /api/comentarios
│   │   ├── 📄 adminRoutes.js     ← /api/admin
│   │   └── 📄 healthRoutes.js    ← /api/health
│   │
│   ├── 📄 setup_database.js      ← Setup Supabase (script)
│   ├── 📄 setup_admin.js         ← Criar admin (script)
│   └── 📄 migrate_to_supabase.js ← Migração (script)
│
├── 📁 node_modules/             ← Dependências npm (não commitar)
│
└── run-dev.ps1                   ← Script para rodar dev
```

## 📖 DESCRIÇÃO DAS PASTAS

### `api/` - Vercel Serverless
Funções que rodam no Vercel. Quando faz deploy, o Vercel executa:
- `api/index.js` → Handler Express
- `api/[...slug].js` → Captura rotas dinâmicas

### `public/` - Frontend
Arquivos estáticos servidos ao navegador:
- `index.html` - Página principal
- `auth/` - Páginas de login/cadastro
- `image/` - Imagens e ícones

### `src/` - Backend (Node.js)
Código do servidor:
- `config/` - Constantes e configuração
- `middleware/` - Middleware Express
- `utils/` - Funções auxiliares
- `controllers/` - Lógica de negócio
- `routes/` - Rotas REST

## 🔄 COMO OS ARQUIVOS SE CONECTAM

```
package.json
└─ "start": "node src/server-novo.js"

src/server-novo.js
├─ Importa express
├─ Importa middleware/auth.js
├─ Importa routes/index.js
└─ Listener: localhost:6767

routes/index.js
├─ Importa routes/authRoutes.js
├─ Importa routes/usuariosRoutes.js
├─ Importa routes/calendarioRoutes.js
├─ Importa routes/galeriaRoutes.js
├─ Importa routes/comentariosRoutes.js
├─ Importa routes/adminRoutes.js
└─ router.use(path, routes)

routes/usuariosRoutes.js
├─ Importa controllers/usuariosController.js
├─ Importa middleware/auth.js
└─ router.get('/', requireAdmin, usuariosController.listUsers)

controllers/usuariosController.js
├─ Importa utils/supabase.js
├─ Importa utils/helpers.js
├─ export listUsers(req, res) { ... }
└─ Chamadas: supabase.from().select()

utils/supabase.js
└─ Inicializa: createClient(SUPABASE_URL, SUPABASE_KEY)

utils/helpers.js
├─ normalizeUser(user)
├─ createLog(categoria, subcategoria)
├─ getAppSetting(key)
└─ Mais funções...

config/constants.js
├─ PORT = 6767
├─ ADMIN_TOKEN = 'turma205-admin'
├─ PROTECTED_ACCOUNTS = ['administrador_turma205-1', ...]
└─ Mais constantes...
```

## 📊 FLUXO DE EXECUÇÃO

```
npm start
  ↓
Executa: node src/server-novo.js
  ↓
src/server-novo.js inicia
  ├─ Importa todas as dependências
  ├─ Cria app Express
  ├─ Configura middleware global
  ├─ Importa src/routes/index.js
  │   ├─ Importa authRoutes.js
  │   ├─ Importa usuariosRoutes.js
  │   └─ (todos os routes)
  ├─ Listener em :6767
  └─ console.log('Servidor rodando em ...')

Cliente faz requisição GET /api/usuarios
  ↓
Express middleware global processa
  ├─ CORS ✅
  ├─ JSON Parse ✅
  └─ Static Files ✅
  ↓
Router index.js roteia → usuariosRoutes.js
  ↓
Usuario Routes verifica autenticação
  ├─ requireAdmin middleware
  └─ Checa header x-admin-token
  ↓
Controller usuariosController.listUsers
  ├─ Chama supabase.from('usuarios').select()
  ├─ Chama helpers.normalizeUser()
  ├─ Chama helpers.createLog()
  └─ res.json(usuarios)
  ↓
Response 200 OK com JSON retorna ao cliente
```

## 🎯 HIERARQUIA DE RESPONSABILIDADES

```
server-novo.js (Setup)
  └─ routes/index.js (Agregação)
      ├─ routes/usuariosRoutes.js
      │   ├─ middleware/auth.js (Validação)
      │   └─ controllers/usuariosController.js (Lógica)
      │       ├─ utils/supabase.js (BD)
      │       ├─ utils/helpers.js (Helpers)
      │       └─ config/constants.js (Constantes)
      │
      ├─ routes/calendarioRoutes.js
      │   └─ controllers/calendarioController.js
      │
      └─ (outros routes...)
```

## 📝 DICAS DE NAVEGAÇÃO

1. **Quer entender estrutura?** → Leia `ARQUITETURA.md`
2. **Quer usar o servidor?** → Leia `REFATORACAO_GUIA.md`
3. **Quer adicionar rota?** → Veja exemplo em `src/routes/`
4. **Quer adicionar controller?** → Veja exemplo em `src/controllers/`
5. **Quer descobrir uma função?** → Procure em `src/utils/helpers.js`
6. **Quer mudar constante?** → Vá em `src/config/constants.js`

## 🚀 INÍCIO RÁPIDO

```bash
# 1. Instalar dependências (se não instalado)
npm install

# 2. Criar .env com Supabase keys
cp .env.example .env
# Editar .env com suas chaves

# 3. Iniciar servidor
npm start
# Acessa http://localhost:6767

# 4. Testar API
curl -H "x-admin-token: turma205-admin" \
     http://localhost:6767/api/usuarios
```

## 📌 ARQUIVOS IMPORTANTES PARA GUARDAR

- `.env` - Segredo! Nunca commitar
- `src/server-novo.js` - Entrada principal
- `src/routes/index.js` - Agregador de rotas
- `package.json` - Scripts e dependências
- `REFATORACAO_GUIA.md` - Como usar
- `ARQUITETURA.md` - Como funciona
