-- 📋 SUPABASE SCHEMA SETUP
-- Execute este SQL no console do Supabase (SQL Editor)
-- https://supabase.com/dashboard/project/[seu-projeto]/sql/new

-- ============================================
-- 1️⃣ TABELA: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    created TIMESTAMP DEFAULT now(),
    is_admin BOOLEAN DEFAULT false,
    role TEXT DEFAULT 'user'
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_nome ON usuarios(nome);
CREATE INDEX IF NOT EXISTS idx_usuarios_created ON usuarios(created DESC);

-- ============================================
-- 2️⃣ TABELA: calendario
-- ============================================
CREATE TABLE IF NOT EXISTS calendario (
    id BIGSERIAL PRIMARY KEY,
    data DATE NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    created TIMESTAMP DEFAULT now(),
    updated TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendario_data ON calendario(data);

-- ============================================
-- 3️⃣ TABELA: galeria
-- ============================================
CREATE TABLE IF NOT EXISTS galeria (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo_midia TEXT DEFAULT 'photo', -- 'photo', 'video', 'document'
    storage_key TEXT NOT NULL,
    position INT DEFAULT 0,
    created TIMESTAMP DEFAULT now(),
    updated TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_galeria_position ON galeria(position);
CREATE INDEX IF NOT EXISTS idx_galeria_tipo ON galeria(tipo_midia);

-- ============================================
-- 4️⃣ TABELA: comentarios
-- ============================================
CREATE TABLE IF NOT EXISTS comentarios (
    id BIGSERIAL PRIMARY KEY,
    autor TEXT NOT NULL,
    texto TEXT NOT NULL,
    criado TIMESTAMP DEFAULT now(),
    is_pinned BOOLEAN DEFAULT false,
    parent_id BIGINT REFERENCES comentarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comentarios_autor ON comentarios(autor);
CREATE INDEX IF NOT EXISTS idx_comentarios_parent_id ON comentarios(parent_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_criado ON comentarios(criado DESC);

-- ============================================
-- 5️⃣ TABELA: comentarios_galeria
-- ============================================
CREATE TABLE IF NOT EXISTS comentarios_galeria (
    id BIGSERIAL PRIMARY KEY,
    galeria_id BIGINT NOT NULL REFERENCES galeria(id) ON DELETE CASCADE,
    autor TEXT NOT NULL,
    texto TEXT NOT NULL,
    criado TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_galeria_id ON comentarios_galeria(galeria_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_galeria_autor ON comentarios_galeria(autor);

-- ============================================
-- 6️⃣ TABELA: descricao_turma
-- ============================================
CREATE TABLE IF NOT EXISTS descricao_turma (
    id BIGSERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ⚠️ Se a tabela já existe com outro schema, ajuste manualmente as colunas

-- ============================================
-- 7️⃣ TABELA: app_settings
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated TIMESTAMP DEFAULT now()
);

-- ============================================
-- 8️⃣ TABELA: admin_requests
-- ============================================
CREATE TABLE IF NOT EXISTS admin_requests (
    id BIGSERIAL PRIMARY KEY,
    requested_user_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    reviewed_at TIMESTAMP,
    reviewed_by_name TEXT,
    review_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_user ON admin_requests(requested_user_id);

-- ============================================
-- 9️⃣ TABELA: logs
-- ============================================
CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    categoria TEXT NOT NULL,
    acao TEXT NOT NULL,
    detalhes TEXT,
    usuario TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_categoria ON logs(categoria);
CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs(usuario);

-- ============================================
-- 🔐 ROW LEVEL SECURITY (OPCIONAL)
-- ============================================

-- Remover políticas padrão (public access)
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendario DISABLE ROW LEVEL SECURITY;
ALTER TABLE galeria DISABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_galeria DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ✅ DADOS INICIAIS
-- ============================================

-- Inserir usuários iniciais (senhas em MD5)
INSERT INTO usuarios (nome, senha, is_admin, role) VALUES 
    ('administrador_turma205-1', '1d1c2a030f7fef21cba99a76eb8e5e8e', true, 'root'),
    ('aluno205-1', 'e2a29b79619dd45c26a6c7ff69ce94d4', false, 'user'),
    ('dev205-1', '8f11c5abbc0d8ba96c1af6d4e3c77f5b', true, 'dev')
ON CONFLICT (nome) DO NOTHING;

-- ============================================
-- 🎯 VERIFICAÇÃO
-- ============================================
-- Execute esta query para verificar se tudo foi criado:
--
-- SELECT tablename FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;
