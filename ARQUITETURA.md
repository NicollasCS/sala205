# 📊 ARQUITETURA - VISUALIZAÇÃO DA ESTRUTURA

```
┌─────────────────────────────────────────────────────────────┐
│              CLIENTE (Navegador/App Mobile)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│                   VERCEL (Produção)                         │
│  /api/*  → api/index.js (export default)                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                LOCALHOST:6767 (Desenvolvimento)              │
│                 Express.js Server                            │
├──────────────────────────────────────────────────────────────┤
│  src/server-novo.js                                          │
│  ├─ PORT: 6767                                              │
│  ├─ NODE_ENV: development                                   │
│  └─ npm start → inicia server-novo.js                       │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼────┐ ┌─────▼──────┐ ┌────▼──────┐
│  CORS      │ │ JSON Parse │ │  Static   │
│ Middleware │ │ Middleware │ │  Assets   │
└───────┬────┘ └─────┬──────┘ └────┬──────┘
        │            │             │
        └────────────┼─────────────┘
                     │
        ┌────────────▼────────────┐
        │  Router Principal       │
        │  src/routes/index.js    │
        └────────────┬────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼───────────┐ ┌─▼────────────┐ ┌─▼──────────────┐
│ Middleware    │ │ Auth Routes  │ │ Admin Routes   │
│ (auth.js)     │ │ (/auth)      │ │ (/admin)       │
├───────────────┤ ├──────────────┤ ├────────────────┤
│ isAdminToken  │ │ POST cadastro│ │ GET logs       │
│ isDevToken    │ │ POST login   │ │ PUT site-status│
│ requireAdmin  │ └──────┬───────┘ │ POST admin-req │
│ errorHandler  │        │         └────────┬───────┘
└───────┬───────┘        │                  │
        │                │                  │
        │          ┌─────▼──────────────────▼────┐
        │          │   CONTROLLERS               │
        │          │                              │
        │          ├─ authController.js           │
        │          ├─ usuariosController.js       │
        │          ├─ calendarioController.js     │
        │          ├─ galeriaController.js        │
        │          ├─ comentariosController.js    │
        │          └─ adminController.js          │
        │          └─────┬──────────────────┬────┘
        │                │                  │
        │          ┌─────▼──────────────────▼────┐
        │          │    UTILS & HELPERS          │
        │          │                              │
        │          ├─ supabase.js (Inicializa)    │
        │          ├─ helpers.js                  │
        │          │  ├─ isProfane()              │
        │          │  ├─ normalizeUser()          │
        │          │  ├─ createLog()              │
        │          │  ├─ getAppSetting()          │
        │          │  ├─ promoteUserToAdmin()     │
        │          │  └─ Mais...                  │
        │          └─────┬──────────────────┬────┘
        │                │                  │
        └────────────────┼──────────────────┘
                         │
              ┌──────────▼──────────┐
              │   SUPABASE (PostgreSQL)
              │                      │
              ├─ usuarios           │
              ├─ calendario         │
              ├─ galeria            │
              ├─ comentarios        │
              ├─ logs               │
              ├─ app_settings       │
              ├─ admin_requests     │
              ├─ descricao_turma    │
              └─ comentarios_galeria│
              
              ┌────────────────────┐
              │  SUPABASE STORAGE  │
              │  /galeria-videos   │
              └────────────────────┘
```

## 🔄 FLUXO DE UMA REQUISIÇÃO

```
1. Cliente faz requisição
   GET /api/usuarios?admin-token=turma205-admin

2. Express recebe e passa por Middlewares
   ├─ CORS Middleware ✅
   ├─ JSON Parse ✅
   └─ Static Assets ✅

3. Router Principal (index.js) roteia
   /api/usuarios → usuariosRoutes.js

4. Router Específico (usuariosRoutes.js)
   GET / → usuariosController.listUsers

5. Middleware de Autenticação (requireAdmin)
   ├─ Verifica header x-admin-token
   └─ Se inválido: retorna 403

6. Controller (usuariosController.listUsers)
   ├─ Chama supabase.from('usuarios').select()
   ├─ Usa helpers.normalizeUser()
   ├─ Cria log com createLog()
   └─ Retorna res.json(users)

7. Response volta ao cliente
   200 OK com JSON
```

## 📁 HIERARQUIA DE PASTAS

```
src/
│
├── config/
│   └── constants.js          ← Constantes centralizadas
│                               (GALERIA_PAGE_SIZE, TOKENS, etc)
│
├── middleware/
│   └── auth.js              ← Autenticação e autorização
│                               (isAdminToken, requireAdmin, etc)
│
├── utils/
│   ├── supabase.js          ← Inicialização Supabase
│   │                          (singleton pattern)
│   └── helpers.js           ← Funções auxiliares
│                               (normalizeUser, createLog, etc)
│
├── controllers/              ← Lógica de negócio
│   ├── authController.js
│   ├── usuariosController.js
│   ├── calendarioController.js
│   ├── galeriaController.js
│   ├── comentariosController.js
│   └── adminController.js
│
├── routes/                   ← Definição de rotas REST
│   ├── index.js             ← Router principal (agregador)
│   ├── authRoutes.js
│   ├── usuariosRoutes.js
│   ├── calendarioRoutes.js
│   ├── galeriaRoutes.js
│   ├── comentariosRoutes.js
│   ├── adminRoutes.js
│   └── healthRoutes.js
│
├── server.js               ← Antigo (mantém compatibilidade)
│
└── server-novo.js          ← NOVO - Use este!
                               (Express app + middleware setup)
```

## 🎯 SEPARAÇÃO DE RESPONSABILIDADES

| Camada | Responsabilidade | Exemplo |
|--------|------------------|---------|
| **Config** | Constantes e configurações | PORT, TOKENS, LIMITES |
| **Middleware** | Validação e autorização | isAdminToken(), requireAdmin() |
| **Utils** | Funções reutilizáveis | normalizeUser(), createLog() |
| **Controllers** | Lógica de negócio | listUsers(), createEvento() |
| **Routes** | Mapeamento HTTP → Controller | router.get('/') → controller() |
| **Server** | Setup Express e listeners | Middleware global, PORT, listeners |

## ✅ TESTES FUNCIONAIS

```bash
# Health Check
curl http://localhost:6767/

# Listar Usuários (com autenticação)
curl -H "x-admin-token: turma205-admin" \
     http://localhost:6767/api/usuarios

# Listar Galeria (com paginação)
curl http://localhost:6767/api/galeria?page=0&limit=5

# Criar Evento (POST com body)
curl -X POST \
     -H "x-admin-token: turma205-admin" \
     -H "Content-Type: application/json" \
     -d '{"titulo":"Aula","descricao":"Mat","data":"2026-04-20"}' \
     http://localhost:6767/api/calendario
```

## 🚀 MELHORIAS IMPLEMENTADAS

| Antes | Depois |
|-------|--------|
| Monolítico | Modular |
| 2000+ linhas em 1 arquivo | ~50 linhas por módulo |
| Difícil debugar | Fácil de entender |
| Sem separação | 6 camadas bem definidas |
| Difícil testar | Fácil testar unitariamente |
| Sem documentação | Bem organizado |
