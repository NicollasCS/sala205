# 🗄️ Setup do Supabase - Sala 205

## ✅ O que você precisa fazer

### Passo 1: Criar as Tabelas no Supabase

1. **Acesse seu projeto Supabase**: https://supabase.com/dashboard
2. **Navegue para "SQL Editor"** (painel esquerdo)
3. **Clique em "New Query"** ou **"New SQL snippet"**
4. **Copie TODO o conteúdo de `SUPABASE_SETUP.sql`** deste repositório
5. **Cole no editor do Supabase** e execute (botão "Run" ou Ctrl+Enter)
6. **Aguarde a conclusão** (você deve ver "Success" em verde)

### Passo 2: Verificar se Funcionou

Execute esta query no SQL Editor do Supabase:

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Você deve ver estas tabelas:
- ✅ `usuarios`
- ✅ `calendario`
- ✅ `galeria`
- ✅ `comentarios`
- ✅ `comentarios_galeria`
- ✅ `descricao_turma`
- ✅ `app_settings`
- ✅ `admin_requests`
- ✅ `logs`

### Passo 3: Verificar Dados Iniciais

Execute para ver as contas criadas:

```sql
SELECT id, nome, is_admin, role FROM usuarios;
```

Você deve ver:
| id  | nome                     | is_admin | role    |
|-----|--------------------------|----------|---------|
| 1   | administrador_turma205-1 | true     | root    |
| 2   | aluno205-1               | false    | user    |
| 3   | dev205-1                 | true     | dev     |

### Passo 4: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-publica-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# Desenvolvimento
PORT=6767
NODE_ENV=development
```

Como obter estas chaves:
1. Abra seu projeto no Supabase Dashboard
2. Clique em **Settings** (engrenagem, canto inferior esquerdo)
3. Clique em **API**
4. Você verá:
   - **Project URL** → copie para `SUPABASE_URL`
   - **Project API keys - anon public** → copie para `SUPABASE_KEY`
   - **Project API keys - service_role** → copie para `SUPABASE_SERVICE_ROLE_KEY`

## 🐛 Troubleshooting

### ❌ Erro: "Table usuarios does not exist"
- Verifique se você executou TODO o SQL em `SUPABASE_SETUP.sql`
- Confirme na query acima que a tabela foi criada

### ❌ Erro: "column usuarios.role does not exist"
- A tabela foi criada mas está incompleta
- Execute novamente: `ALTER TABLE usuarios ADD COLUMN role TEXT DEFAULT 'user';`

### ❌ Erro: "Supabase não configurado"
- Verifique se o arquivo `.env` existe com `SUPABASE_URL` e `SUPABASE_KEY`
- Confirme que as chaves estão corretas

### ❌ Erro 500 ao fazer login
- Verifique se as senhas no banco estão em MD5
- Execute: `SELECT * FROM usuarios;` para ver os hashes

## 📚 Senhas Iniciais (MD5)

| Usuário | Senha |
|---------|-------|
| administrador_turma205-1 | administrador_turma205-1 |
| aluno205-1 | aluno205-1 |
| dev205-1 | dev205-1 |

Os hashes MD5 já estão inseridos no arquivo SQL.

## 🚀 Próximos Passos

Após criar as tabelas:

1. **Inicie o servidor local:**
   ```bash
   npm run dev
   ```

2. **Teste a rota de usuários:**
   ```bash
   curl http://localhost:6767/api/usuarios
   ```

3. **Acesse o calendário:**
   - Abra `http://localhost:6767` no navegador
   - Teste o login com uma das contas acima

## 📋 Checklist

- [ ] Executei o SQL em `SUPABASE_SETUP.sql` no Supabase
- [ ] Verifiquei que todas as 9 tabelas foram criadas
- [ ] Criei um arquivo `.env` com as variáveis
- [ ] Iniciei o servidor com `npm run dev`
- [ ] Testei login com uma das contas
- [ ] Verifico que `/api/usuarios` retorna dados

---

**Dúvidas?** Consulte a documentação do Supabase: https://supabase.com/docs
