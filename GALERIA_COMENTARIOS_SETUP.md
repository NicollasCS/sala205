# 🎬 Setup - Comentários na Galeria

## O que foi implementado

✅ **Banco de Dados**: Agora carrega e exibe dados  
✅ **Botão "Atualizar Dados"**: Consertado - não mais sai do botão  
✅ **Comentários na Galeria**: Sistema de comentários com:
- Máximo 100 caracteres por comentário
- Apenas 1 comentário por usuário por imagem/video
- Exibição de todos os comentários
- Opção de deletar próprio comentário

---

## 🔧 PRÓXIMOS PASSOS - Execute o SQL no Supabase

### 1. Abra o Supabase SQL Editor
1. Vá para: https://app.supabase.com/project/qdszkzvgtpejaknjjola/sql/new
2. Ou navegue em: Project → SQL Editor → New Query

### 2. Cole este code SQL:

```sql
-- Criar tabela de comentários de galeria
CREATE TABLE IF NOT EXISTS comentarios_galeria (
    id bigint primary key generated always as identity,
    galeria_id bigint NOT NULL,
    autor text NOT NULL,
    texto text NOT NULL,
    criado timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_galeria FOREIGN KEY (galeria_id) REFERENCES galeria(id) ON DELETE CASCADE,
    CONSTRAINT unique_usuario_galeria UNIQUE(galeria_id, autor)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_comentarios_galeria_id ON comentarios_galeria(galeria_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_galeria_autor ON comentarios_galeria(autor);

-- Verificar se tabela foi criada
SELECT 'Tabela comentarios_galeria criada com sucesso!' as status;
```

### 3. Clique em "Execute" (Cmd/Ctrl + Enter)

Você verá a mensagem: `Tabela comentarios_galeria criada com sucesso!`

---

## 🧪 Testando

### 1. **Banco de Dados Admin**
- Acesse o painel admin (administrador_turma205-1)
- Clique em "Banco de Dados"
- Clique em "Atualizar Dados" ← Agora funcionará! ✅

### 2. **Comentários na Galeria**
- Acesse a página principal (index.html)
- Role até a galeria
- Cada imagem/video terá uma seção "Comentários"
- Faça login
- Digite um comentário (máx 100 caracteres)
- Clique em "Enviar"
- Você só poderá comentar uma vez por imagem/video

---

## 📝 Detalhes Técnicos

### Endpoints de API criados:

#### GET - Listar comentários de uma imagem
```
GET /api/galeria/:galeriaId/comentarios
Retorna: Array de comentários
```

#### POST - Adicionar comentário (máx 100 chars, 1 por usuário)
```
POST /api/galeria/:galeriaId/comentarios
Body: { autor: "usuario", texto: "comentário" }
Retorna: Novo comentário ou erro
```

#### DELETE - Deletar comentário
```
DELETE /api/galeria/comentarios/:comentarioId
Body: { autor: "usuario" }
Retorna: Confirmação ou erro
```

### Restrições:
- ✅ Máximo 100 caracteres por comentário
- ✅ Apenas 1 comentário por usuário por imagem/video
- ✅ Usuário só pode deletar seu próprio comentário (ou admin)
- ✅ Campo `texto` não pode ser vazio

---

## 🐛 Se algo não funcionar

### Banco de Dados não carrega dados?
- Verifique se seu token de admin está válido
- Tente clicar em "Atualizar Dados" novamente
- Verifique o console do navegador para mensagens de erro

### Comentários não aparecem?
- Certifique-se que executou o SQL no Supabase
- Recarregue a página (F5 ou Cmd+R)
- Tente com outro usuário

### "Erro ao buscar comentários"?
- Verifique se a tabela `comentarios_galeria` existe no Supabase
- Execute novamente o SQL acima

---

## 📱 Funcionalidades

### Para Usuários Normais:
- Ver comentários de outros usuários
- Deixar 1 comentário por imagem (100 caracteres máx)
- Deletar seu próprio comentário

### Para Admin:
- Ver todos os comentários
- Deletar qualquer comentário
- Acessar o banco de dados completo (admin panel)

---

**Status**: ✅ Pronto para testar!
