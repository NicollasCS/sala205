-- 🔧 SUPABASE - CRIAR TABELAS FALTANTES APENAS
-- Execute no SQL Editor do Supabase para criar tabelas que ainda não existem

-- ✅ Verificar quais tabelas existem:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- ============================================
-- TABELAS ESSENCIAIS (EXECUTAR SE NÃO EXISTIREM)
-- ============================================

-- 1️⃣ USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    created TIMESTAMP DEFAULT now(),
    is_admin BOOLEAN DEFAULT false,
    role TEXT DEFAULT 'user'
);
CREATE INDEX IF NOT EXISTS idx_usuarios_nome ON usuarios(nome);
CREATE INDEX IF NOT EXISTS idx_usuarios_created ON usuarios(created DESC);

-- 2️⃣ CALENDARIO
CREATE TABLE IF NOT EXISTS calendario (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    tipo TEXT DEFAULT 'Aviso',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calendario_data ON calendario(data);

-- 3️⃣ GALERIA
CREATE TABLE IF NOT EXISTS galeria (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    url TEXT,
    data DATE,
    tipo_midia TEXT DEFAULT 'photo',
    position INT DEFAULT 0,
    created TIMESTAMP DEFAULT now(),
    updated TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_galeria_position ON galeria(position);
CREATE INDEX IF NOT EXISTS idx_galeria_tipo ON galeria(tipo_midia);

-- 4️⃣ COMENTARIOS
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

-- 5️⃣ COMENTARIOS_GALERIA
CREATE TABLE IF NOT EXISTS comentarios_galeria (
    id BIGSERIAL PRIMARY KEY,
    galeria_id BIGINT NOT NULL REFERENCES galeria(id) ON DELETE CASCADE,
    autor TEXT NOT NULL,
    texto TEXT NOT NULL,
    criado TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comentarios_galeria_id ON comentarios_galeria(galeria_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_galeria_autor ON comentarios_galeria(autor);

-- 6️⃣ DESCRICAO_TURMA (DEVE TER EXATAMENTE ESSAS COLUNAS)
CREATE TABLE IF NOT EXISTS descricao_turma (
    id BIGSERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7️⃣ APP_SETTINGS
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT now()
);

-- 8️⃣ ADMIN_REQUESTS
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

-- 9️⃣ LOGS
CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    categoria TEXT NOT NULL,
    subcategoria TEXT NOT NULL,
    detalhes TEXT,
    timestamp TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_logs_categoria ON logs(categoria);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);

-- ============================================
-- 🔓 REMOVER ROW LEVEL SECURITY
-- ============================================
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendario DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS galeria DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comentarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comentarios_galeria DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS descricao_turma DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS logs DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 📝 DADOS INICIAIS (OPCIONAL)
-- ============================================

-- ⚠️ IMPORTANTE: Se a tabela usuarios já existe, execute PRIMEIRO:
-- ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
-- ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Depois, inserir usuários (senhas em MD5) APENAS se estão vazios
INSERT INTO usuarios (nome, senha, is_admin, role) VALUES 
    ('administrador_turma205-1', '1d1c2a030f7fef21cba99a76eb8e5e8e', true, 'root'),
    ('aluno205-1', 'e2a29b79619dd45c26a6c7ff69ce94d4', false, 'user'),
    ('dev205-1', '8f11c5abbc0d8ba96c1af6d4e3c77f5b', true, 'dev')
ON CONFLICT (nome) DO NOTHING;

-- Inserir descrição padrão
INSERT INTO descricao_turma (descricao) 
VALUES ('Bem-vindo ao calendário da turma 205 - Anexo Irmã Maria Teresa!')
ON CONFLICT DO NOTHING;
