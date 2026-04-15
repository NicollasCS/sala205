# 🎥 Configuração do Supabase Storage para Upload de Vídeos

## ✅ O que mudou?

Antes: Vídeos salvos **localmente** no servidor (não funciona em Vercel)  
Agora: Vídeos salvos no **Supabase Storage** (funciona em Vercel, mais seguro)

## 🚀 Passos para Configurar

### 1️⃣ Criar um Bucket no Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá para **Storage** (menu esquerdo)
3. Clique em **Create new bucket**
4. Nome do bucket: **`galeria-videos`** (IMPORTANTE - deve ser exato)
5. Marque **Public bucket** (para que os vídeos sejam acessíveis)
6. Clique em **Create bucket**

### 2️⃣ Configurar Permissões (Policies)

1. No bucket **galeria-videos**, clique em **Policies** (ou engrenagem)
2. Crie uma policy para **SELECT** (leitura):
   - Clique em **New policy**
   - Template: **Allow public read access**
   - Clique em **Review** e depois **Save policy**

3. Crie uma policy para **INSERT** e **DELETE** (escrita/deleção) - apenas para admin:
   ```sql
   -- Para INSERT
   CREATE POLICY "Allow admin uploads" ON storage.objects FOR INSERT 
   WITH CHECK (
     bucket_id = 'galeria-videos' 
     AND auth.jwt() ->> 'email' LIKE '%@admin.com'
   );
   
   -- Para DELETE
   CREATE POLICY "Allow admin delete" ON storage.objects FOR DELETE
   USING (
     bucket_id = 'galeria-videos'
     AND auth.jwt() ->> 'email' LIKE '%@admin.com'
   );
   ```

**Alternativa simples** (para testes):
- Policy: **Allow public access** para tudo (menos seguro, mas funciona)

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

## ✨ Benefícios

✅ Funciona em Vercel (ou qualquer hosting serverless)  
✅ Vídeos seguros na nuvem  
✅ URLs públicas automáticas  
✅ Escalável sem limite de espaço no servidor  
✅ CDN automático (vídeos carregam mais rápido)  

## 🐛 Solução de Problemas

**Erro: "bucket_id does not exist"**
- Certifique-se que o bucket se chama exatamente **`galeria-videos`**

**Erro: "Forbidden"**
- Verifique as policies do bucket
- Certifique-se que o bucket está marcado como **Public**

**Vídeo suma após fazer upload**
- Pode ser problema de policy
- Tente remover policies e usar "Allow public access"

**Upload muito lento**
- Normal para vídeos grandes
- Considere comprimir vídeos antes de fazer upload

