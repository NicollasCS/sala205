# 📚 Documentação - Sala 205

Bem-vindo à documentação completa do projeto Sala 205! Use este índice para encontrar o que precisa.

## 🚀 Para Começar

Se você é novo no projeto:
1. Leia: [`SETUP_DATABASE.md`](SETUP_DATABASE.md) - Setup do Supabase
2. Leia: [`USAGE_GUIDE.md`](USAGE_GUIDE.md) - Como usar o projeto
3. Explore: [`ESTRUTURA.md`](ESTRUTURA.md) - Entenda a organização

## 🎯 Documentação por Tópico

### 🏗️ **Arquitetura & Estrutura**
- [`ARQUITETURA.md`](ARQUITETURA.md) - Visão geral técnica, componentes, fluxos
- [`ESTRUTURA.md`](ESTRUTURA.md) - Organização de pastas, módulos, imports
- [`REFATORACAO_GUIA.md`](REFATORACAO_GUIA.md) - Padrões de código, convenções

### 💾 **Banco de Dados**
- [`SETUP_DATABASE.md`](SETUP_DATABASE.md) - Configuração Supabase, schema SQL
- Na raiz do projeto:
  - `SUPABASE_SETUP_SIMPLES.sql` - Schema básico
  - `SUPABASE_SETUP.sql` - Schema completo
  - `SUPABASE_ADD_COLUMNS.sql` - Adicionar colunas

### 📱 **Funcionalidades**
- [`FUNCOES_IMPLEMENTADAS.md`](FUNCOES_IMPLEMENTADAS.md) - Lista de features
- [`USAGE_GUIDE.md`](USAGE_GUIDE.md) - Como usar cada parte
- [`CORRECOES_ABRIL_2026.md`](CORRECOES_ABRIL_2026.md) - Bugs corrigidos recentemente
- [`REDESIGN_SUMMARY.md`](REDESIGN_SUMMARY.md) - Novo design implementado

### 🚀 **Deploy & Performance**
- [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - Deploy na Vercel

### 🆕 **Next.js (Migração)**
- [`NEXT_JS_MIGRATION.md`](NEXT_JS_MIGRATION.md) - ⭐ **Leia isto para migrar para Next.js!**

---

## 📖 Guias Rápidos

### "Como faço X?"

#### "Como fazer o setup inicial?"
1. `npm install`
2. Configure `.env` (veja template `.env.example`)
3. Execute `node src/setup_database.js`
4. Execute SQL do `SUPABASE_SETUP_SIMPLES.sql` no Supabase Console
5. `npm start` para rodar o servidor

#### "Como adicionar um novo endpoint de API?"
Ver [`ARQUITETURA.md`](ARQUITETURA.md) - seção "Adicionar Nova Rota"

#### "Como fazer deploy?"
Leia [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)

#### "Como migrar para Next.js?"
Leia [`NEXT_JS_MIGRATION.md`](NEXT_JS_MIGRATION.md) - guia passo a passo completo

#### "Quais são as contas de teste?"
```
aluno205-1 / aluno205-1
dev205-1 / dev205-1
administrador_turma205-1 / administrador_turma205-1
```

---

## 📊 Estrutura Técnica em 2 Minutos

```
FRONTEND (Vanilla JS)        BACKEND (Express)          DATABASE (Supabase)
┌──────────────────┐        ┌──────────────────┐       ┌──────────────────┐
│ public/          │   API  │ src/             │  ORM  │ PostgreSQL       │
│ ├── index.html   │───────→│ ├── controllers/ │──────→│ ├── usuarios      │
│ ├── index.js     │←───────│ ├── routes/      │←──────│ ├── calendario    │
│ └── auth/        │  JSON  │ └── utils/       │ JSON  │ ├── galeria       │
│     ├── login    │        │                  │       │ └── comentarios   │
│     ├── cadastro │        │ PORT 6767        │       │                  │
│     └── admin    │        │                  │       │ RLS + JWT Auth   │
└──────────────────┘        └──────────────────┘       └──────────────────┘
   (localhost:3000)            (localhost:6767)        (Cloud + Storage)
```

---

## ✅ Features Implementadas

- ✅ Calendário para alunos
- ✅ Galeria de fotos/vídeos
- ✅ Sistema de comentários
- ✅ Painel admin completo
- ✅ Autenticação JWT
- ✅ Dark/Light Mode
- ✅ Temas (Azul/Verde)
- ✅ Responsivo
- ✅ Logs de atividade

---

## 🔗 Links Úteis

- **Supabase Console**: https://app.supabase.com/
- **Vercel Dashboard**: https://vercel.com/
- **GitHub**: https://github.com/NicollasCS/sala205
- **Deploy Produção**: https://sala205.vercel.app

---

## 🆘 Precisa de Ajuda?

1. **Problema com setup?** → [`SETUP_DATABASE.md`](SETUP_DATABASE.md)
2. **Erro em uma feature?** → [`CORRECOES_ABRIL_2026.md`](CORRECOES_ABRIL_2026.md)
3. **Quer migrar para Next.js?** → [`NEXT_JS_MIGRATION.md`](NEXT_JS_MIGRATION.md)
4. **Não entende a arquitetura?** → [`ARQUITETURA.md`](ARQUITETURA.md)

---

**Última atualização**: 17/04/2026
**Documentação limpa e organizada** ✨
