# 🎨 Guia Rápido - Editar Textos da Página

## ⚡ Início Rápido (3 passos)

### 1️⃣ Configurar o Banco de Dados
```
→ Abra: sql/TEXTOS_PAGINA_SETUP.sql
→ Execute no Supabase SQL Editor
→ Pronto! Tabela criada
```

### 2️⃣ Acessar o Painel Admin
```
→ Login: administrador_turma205-1
→ Vá para: Guia "Editar Textos"
→ Modifique os textos desejados
```

### 3️⃣ Salvar Alterações
```
→ Clique em "Salvar Todos os Textos"
→ Pronto! Textos atualizados
```

## 📍 Onde Está Implementado

| Item | Arquivo |
|------|---------|
| **Interface Admin** | `public/auth/admin/admin.html` (linhas ~310-380) |
| **Lógica Admin** | `public/auth/admin/admin.js` (funções de textos) |
| **Estilos** | `public/auth/admin/admin.css` (seção "EDITAR TEXTOS") |
| **Controller** | `src/controllers/textosController.js` |
| **Routes** | `src/routes/textosRoutes.js` |
| **SQL** | `sql/TEXTOS_PAGINA_SETUP.sql` |
| **Docs** | `docs/EDITAR_TEXTOS.md` |

## 📝 Textos Disponíveis para Editar

✅ **Hero Section**
- Título principal
- Subtítulo
- Descrição
- Texto do botão

✅ **Galeria**
- Título da seção
- Subtítulo

✅ **Comunidade**
- Título da seção
- Subtítulo

✅ **Funcionalidades**
- Comentários
- Acesso Seguro
- Cadastro

## 🔧 Endpoints API

```
GET  /api/textos-pagina          → Obter textos atuais
POST /api/textos-pagina          → Salvar textos (admin only)
```

## 💡 Dicas

- ✅ Clique em "Visualizar" para ver como os textos ficarão
- ✅ Use "Restaurar Padrões" para voltar aos textos originais
- ✅ Todos os campos têm validação básica
- ✅ As alterações são salvas imediatamente no banco

## ⚠️ Importante

A página principal AINDA NÃO usa esses textos automaticamente. Para integrar:

1. Abra `public/index.js`
2. Procure por `atualizarStatusLogin()`
3. Adicione uma chamada para `carregarTextos()` (já implementada)
4. Mapear os valores para os elementos HTML

Veja mais em `docs/EDITAR_TEXTOS.md`
