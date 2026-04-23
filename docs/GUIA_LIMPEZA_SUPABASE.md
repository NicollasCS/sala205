# 📋 Guia de Limpeza do Supabase

## 🎯 Problemas Identificados

### 1. ❌ `descricao_turma` - Dados Lixo
**Status:** 2 registros - um com dados inválidos
```
ID 1: "......." (inválido)
ID 2: "sadsadsadsadsadsadsadsadsadsadsad" (lixo)
```
**Ação:** Deletar dados lixo, manter apenas 1 descrição válida

---

### 2. ❌ `galeria` - URLs Inválidas (BASE64)
**Status:** Imagens subidas como base64 ao invés de URLs públicas
```
URL: data:image/jpeg;base64,9j/4AAQSkzJR...
```
**Problema:** Browser não consegue acessar via HTTP, então não aparece no site
**Ação:** Deletar registros com URLs base64, manter apenas URLs válidas

---

### 3. ❌ `textos_pagina` - Tabela Desnecessária
**Status:** Existe mas não é usada no projeto
**Ação:** Deletar (ou comentar na limpeza se for usar no futuro)

---

### 4. ❌ `usuarios` - IDs Incorretos
**Status:** 3 usuários com IDs errados
| nome | ID Atual | ID Correto |
|------|----------|-----------|
| administrador_turma205-1 | 1 | 1 ✓ |
| aluno205-1 | 27 | 2 ❌ |
| dev205-1 | 28 | 3 ❌ |

**Ação:** Renumerar para IDs 1, 2, 3

---

## 🚀 Como Executar

### Opção 1: Executar Tudo (Recomendado)

1. **Abrir console SQL do Supabase:**
   - Ir em Project → SQL Editor
   - Ou: `https://app.supabase.com/project/[seu-project]/sql/new`

2. **Copiar e executar o script:**
   - Abrir arquivo: `sql/LIMPEZA_SUPABASE.sql`
   - Copiar TODO o conteúdo
   - Colar no console do Supabase
   - Clique em **"Run"** (Ctrl+Enter)

3. **Verificar resultado:**
   - Execução deve ser sem erros
   - Verificar quantidades finais na tabela

---

### Opção 2: Executar por Etapas (Mais Seguro)

Se preferir fazer com cuidado, execute em blocos:

#### Bloco 1: Limpar `descricao_turma`
```sql
DELETE FROM descricao_turma 
WHERE descricao LIKE '%...%' 
   OR descricao LIKE '%sadsad%'
   OR descricao IS NULL;
```

#### Bloco 2: Limpar `galeria`
```sql
DELETE FROM galeria
WHERE url LIKE 'data:image%' 
   OR url LIKE 'data:video%'
   OR url IS NULL 
   OR url = '';
```

#### Bloco 3: Corrigir `usuarios`
```sql
UPDATE usuarios SET id = 2 WHERE nome = 'aluno205-1' AND id = 27;
UPDATE usuarios SET id = 3 WHERE nome = 'dev205-1' AND id = 28;
```

#### Bloco 4: Deletar/Limpar `textos_pagina` (OPCIONAL)
```sql
-- Apenas limpar dados (sem deletar tabela)
DELETE FROM textos_pagina;
```

---

## ⚠️ Impactos e Considerações

### Será Deletado:
- ❌ 1 descrição com dados lixo
- ❌ X imagens com URLs inválidas (base64)
- ❌ Dados na tabela `textos_pagina` (tabela pode ser deletada depois)

### Será Atualizado:
- ⚠️ IDs dos usuários `aluno205-1` e `dev205-1`
  - **Impacto:** Se há referências a esses IDs em outras tabelas, elas também mudarão

### Será Mantido:
- ✅ 1 descrição válida
- ✅ Galeria com URLs válidas
- ✅ Todos os logs e comentários
- ✅ Usuário administrador

---

## ✅ Checklist Pós-Limpeza

Depois de executar, verificar:

- [ ] `descricao_turma`: 1 registro apenas
- [ ] `galeria`: Todos com URLs começando por `http://` ou `https://`
- [ ] `usuarios`: IDs 1, 2, 3 para admin, aluno, dev
- [ ] Página inicial: Descrição está carregando?
- [ ] Galeria: Imagens aparecem?
- [ ] Admin: Consegue fazer login?

---

## 🔄 Rollback (Se Algo der Errado)

Se precisar desfazer, você pode:
1. Usar **Supabase Backups** (se disponível)
2. Restaurar a versão anterior do projeto

**Recomendação:** Faça um backup antes de executar!

---

## 📞 Dúvidas

Se algum comando der erro:
- Verificar se a sintaxe está correta
- Ver a mensagem de erro
- Executar apenas a query problemática
- Contactar suporte Supabase se necessário

