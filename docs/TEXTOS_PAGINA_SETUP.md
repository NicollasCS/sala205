# 📝 Configurar Tabela de Textos da Página

## Problema
Você está vendo o erro: **"Tabela textos_pagina não configurada"**

Isso significa que a tabela não foi criada no seu banco de dados Supabase.

---

## ✅ Solução Rápida

### Opção 1: Executar Script Automaticamente
```bash
node src/setup_textos_pagina.js
```

Se a tabela ainda não existe, o script vai te dar instruções.

### Opção 2: Criar Manualmente no Supabase (Recomendado)

1. **Acesse o Dashboard Supabase:**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto
   - Clique em **SQL Editor**

2. **Crie uma Nova Query:**
   - Clique no botão **New Query**
   - Copie e cole TODO o conteúdo do arquivo: `sql/TEXTOS_PAGINA_SETUP.sql`

3. **Execute o SQL:**
   - Clique no botão **Run** (ou Ctrl+Enter)
   - Aguarde a confirmação de sucesso

4. **Verifique no painel Tables:**
   - Você deve ver a tabela `textos_pagina` aparecer

---

## 🔍 Verificar se Funcionou

Depois de criar a tabela:

1. **No Dashboard da Aplicação:**
   - Vá para `/auth/admin/` (Admin Login)
   - Acesse a aba "Atualizações" ou "Textos"
   - Tente editar algum texto

2. **No Navegador (Console):**
   - Abra o DevTools (F12)
   - Vá para a aba **Console**
   - Não deve mais aparecer: `"Erro ao salvar: Tabela textos_pagina não configurada"`

---

## 📋 Arquivo SQL

Se precisa do SQL manualmente, aqui está:

```sql
-- Criar tabela textos_pagina
CREATE TABLE IF NOT EXISTS textos_pagina (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Textos da Hero Section
    tituloMain TEXT DEFAULT 'Sala 205 - Anexo',
    subtituloMain TEXT DEFAULT 'Irmã Maria Teresa (EEBIMT)',
    descricaoHero TEXT DEFAULT 'Conheça a história, memórias e projetos da nossa turma',
    btnExplorar TEXT DEFAULT 'Explorar',
    
    -- Textos da Galeria
    tituloGaleria TEXT DEFAULT 'Galeria de Fotos',
    subtituloGaleria TEXT DEFAULT 'Momentos especiais da Sala 205',
    
    -- Textos da Comunidade
    tituloComunidade TEXT DEFAULT 'Participe da Comunidade',
    subtituloComunidade TEXT DEFAULT 'Conecte-se com seus colegas de turma',
    
    -- Textos dos Blocos de Funcionalidades
    comentarios TEXT DEFAULT 'Deixe mensagens e interaja com a turma',
    seguranca TEXT DEFAULT 'Faça login para acesso completo',
    cadastro TEXT DEFAULT 'Crie sua conta e faça parte',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE textos_pagina ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer pessoa pode ler textos (público)
CREATE POLICY "Textos são públicos" ON textos_pagina
    FOR SELECT USING (true);

-- Inserir valores padrão
INSERT INTO textos_pagina (
    tituloMain, 
    subtituloMain, 
    descricaoHero, 
    btnExplorar,
    tituloGaleria,
    subtituloGaleria,
    tituloComunidade,
    subtituloComunidade,
    comentarios,
    seguranca,
    cadastro
) VALUES (
    'Sala 205 - Anexo',
    'Irmã Maria Teresa (EEBIMT)',
    'Conheça a história, memórias e projetos da nossa turma',
    'Explorar',
    'Galeria de Fotos',
    'Momentos especiais da Sala 205',
    'Participe da Comunidade',
    'Conecte-se com seus colegas de turma',
    'Deixe mensagens e interaja com a turma',
    'Faça login para acesso completo',
    'Crie sua conta e faça parte'
) ON CONFLICT (id) DO NOTHING;
```

---

## 🆘 Se Continuar com Erro

1. Verifique se o arquivo `.env` tem as variáveis corretas:
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_KEY=sua-chave-publica
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-privada
   ```

2. Teste a conexão:
   ```bash
   node src/setup_database.js
   ```

3. Se persistir, entre em contato com suporte ou verifique os logs do Supabase
