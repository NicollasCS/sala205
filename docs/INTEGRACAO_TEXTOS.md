# 📌 Integração de Textos na Página Principal

Quando a funcionalidade de editar textos foi implementada, a página principal ainda não foi integrada para usar esses textos dinamicamente.

## 🎯 O que precisa ser feito

A página principal (`public/index.html` e `public/index.js`) precisa carregar os textos da API e aplicá-los aos elementos correspondentes.

## 📋 Elementos que Precisam ser Atualizados

### Hero Section
```html
<h1 id="heroTitle">Sala 205 - Anexo</h1>
<h2 id="heroSubtitle">Irmã Maria Teresa (EEBIMT)</h2>
<p id="heroDescription">Conheça a história, memórias e projetos da nossa turma</p>
<button id="heroBtn">Explorar ↓</button>
```

### Galeria de Fotos
```html
<h2 id="galeriaTitle">Galeria de Fotos</h2>
<p id="galeriaSubtitle">Momentos especiais da Sala 205</p>
```

### Participe da Comunidade
```html
<h2 id="comunidadeTitle">Participe da Comunidade</h2>
<p id="comunidadeSubtitle">Conecte-se com seus colegas de turma</p>
```

### Blocos de Funcionalidades
```html
<p id="textoComentarios">Deixe mensagens e interaja com a turma</p>
<p id="textoSeguranca">Faça login para acesso completo</p>
<p id="textoCadastro">Crie sua conta e faça parte</p>
```

## 🔧 Código para Adicionar

### Opção 1: Adicionar IDs ao HTML

Primeiramente, atualize `public/index.html` para adicionar `id` aos elementos:

```html
<!-- Hero Section -->
<h1 id="heroTitle">Sala 205 - Anexo</h1>
<h2 id="heroSubtitle">Irmã Maria Teresa (EEBIMT)</h2>
<p id="heroDescription">Conheça a história, memórias e projetos da nossa turma</p>
<a href="#sobre" class="btn-primary" id="heroBtn">Explorar ↓</a>

<!-- Galeria -->
<h2 id="galeriaTitle">Galeria de Fotos</h2>
<p id="galeriaSubtitle">Momentos especiais da Sala 205</p>

<!-- Comunidade -->
<h2 id="comunidadeTitle">Participe da Comunidade</h2>
<p id="comunidadeSubtitle">Conecte-se com seus colegas de turma</p>

<!-- Feature Boxes -->
<p id="textoComentarios">Deixe mensagens e interaja com a turma</p>
<p id="textoSeguranca">Faça login para acesso completo</p>
<p id="textoCadastro">Crie sua conta e faça parte</p>
```

### Opção 2: Adicionar Código JavaScript

No `public/index.js`, adicione estas funções:

