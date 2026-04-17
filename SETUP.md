# 🚀 Setup - Sala 205 Comunidade

Guia completo para instalar e configurar o projeto Sala 205 em um novo PC.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (v20 ou superior) - [Download](https://nodejs.org/)
- **npm** (vem com Node.js) ou **yarn**
- **Git** (opcional, para clonar o repositório) - [Download](https://git-scm.com/)

### Verificar instalação

```powershell
# Verificar Node.js
node --version

# Verificar npm
npm --version
```

---

## 🔧 Instalação Rápida

### 1️⃣ Clonar o repositório

```powershell
git clone https://github.com/NicollasCS/sala205.git
cd sala205
```

### 2️⃣ Instalar dependências

```powershell
npm install
```

**Dependências principais que serão instaladas:**

- **@supabase/supabase-js** - Cliente Supabase
- **express** - Framework web
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Variáveis de ambiente
- **multer** - Upload de arquivos
- **busboy** - Parser de formulários
- **cookie-parser** - Parse de cookies

---

## ⚙️ Configuração do Ambiente

### 1️⃣ Criar arquivo `.env`

Na raiz do projeto (`sala205/`), crie um arquivo `.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-privada

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 2️⃣ Obter credenciais Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings** → **API**
4. Copie a URL e as chaves

---

## 🗄️ Configuração do Banco de Dados

### 1️⃣ Criar estrutura da BD

Se for a primeira vez, execute os scripts SQL:

```bash
# Execute os scripts no Supabase SQL Editor
# Arquivo: sql/SUPABASE_SETUP.sql
```

### 2️⃣ Inserir dados iniciais (opcional)

```bash
# Arquivo: sql/SUPABASE_INSERT_DATA.sql
```

---

## ▶️ Rodando o Projeto

### Desenvolvimento

```powershell
npm run dev
```

A aplicação estará disponível em: `http://localhost:3000`

### Produção

```powershell
npm start
```

---

## 📁 Estrutura do Projeto

```
sala205/
├── public/                 # Arquivos estáticos (HTML, CSS, JS)
│   ├── index.html         # Página principal
│   ├── index.js           # JavaScript principal
│   ├── index.css          # Estilos principais
│   ├── auth/              # Autenticação
│   │   ├── login/
│   │   ├── cadastro/
│   │   └── admin/
│   └── image/             # Imagens
├── src/                    # Código backend (Node.js)
│   ├── server.js          # Servidor principal
│   ├── controllers/        # Lógica de negócio
│   ├── routes/            # Endpoints de API
│   ├── middleware/        # Middlewares
│   ├── utils/             # Funções utilitárias
│   └── config/            # Configurações
├── sql/                    # Scripts de banco de dados
├── docs/                   # Documentação
├── package.json           # Dependências do projeto
├── .env                   # Variáveis de ambiente (não versionar)
└── README.md              # Este arquivo
```

---

## 🔐 Credenciais Padrão

Ao iniciar, use estas credenciais para acessar:

| Usuário | Senha | Tipo |
|---------|-------|------|
| `administrador_turma205-1` | `administrador_turma205-1` | Admin |
| `dev205-1` | `dev205-1` | Dev |
| `aluno205-1` | `aluno205-1` | Aluno |

---

## 📦 Instalação Manual de Dependências

Se preferir instalar apenas algumas dependências:

```powershell
# Framework web
npm install express

# Cliente Supabase
npm install @supabase/supabase-js

# CORS (Cross-Origin Resource Sharing)
npm install cors

# Variáveis de ambiente
npm install dotenv

# Upload de arquivos
npm install multer

# Parser de formulários
npm install busboy

# Parser de cookies (novo para segurança)
npm install cookie-parser
```

---

## 🛠️ Troubleshooting

### Erro: "SUPABASE_URL não configurado"

✅ Solução: Verifique se o arquivo `.env` está na raiz do projeto com as credenciais corretas.

### Erro: "Port 3000 já está em uso"

✅ Solução: Mude a porta no `.env`:
```
PORT=3001
```

### Erro: "Não consegue conectar ao Supabase"

✅ Solução: Verifique a URL e chaves no `.env`. Elas devem estar corretas.

### Erro: npm install falha

✅ Solução: Limpe o cache do npm:
```powershell
npm cache clean --force
npm install
```

---

## 📡 API Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/cadastro` - Cadastro de novo usuário
- `POST /api/auth/admin/login` - Login de admin (com cookie)
- `GET /api/auth/admin/verify` - Verificar sessão
- `POST /api/auth/admin/logout` - Logout

### Conteúdo
- `GET /api/comentarios` - Listar comentários
- `POST /api/comentarios` - Criar comentário
- `GET /api/galeria` - Listar galeria
- `POST /api/galeria` - Adicionar imagem
- `GET /api/calendario` - Listar eventos
- `POST /api/calendario` - Criar evento

---

## 🔒 Segurança

### Checklist de Segurança

- ✅ Arquivo `.env` adicionado ao `.gitignore`
- ✅ Cookies HttpOnly habilitados para admin
- ✅ CORS configurado
- ✅ Validação de entrada em todas as rotas
- ✅ Middleware de autenticação

### Proteger `.env`

Certifique-se que o arquivo `.env` **NUNCA** seja commitado:

```bash
# .gitignore deve conter:
.env
.env.local
.env.*.local
```

---

## 📝 Variáveis de Ambiente Detalhadas

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SUPABASE_URL` | URL do seu projeto Supabase | `https://xyzabc.supabase.co` |
| `SUPABASE_KEY` | Chave pública do Supabase | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada (servidor apenas) | `eyJhbG...` |
| `PORT` | Porta do servidor | `3000` |
| `NODE_ENV` | Ambiente (development/production) | `development` |

---

## 🧪 Testes

Para validar a instalação:

```powershell
# Verificar sintaxe do código
node -c src/server.js

# Rodarvão servidor de teste
npm run dev

# Acessar http://localhost:3000
```

---

## 📚 Documentação Adicional

- [Arquitetura do Projeto](./docs/ARQUITETURA.md)
- [Guia de Uso](./docs/USAGE_GUIDE.md)
- [Setup do Banco de Dados](./docs/SETUP_DATABASE.md)

---

## 🆘 Suporte

Para problemas ou dúvidas:

1. Verifique a seção **Troubleshooting** acima
2. Consulte os logs do console
3. Abra uma issue no repositório

---

## ✅ Checklist Final

Após instalar, verifique:

- [ ] Node.js instalado (v20+)
- [ ] npm install executado com sucesso
- [ ] Arquivo `.env` criado com credenciais Supabase
- [ ] Banco de dados Supabase configurado
- [ ] Servidor rodando em `http://localhost:3000`
- [ ] Página carrega sem erros
- [ ] Login funciona
- [ ] Comentários carregam

**🎉 Pronto! Seu projeto está funcionando!**

---

## 📄 Licença

Este projeto foi criado por **Nicollas Cane Seula** em 24/03/2026.

**Turma 205 - Anexo Irmã Maria Teresa (EEBIMT)**
