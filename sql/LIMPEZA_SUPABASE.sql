-- ============================================
-- SCRIPT DE LIMPEZA E CORREÇÃO - SUPABASE
-- Executar em: SQL Editor do Supabase
-- Data: 2026-04-23
-- ============================================

-- ============================================
-- 1. LIMPAR TABELA: descricao_turma
-- ============================================

-- Deletar dados lixo
DELETE FROM descricao_turma 
WHERE descricao LIKE '%...%' 
   OR descricao LIKE '%sadsad%'
   OR descricao IS NULL 
   OR descricao = '';

-- Manter apenas 1 descrição válida
-- Se existir múltiplas, manter a mais recente
DELETE FROM descricao_turma 
WHERE id NOT IN (
    SELECT id FROM descricao_turma 
    ORDER BY updated_at DESC NULLS LAST 
    LIMIT 1
);

-- Se table estiver vazia, inserir descrição padrão
INSERT INTO descricao_turma (descricao, updated_at)
SELECT 
    'Espaço criado para reunir memórias e fotos da turma. Um projeto gerido com dedicação e amor.',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM descricao_turma);


-- ============================================
-- 2. LIMPAR TABELA: galeria
-- ============================================

-- Ver quantos itens têm URLs ruins (base64)
-- SELECT COUNT(*) FROM galeria WHERE url LIKE 'data:image%';

-- Deletar itens com URLs inválidas (base64 ou sem protocol)
DELETE FROM galeria
WHERE url LIKE 'data:image%' 
   OR url LIKE 'data:video%'
   OR url IS NULL 
   OR url = ''
   OR (url NOT LIKE 'http%' AND url NOT LIKE 'https%');


-- ============================================
-- 3. CORRIGIR TABELA: usuarios
-- ============================================

-- Atualizar IDs para os valores corretos
-- ATENÇÃO: Isso vai mudar os IDs, pode impactar foreign keys

-- Opção 1: Se não há constraints, é mais simples
UPDATE usuarios SET id = 2 WHERE nome = 'aluno205-1' AND id = 27;
UPDATE usuarios SET id = 3 WHERE nome = 'dev205-1' AND id = 28;

-- Se der erro de constraint, usar Opção 2:
-- 1. Criar usuários novos com IDs corretos
-- 2. Deletar antigos
-- 3. Renumerar sequence

-- Verificar resultado
-- SELECT id, nome, role FROM usuarios WHERE nome IN ('administrador_turma205-1', 'aluno205-1', 'dev205-1') ORDER BY id;


-- ============================================
-- 4. REMOVER TABELA: textos_pagina (OPCIONAL)
-- ============================================

-- ⚠️ DESCOMENTAR APENAS SE TEM CERTEZA
-- DROP TABLE IF EXISTS textos_pagina CASCADE;

-- Se não quiser deletar, apenas limpar dados:
DELETE FROM textos_pagina;


-- ============================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================

-- Contar registros por tabela
SELECT 
    'descricao_turma' as tabela, COUNT(*) as total FROM descricao_turma
UNION ALL
SELECT 'galeria', COUNT(*) FROM galeria
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'calendario', COUNT(*) FROM calendario
UNION ALL
SELECT 'comentarios', COUNT(*) FROM comentarios
UNION ALL
SELECT 'logs', COUNT(*) FROM logs;

-- Ver usuários principais
SELECT id, nome, role, created FROM usuarios 
WHERE nome IN ('administrador_turma205-1', 'aluno205-1', 'dev205-1')
ORDER BY id;

-- Ver galeria
SELECT id, titulo, tipo_midia, url, position FROM galeria ORDER BY position;

-- Ver descrição
SELECT id, descricao, updated_at FROM descricao_turma;
