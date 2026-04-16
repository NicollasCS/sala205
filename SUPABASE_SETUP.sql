-- ===== Configuração do Banco de Dados para Sala 205 =====
-- Execute os comandos abaixo no Supabase SQL Editor (console.supabase.com)

-- 1. Criar tabel a de calendário
CREATE TABLE IF NOT EXISTS calendario (
    id bigint primary key generated always as identity,
    titulo text NOT NULL,
    descricao text,
    data date NOT NULL,
    tipo text DEFAULT 'Aviso',
    created_at timestamp with time zone DEFAULT now()
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_calendario_data ON calendario(data);

-- 2. Criar tabela de descrição da turma (se não existir)
CREATE TABLE IF NOT EXISTS descricao_turma (
    id serial PRIMARY KEY,
    descricao text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Inserir usuários especiais (protegidos)
-- Antes de inserir, verifique se já existem!
-- Senha "aluno205-1" em MD5: 4c511702018a2f08707bf05a6d6cb6c6
-- Senha "dev205-1" em MD5: a35502efa63a4734ce1806b66d126a87
-- Senha "administrador_turma205-1" em MD5: 9dd8094641b53034169aed883e935514

INSERT INTO usuarios (nome, senha)
VALUES 
  ('aluno205-1', '4c511702018a2f08707bf05a6d6cb6c6'),
  ('dev205-1', 'a35502efa63a4734ce1806b66d126a87')
ON CONFLICT (nome) DO NOTHING;

-- 4. Verificar dados inseridos
SELECT 'Usuários especiais criados:' as info, COUNT(*) as total 
FROM usuarios 
WHERE nome IN ('aluno205-1', 'dev205-1');

-- 5. Criar tabela de comentários de galeria
CREATE TABLE IF NOT EXISTS comentarios_galeria (
    id bigint primary key generated always as identity,
    galeria_id bigint NOT NULL,
    autor text NOT NULL,
    texto text NOT NULL,
    criado timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_galeria FOREIGN KEY (galeria_id) REFERENCES galeria(id) ON DELETE CASCADE,
    CONSTRAINT unique_usuario_galeria UNIQUE(galeria_id, autor)
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_comentarios_galeria_id ON comentarios_galeria(galeria_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_galeria_autor ON comentarios_galeria(autor);
