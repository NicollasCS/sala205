# Setup da Sala 205

## 🚀 Configuração Inicial

Este documento descreve os passos necessários para configurar o banco de dados do projeto Sala 205.

### 📋 Pré-requisitos

- Node.js instalado
- Acesso ao Supabase (console.supabase.com)
- Variáveis de ambiente configuradas (.env)

### 🔧 Passos de Configuração

#### 1. Criar tabelas no Supabase

1. Acesse [console.supabase.com](https://console.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Copie e execute o conteúdo do arquivo `SUPABASE_SETUP.sql`

Este script irá:
- ✅ Criar a tabela `calendario`
- ✅ Criar a tabela `descricao_turma`
- ✅ Inserir as contas de sistema (`aluno205-1` e `dev205-1`)

#### 2. Executar script de setup (Opcional)

Para inserir os usuários especiais via Node.js:

```bash
node src/setup_database.js
```

Este script:
- ✅ Verifica se as contas já existem
- ✅ Insere `aluno205-1` e `dev205-1` se não existirem
- ✅ Exibe status de cada operação

### 📝 Contas de Sistema

Estas contas são **protegidas** e não podem ser excluídas pela página de admin:

```
Conta: aluno205-1
Senha: aluno205-1
Permissões: Acesso ao calendário exclusivamente

Conta: dev205-1
Senha: dev205-1
Permissões: Desenvolvimento e testes

Conta: administrador_turma205-1
Senha: administrador_turma205-1
Permissões: Acesso total ao painel de admin
```

### 🔐 Proteções Implementadas

✅ **No Banco de Dados:**
- Contas especiais não podem ser deletadas via `/api/usuarios`
- Contas especiais não podem ser renomeadas via `/api/usuarios/renomear`
- Calendário acessível apenas para `aluno205-1`

✅ **Na Interface:**
- Seção de calendário oculta para usuários não-autenticados
- Botão "Meu Calendário" aparece apenas para `aluno205-1`
- Acesso à página de calendário restrito a `aluno205-1`

### 📊 Estrutura de Tabelas

#### `calendario`
```sql
- id (bigint, PK auto-increment)
- titulo (text, required)
- descricao (text, optional)
- data (date, required)
- tipo (text, default: 'Aviso')
- created_at (timestamp, default: now())
```

#### `usuarios`
```sql
- id (bigint, PK auto-increment)
- nome (text, required, unique)
- senha (text, required, MD5 hash)
- created (timestamp)
```

#### `descricao_turma`
```sql
- id (serial, PK)
- descricao (text, required)
- updated_at (timestamp, default: now())
```

### ✅ Verificação

Após setup, teste:

1. **Login com aluno205-1:**
   - Acesse `http://localhost:3000/auth/login/login.html`
   - Use: `aluno205-1` / `aluno205-1`
   - Verifique se o botão "Meu Calendário" aparece

2. **Criar evento:**
   - Acesse painel admin
   - Login com `administrador_turma205-1` / `administrador_turma205-1`
   - Teste criar um evento de calendário

3. **Proteção de contas:**
   - Teste tentar deletar `aluno205-1` ou `dev205-1`
   - Deve mostrar mensagem: "Esta conta não pode ser excluída. É uma conta de sistema."

### 🐛 Troubleshooting

**Erro: "Tabela calendario não configurada"**
- Execute o SQL em SUPABASE_SETUP.sql no console Supabase

**Erro: "Credenciais inválidas"**
- Verifique se a senha está correta (MD5): `34e6c4e15d88fcc2aae02e87d10c7e77` para `aluno205-1`

**Calendário não apareça para aluno205-1**
- Verifique se o usuário foi inserido corretamente
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Teste em modo anônimo

### 📞 Suporte

Para mais informações, consulte:
- `SUPABASE_STORAGE_SETUP.md` - Setup de armazenamento
- `VERCEL_DEPLOY_GUIDE.md` - Deploy em Vercel
- `LOGS_GUIDE.md` - Sistema de logs
