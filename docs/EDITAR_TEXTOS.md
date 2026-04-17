# Editar Textos da Página - Guia de Configuração

## 🎯 Visão Geral
Uma nova guia foi adicionada ao painel de administração que permite editar todos os textos principais da página sem precisar modificar o código HTML.

## 📋 O que foi implementado

### 1. **Interface de Edição (Admin Panel)**
- Nova guia "Editar Textos" no painel administrativo
- Campos organizados por seção:
  - **Hero Section**: Título, Subtítulo, Descrição, Botão
  - **Galeria de Fotos**: Título e Subtítulo
  - **Comunidade**: Título e Subtítulo
  - **Funcionalidades**: Textos de Comentários, Segurança e Cadastro

### 2. **Backend**
- **Controller**: `src/controllers/textosController.js`
  - `getTextos()`: Retorna textos atuais ou padrões
  - `updateTextos()`: Salva novos textos no banco de dados

- **Routes**: `src/routes/textosRoutes.js`
  - `GET /api/textos-pagina`: Obter textos
  - `POST /api/textos-pagina`: Salvar textos (apenas admin)

### 3. **Frontend**
- **Admin Panel** (`public/auth/admin/admin.html`)
  - Novos campos de entrada para cada texto
  - Botões: Salvar, Visualizar, Restaurar Padrões

- **Admin JS** (`public/auth/admin/admin.js`)
  - `carregarTextos()`: Busca textos do API
  - `salvarTextos()`: Envia textos para o API
  - `previewTextos()`: Mostra pré-visualização
  - `resetTextos()`: Restaura textos padrões

- **Admin CSS** (estilos para a nova aba)
  - Design consistente com o resto do painel
  - Responsivo para mobile

## 🚀 Como Usar

### Para Administradores:

1. **Acessar o Painel Admin**
   - Faça login com `administrador_turma205-1`
   - Vá para a guia "Editar Textos"

2. **Editar Textos**
   - Modifique qualquer texto desejado
   - Use quebras de linha onde necessário
   - Clique em "Visualizar" para ver uma pré-visualização

3. **Salvar Alterações**
   - Clique em "Salvar Todos os Textos"
   - Aguarde a confirmação

4. **Restaurar Padrões**
   - Clique em "Restaurar Padrões" para voltar aos textos originais
   - Confirme a ação e clique em Salvar

## 🗄️ Configuração do Banco de Dados

### IMPORTANTE: Execute o Script SQL

Antes de usar a funcionalidade, execute o script SQL para criar a tabela:

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Vá para: SQL Editor
3. Copie e cole o conteúdo de: `sql/TEXTOS_PAGINA_SETUP.sql`
4. Clique em "Run"

### Estrutura da Tabela `textos_pagina`

```sql
CREATE TABLE textos_pagina (
    id UUID PRIMARY KEY,
    
    -- Hero Section
    tituloMain VARCHAR,
    subtituloMain VARCHAR,
    descricaoHero TEXT,
    btnExplorar VARCHAR,
    
    -- Galeria
    tituloGaleria VARCHAR,
    subtituloGaleria VARCHAR,
    
    -- Comunidade
    tituloComunidade VARCHAR,
    subtituloComunidade VARCHAR,
    
    -- Funcionalidades
    comentarios TEXT,
    seguranca TEXT,
    cadastro TEXT,
    
    -- Timestamps
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

## 📝 Valores Padrão

Todos os textos têm valores padrão sensatos:

- **Título Principal**: "Sala 205 - Anexo"
- **Subtítulo**: "Irmã Maria Teresa (EEBIMT)"
- **Descrição Hero**: "Conheça a história, memórias e projetos da nossa turma"
- **Botão**: "Explorar"
- **Título Galeria**: "Galeria de Fotos"
- **Subtítulo Galeria**: "Momentos especiais da Sala 205"
- **Título Comunidade**: "Participe da Comunidade"
- **Subtítulo Comunidade**: "Conecte-se com seus colegas de turma"
- **Comentários**: "Deixe mensagens e interaja com a turma"
- **Segurança**: "Faça login para acesso completo"
- **Cadastro**: "Crie sua conta e faça parte"

## 🔒 Permissões

- ✅ **Leitura**: Público (qualquer visitante)
- ✅ **Edição**: Apenas admin (`administrador_turma205-1`, `dev205-1`)

## 🎨 Integração Frontend

Os textos são carregados automaticamente na página principal quando os visitantes acessam:

1. A página principal (`/`) carrega os textos via `carregarTextos()`
2. Os valores são aplicados aos elementos correspondentes
3. Se não houver dados no banco, usa os padrões

### Próxima Etapa: Integrar na Página Principal

Para que os textos apareçam realmente na página principal, adicione o seguinte no `public/index.js`:

```javascript
// Após a função atualizarStatusLogin(), adicione:
async function atualizarTextosPageina() {
    try {
        const res = await fetch('/api/textos-pagina');
        const textos = await res.json();
        
        // Atualizar hero section
        document.querySelector('h1').textContent = textos.tituloMain;
        document.querySelector('.hero-subtitle').textContent = textos.subtituloMain;
        // ... e assim por diante
    } catch (e) {
        console.error('Erro ao carregar textos:', e);
    }
}

// Chamar na inicialização:
atualizarTextosPageina();
```

## 🐛 Troubleshooting

**Erro: "Tabela textos_pagina não configurada"**
- Execute o script SQL `sql/TEXTOS_PAGINA_SETUP.sql`

**Textos não aparecem na página principal**
- Integre a função `atualizarTextosPageina()` no index.js

**Erro ao salvar: "Unauthorized"**
- Verifique se você está logado como admin
- Confirme que o token de administrador está correto

## 📞 Suporte

Para mais informações, consulte:
- [ARQUITETURA.md](../docs/ARQUITETURA.md)
- [FUNCOES_IMPLEMENTADAS.md](../docs/FUNCOES_IMPLEMENTADAS.md)
