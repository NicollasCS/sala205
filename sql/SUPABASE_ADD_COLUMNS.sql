-- 🔧 SUPABASE - ADICIONAR COLUNAS FALTANTES
-- Execute este SQL se receber erro "column does not exist"
-- No SQL Editor do Supabase

-- ============================================
-- ADICIONAR COLUNAS À TABELA USUARIOS
-- ============================================

-- Adicionar coluna is_admin se não existir
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Adicionar coluna role se não existir
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- ============================================
-- ATUALIZAR USUÁRIOS EXISTENTES
-- ============================================

-- Se o usuário já foi criado sem essas colunas, atualizar
UPDATE usuarios 
SET is_admin = true, role = 'root' 
WHERE nome = 'administrador_turma205-1' AND is_admin IS NULL;

UPDATE usuarios 
SET is_admin = false, role = 'user' 
WHERE nome = 'aluno205-1' AND role IS NULL;

UPDATE usuarios 
SET is_admin = true, role = 'dev' 
WHERE nome = 'dev205-1' AND role IS NULL;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute para verificar se as colunas foram adicionadas:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'usuarios' 
-- ORDER BY ordinal_position;

-- Resultado esperado deve incluir: is_admin, role
