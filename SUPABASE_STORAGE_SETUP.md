# 🎥 Configuração do Supabase Storage para Upload de Vídeos

## ⚠️ IMPORTANTE: Ignorar as Policies Complexas

Se você viu um erro como:
```
ERROR: 42601: syntax error at or near "CREATE"
Failed to run sql query
```

**Ignore o resto do guia sobre policies!** 

A solução é **MUITO mais simples**:
1. Criar o bucket
2. Marcar como "Public bucket"
3. Pronto! 🎉

O servidor (Node.js) já cuida de toda a validação de acesso.

## ✅ O que mudou?

Antes: Vídeos salvos **localmente** no servidor (não funciona em Vercel)  
Agora: Vídeos salvos no **Supabase Storage** (funciona em Vercel, mais seguro)

## 🚀 Passos para Configurar (Simples!)

### 1️⃣ Criar um Bucket no Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá para **Storage** (menu esquerdo)
3. Clique em **Create new bucket**
4. Nome do bucket: **`galeria-videos`** (IMPORTANTE - deve ser exato)
5. **Marque "Public bucket"** ✅ (essencial!)
6. Clique em **Create bucket**

Pronto! Não precisa fazer mais nada de policies.

### 3️⃣ Testar a Configuração

1. Abra o Painel Admin: `https://seu-site.com/admin`
2. Login com: `dev205-1 : dev205-1`
3. Vá para a aba **Galeria**
4. Tente fazer upload de um vídeo

Se funcionar, você verá:
- ✅ "Vídeo upload com sucesso!"
- ✅ Vídeo aparecer na galeria
- ✅ Logs dirão: "✅ Vídeo salvo no Supabase Storage: video_xxxxx"

### 4️⃣ Testar no Vercel

1. Faça push do código para GitHub
2. Vercel fará deploy automático
3. Teste upload em produção

## 🔧 Variáveis de Ambiente

Certifique-se que estas variáveis estão definidas no `.env`:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...
SUPABASE_KEY=eyJxxxx...
```

Se não tiver, vá em: Supabase Dashboard → Project Settings → API

## 🗑️ O que Acontece ao Deletar um Vídeo?

1. Vídeo é deletado do **Supabase Storage** (espaço liberado)
2. Registro é deletado do **banco de dados Supabase**
3. Apaga automaticamente da galeria do site

## 📊 Limite de Armazenamento

- **Plano Gratuito**: 1 GB (deve ser suficiente)
- Se precisar mais, upgrade no Supabase dashboard

## 🔐 Como Funciona a Segurança?

O servidor valida o acesso usando o header `x-admin-token`:
- **Só pode fazer upload/delete quem tem token válido**
- Token enviado automaticamente pelo admin.js
- Servidor verifica: `x-admin-token === 'turma205-admin'` ou `'turma205-dev'`
- Sem token válido: erro `401 Acesso negado`

## ✨ Benefícios

✅ Funciona em Vercel (ou qualquer hosting serverless)  
✅ Vídeos seguros na nuvem  
✅ URLs públicas automáticas  
✅ Escalável sem limite de espaço no servidor  
✅ CDN automático (vídeos carregam mais rápido)  
✅ Validação de segurança no backend  

## 🐛 Solução de Problemas

**Erro: "bucket_id does not exist"**
- Certifique-se que o bucket se chama exatamente **`galeria-videos`**
- Você criou o bucket? Vá em Storage → Create new bucket

**Erro: "Forbidden" ou erro ao fazer upload**
- Verifique que o bucket está marcado como **Public**
- Vá em: Storage → galeria-videos → Bucket settings → Public bucket ✓

**Erro ao deletar vídeo**
- Alguns buckets podem ter restrições
- Tente marcar: Storage → galeria-videos → Settings → Public: ON

**Vídeo não aparece na galeria após upload**
- O vídeo foi enviado? Verifique os logs do servidor
- Vá em: Supabase Dashboard → Storage → galeria-videos
- O arquivo deve estar lá com nome tipo: `video_1234567890_abc123`

**Upload muito lento**
- Normal para vídeos grandes
- Considere comprimir vídeos antes de fazer upload
- Limite é 800MB por arquivo (@todo: aumentar se necessário)