```javascript
// ============================================
// CARREGAR TEXTOS DINÂMICOS DA PÁGINA
// ============================================

async function carregarTextosPageina() {
    try {
        const res = await fetch('/api/textos-pagina');
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        
        const textos = await res.json();
        
        // Atualizar Hero Section
        const heroTitle = document.getElementById('heroTitle');
        const heroSubtitle = document.getElementById('heroSubtitle');
        const heroDescription = document.getElementById('heroDescription');
        const heroBtn = document.getElementById('heroBtn');
        
        if (heroTitle) heroTitle.textContent = textos.tituloMain || 'Sala 205 - Anexo';
        if (heroSubtitle) heroSubtitle.textContent = textos.subtituloMain || 'Irmã Maria Teresa (EEBIMT)';
        if (heroDescription) heroDescription.textContent = textos.descricaoHero || 'Conheça a história, memórias e projetos da nossa turma';
        if (heroBtn) heroBtn.textContent = textos.btnExplorar + ' ↓' || 'Explorar ↓';
        
        // Atualizar Galeria
        const galeriaTitle = document.getElementById('galeriaTitle');
        const galeriaSubtitle = document.getElementById('galeriaSubtitle');
        
        if (galeriaTitle) galeriaTitle.textContent = textos.tituloGaleria || 'Galeria de Fotos';
        if (galeriaSubtitle) galeriaSubtitle.textContent = textos.subtituloGaleria || 'Momentos especiais da Sala 205';
        
        // Atualizar Comunidade
        const comunidadeTitle = document.getElementById('comunidadeTitle');
        const comunidadeSubtitle = document.getElementById('comunidadeSubtitle');
        
        if (comunidadeTitle) comunidadeTitle.textContent = textos.tituloComunidade || 'Participe da Comunidade';
        if (comunidadeSubtitle) comunidadeSubtitle.textContent = textos.subtituloComunidade || 'Conecte-se com seus colegas de turma';
        
        // Atualizar Feature Boxes
        const textoComentarios = document.getElementById('textoComentarios');
        const textoSeguranca = document.getElementById('textoSeguranca');
        const textoCadastro = document.getElementById('textoCadastro');
        
        if (textoComentarios) textoComentarios.textContent = textos.comentarios || 'Deixe mensagens e interaja com a turma';
        if (textoSeguranca) textoSeguranca.textContent = textos.seguranca || 'Faça login para acesso completo';
        if (textoCadastro) textoCadastro.textContent = textos.cadastro || 'Crie sua conta e faça parte';
        
    } catch (e) {
        console.error('Erro ao carregar textos da página:', e);
        // Se houver erro, mantém os textos padrão do HTML
    }
}

// Chamar ao inicializar a página:
// Adicione a chamada no final da função que inicializa a página
```

### Opção 3: Integrar com Inicialização Existente

Procure pela função `window.onload` ou `DOMContentLoaded` e adicione:

```javascript
// Em window.onload ou quando a página termina de carregar:

// Carregar tema
carregarTema();
carregarModoDark();

// Carregar textos dinâmicos
carregarTextosPageina();

// ... resto do código
```

## 📊 Diagrama de Fluxo

```
┌─────────────────────────────────────┐
│   Visitante acessa index.html       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Página carrega DOMContentLoaded    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  carregarTextosPageina() é chamada   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Fetch /api/textos-pagina           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Supabase retorna textos atuais      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  JavaScript atualiza elementos      │
│  innerHTML ou textContent            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Página exibe textos personalizados  │
└─────────────────────────────────────┘
```

## ✅ Checklist de Implementação

- [ ] Adicionar IDs aos elementos em `public/index.html`
- [ ] Adicionar função `carregarTextosPageina()` em `public/index.js`
- [ ] Chamar função na inicialização da página
- [ ] Testar no navegador
- [ ] Verificar que textos são atualizados após edição no admin

## 🧪 Testando a Integração

1. **No Admin Panel**:
   - Faça login como admin
   - Vá para "Editar Textos"
   - Mude o título para algo como "TESTE 123"
   - Clique em Salvar

2. **Na Página Principal**:
   - Abra um navegador incógnito (para limpar cache)
   - Acesse a página principal
   - Verifique se o título mudou para "TESTE 123"

3. **Se não aparecer**:
   - Abra DevTools (F12)
   - Verifique se há erros no Console
   - Verifique se a requisição a `/api/textos-pagina` retorna dados
   - Confirme que os IDs no HTML correspondem aos do JavaScript

## 🔍 Debugging

Se os textos não forem atualizados:

```javascript
// No console do navegador, execute:
fetch('/api/textos-pagina').then(r => r.json()).then(console.log)

// Deve exibir algo como:
// {
//   tituloMain: "Sala 205 - Anexo",
//   subtituloMain: "Irmã Maria Teresa (EEBIMT)",
//   ...
// }
```

## 📞 Próximos Passos

Após integrar:

1. Cache dos textos no localStorage para melhor performance
2. Adicionar botão "Atualizar Textos" na página (para quando mudar via admin)
3. Implementar fallback para quando a API não responder
4. Adicionar animação ao atualizar textos

Veja `docs/EDITAR_TEXTOS.md` para mais detalhes!
