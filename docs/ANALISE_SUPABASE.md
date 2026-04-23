# 🗄️ Análise Completa do Supabase - Sala 205

## 📊 Estado Atual das Tabelas

| Tabela | Status | Problema | Ação |
|--------|--------|----------|------|
| `admin_requests` | ✅ OK | Nenhum | - |
| `app_settings` | ✅ OK | Nenhum | - |
| `calendario` | ✅ OK | Nenhum | - |
| `comentarios` | ✅ OK | Nenhum | - |
| `comentarios_galeria` | ✅ OK | Nenhum | - |
| `descricao_turma` | ⚠️ RUIM | 2 registros, 1 inválido | Limpar dados lixo |
| `galeria` | ⚠️ RUIM | URLs base64 inválidas | Deletar URLs ruins |
| `logs` | ✅ OK | Nenhum | - |
| `textos_pagina` | ❌ INÚTIL | Tabela não usada | Deletar ou ignorar |
| `usuarios` | ⚠️ RUIM | IDs 27, 28 incorretos | Mudar para 2, 3 |

---

## 🔍 Detalhes de Cada Problema

### 1️⃣ `descricao_turma` - DADOS SUJOS

**Registros atuais:**
```
ID | descricao | updated_at
---|-----------|--------------------
1  | ....... | 2026-04-17 01:30:27
2  | sadsadsadsadsadsadsadsadsadsadsad | 2026-04-23 06:55:38
```

**O que vai acontecer:**
- ❌ Deletar ambos os registros (estão inválidos)
- ✅ Inserir descrição padrão válida

**Resultado esperado:**
```
ID | descricao | updated_at
---|-----------|--------------------
1  | Espaço criado para reunir memórias... | 2026-04-23 XX:XX:XX
```

---

### 2️⃣ `galeria` - URLS NÃO FUNCIONAM

**Exemplo de registro problemático:**
```json
{
  "id": 59,
  "titulo": "asdsad",
  "descricao": "asdsed",
  "url": "data:image/jpeg;base64,9j/4AAQSkzJR...",
  "tipo_midia": "photo",
  "position": 1
}
```

**Problema:** 
- ❌ URL começa com `data:image` (base64 inline)
- ❌ Navegador não consegue fazer requisição HTTP
- ❌ Não aparece na galeria do site

**O que vai fazer:**
- ✅ Deletar todos os registros com URLs base64
- ✅ Manter apenas URLs válidas (http:// ou https://)

---

### 3️⃣ `textos_pagina` - TABELA DESNECESSÁRIA

**Dados:**
```json
{
  "tituloMain": "Sala 205 - Anexo",
  "subtituloMain": "Irmã Maria Teresa (EEBIMT)",
  "descricaoHero": "Conheça a história..."
}
```

**Problema:**
- ❌ Tabela existe mas não é usada no frontend
- ❌ O projeto não carrega dados dessa tabela
- ❌ Espaço de armazenamento desnecessário

**O que vai fazer:**
- ✅ Deletar todos os dados
- ⚠️ Manter tabela (em caso de uso futuro)

---

### 4️⃣ `usuarios` - IDS INCORRETOS

**Antes:**
```
ID | nome | role
---|------|------
1  | administrador_turma205-1 | admin ✓
27 | aluno205-1 | user ❌
28 | dev205-1 | dev ❌
```

**Depois (esperado):**
```
ID | nome | role
---|------|------
1  | administrador_turma205-1 | admin
2  | aluno205-1 | user
3  | dev205-1 | dev
```

**Impacto:** Apenas renumera os IDs, sem deletar dados

---

## 💡 Por Que a Galeria Não Está Funcionando

### Problema Técnico:

1. **Upload via Base64:**
   - Imagem é feita upload como string base64
   - Salva em `galeria.url` como `data:image/jpeg;base64,...`

2. **Frontend tenta carregar:**
   ```javascript
   <img src="data:image/jpeg;base64,9j/..." />
   // Isso funciona EM-LINHA, mas não via HTTP
   ```

3. **Resultado:**
   - ✅ Funciona em testes locais
   - ❌ NÃO funciona em produção/site hospedado
   - ❌ Não sincroniza com localhost

### Solução Correta:

Usar **Supabase Storage** ao invés de base64:
```javascript
// Correto:
<img src="https://seu-bucket.supabase.co/storage/v1/object/public/galeria/image.jpg" />

// Incorreto (base64):
<img src="data:image/jpeg;base64,9j/4AAQSkzJR..." />
```

---

## 🛠️ Próximos Passos

### Passo 1: Executar Limpeza ⚡
- Abrir `sql/LIMPEZA_SUPABASE.sql`
- Executar no console SQL do Supabase

### Passo 2: Testar Site 🧪
- Recarregar página inicial
- Verificar se descrição carrega
- Tentar fazer upload de imagem
- Verificar se aparece na galeria

### Passo 3: Uploading Correto 📤
- Modificar `galeriaController.js` para usar Supabase Storage
- Uploades devem gerar URLs públicas
- Salvar apenas a URL (não base64)

---

## 📋 Arquivos Criados

- ✅ `sql/LIMPEZA_SUPABASE.sql` - Script SQL com todos os comandos
- ✅ `docs/GUIA_LIMPEZA_SUPABASE.md` - Guia passo a passo
- ✅ `docs/ANALISE_SUPABASE.md` - Este arquivo

---

## ✅ Checklist de Execução

```
[ ] Fazer backup do Supabase (se disponível)
[ ] Abrir console SQL: Supabase → SQL Editor
[ ] Copiar script LIMPEZA_SUPABASE.sql
[ ] Executar (Ctrl+Enter ou botão Run)
[ ] Aguardar conclusão
[ ] Verificar resultados (não há erros)
[ ] Recarregar site
[ ] Testar upload de imagem
[ ] Testar login (admin, aluno, dev)
```

---

## ❓ Dúvidas Frequentes

**P: Vai deletar meus dados válidos?**
R: Não. O script identifica dados lixo (base64, strings aleatórias) e deleta apenas eles.

**P: Posso desfazer se der errado?**
R: Sim, com Supabase Backups ou GitHub (se estiver versionado).

**P: Preciso deletar a tabela `textos_pagina`?**
R: Não é obrigatório. O script apenas limpa os dados. Se quiser usar no futuro, deixe a tabela.

**P: Por que as imagens não aparecem?**
R: Porque estão em base64 (inline), não em URLs públicas. A correção em `galeriaController.js` é necessária.

