# Sala 205 - Anexo Irmã Maria Teresa

Criado por: Nicollas Cane Seula em 24/03/2026 para a turma 205 do Anexo Irmã Maria Teresa

**Status**: Refatoração completa + Melhorias UI/UX + Pronto para migração Next.js ✅

## 📚 Documentação

Toda a documentação foi organizada na pasta `/docs`:

| Arquivo | Descrição |
|---------|-----------|
| [`NEXT_JS_MIGRATION.md`](docs/NEXT_JS_MIGRATION.md) | 🚀 **Guia completo para migrar para Next.js** |
| [`ARQUITETURA.md`](docs/ARQUITETURA.md) | Estrutura técnica do projeto |
| [`ESTRUTURA.md`](docs/ESTRUTURA.md) | Organização de pastas e arquivos |
| [`FUNCOES_IMPLEMENTADAS.md`](docs/FUNCOES_IMPLEMENTADAS.md) | Lista de funcionalidades |
| [`SETUP_DATABASE.md`](docs/SETUP_DATABASE.md) | Configuração do Supabase |
| [`DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) | Deploy na Vercel |
| [`USAGE_GUIDE.md`](docs/USAGE_GUIDE.md) | Como usar a plataforma |
| [`REFATORACAO_GUIA.md`](docs/REFATORACAO_GUIA.md) | Padrões de código |
| [`CORRECOES_ABRIL_2026.md`](docs/CORRECOES_ABRIL_2026.md) | Últimas correções implementadas |
| [`REDESIGN_SUMMARY.md`](docs/REDESIGN_SUMMARY.md) | Resumo do novo design |

## 🚀 Início Rápido

### Setup Inicial
```bash
npm install
node src/setup_database.js
```

### Desenvolvimento
```bash
npm start        # Inicia servidor Express (http://localhost:6767)
npm run dev      # Com hot-reload
```

### Banco de Dados
Execute o SQL em qualquer um dos arquivos na raiz:
- `SUPABASE_SETUP_SIMPLES.sql` - Setup básico
- `SUPABASE_SETUP.sql` - Setup completo
- `SUPABASE_ADD_COLUMNS.sql` - Adicionar colunas

## 👥 Contas de Acesso

| Conta | Senha | Permissão |
|-------|-------|-----------|
| aluno205-1 | aluno205-1 | Acesso ao calendário |
| dev205-1 | dev205-1 | Desenvolvimento |
| administrador_turma205-1 | administrador_turma205-1 | Admin total |

## ✨ Features Implementadas

✅ Calendário exclusivo para alunos
✅ Galeria multimedia com Supabase Storage
✅ Sistema de comentários (API apenas)
✅ Painel de administração completo
✅ Suporte a temas (Azul ↔ Verde)
✅ Modo claro/escuro
✅ Logs de atividades
✅ Autenticação com JWT + MD5
✅ Foto da escola no background
✅ Sidebar de comentários corrigida
✅ Design responsivo e moderno

## 🔄 Stack Atual

- **Frontend**: Vanilla JavaScript + HTML/CSS
- **Backend**: Express.js + Node.js
- **Banco**: Supabase (PostgreSQL)
- **Deploy**: Vercel (Serverless)
- **Auth**: JWT + MD5 hashing

## 🚀 Próximas Etapas (Next.js)

Quer migrar para Next.js? **Leia [`docs/NEXT_JS_MIGRATION.md`](docs/NEXT_JS_MIGRATION.md)**

### Benefícios da migração:
- ⚡ Performance 50%+ melhor
- 📦 Bundle size menor
- 🎯 SSR/SSG automático
- 🔍 SEO excelente
- 📱 Melhor mobile
- 🚀 Deploy Vercel nativo

**Tempo estimado**: 4-6 horas

## 📁 Estrutura do Projeto

```
sala205/
├── docs/                    # 📚 Documentação completa
├── public/                  # Frontend estático
│   ├── index.html/.css/.js
│   ├── auth/
│   │   ├── login/
│   │   ├── cadastro/
│   │   └── admin/
│   └── image/
├── src/                     # Backend (Express.js)
│   ├── server.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── api/                     # Vercel serverless
├── .env                     # Variáveis de ambiente
└── package.json
```

## 🔐 Segurança

⚠️ **IMPORTANTE**:
- Nunca compartilhe `SUPABASE_SERVICE_ROLE_KEY`
- RLS (Row Level Security) está ativo no Supabase
- Autenticação via JWT
- Senhas hasheadas com MD5

## 📞 Dúvidas?

Consulte a documentação em `/docs` ou abra uma issue!

---

**Última atualização**: 17/04/2026 - Refatoração completa + Limpeza de arquivos
