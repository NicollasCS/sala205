-- 📝 SUPABASE - INSERIR DADOS INICIAIS
-- Execute DEPOIS de criar todas as tabelas e adicionar as colunas faltantes

-- ============================================
-- INSERIR USUÁRIOS INICIAIS
-- ============================================

INSERT INTO usuarios (nome, senha, is_admin, role) VALUES 
    ('administrador_turma205-1', '1d1c2a030f7fef21cba99a76eb8e5e8e', true, 'root'),
    ('aluno205-1', 'e2a29b79619dd45c26a6c7ff69ce94d4', false, 'user'),
    ('dev205-1', '8f11c5abbc0d8ba96c1af6d4e3c77f5b', true, 'dev')
ON CONFLICT (nome) DO NOTHING;

-- ============================================
-- INSERIR DESCRIÇÃO DA TURMA
-- ============================================

INSERT INTO descricao_turma (descricao) 
VALUES ('Bem-vindo ao calendário da turma 205 - Anexo Irmã Maria Teresa!')
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar usuários criados:
-- SELECT id, nome, is_admin, role FROM usuarios;

-- Verificar descrição criada:
-- SELECT * FROM descricao_turma;
