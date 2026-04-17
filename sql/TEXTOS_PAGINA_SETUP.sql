-- ========================================
-- CRIAR TABELA PARA TEXTOS DA PÁGINA
-- ========================================
-- Execute este script no Supabase SQL Editor para criar a tabela textos_pagina

CREATE TABLE IF NOT EXISTS textos_pagina (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Textos da Hero Section
    tituloMain TEXT DEFAULT 'Sala 205 - Anexo',
    subtituloMain TEXT DEFAULT 'Irmã Maria Teresa (EEBIMT)',
    descricaoHero TEXT DEFAULT 'Conheça a história, memórias e projetos da nossa turma',
    btnExplorar TEXT DEFAULT 'Explorar',
    
    -- Textos da Galeria
    tituloGaleria TEXT DEFAULT 'Galeria de Fotos',
    subtituloGaleria TEXT DEFAULT 'Momentos especiais da Sala 205',
    
    -- Textos da Comunidade
    tituloComunidade TEXT DEFAULT 'Participe da Comunidade',
    subtituloComunidade TEXT DEFAULT 'Conecte-se com seus colegas de turma',
    
    -- Textos dos Blocos de Funcionalidades
    comentarios TEXT DEFAULT 'Deixe mensagens e interaja com a turma',
    seguranca TEXT DEFAULT 'Faça login para acesso completo',
    cadastro TEXT DEFAULT 'Crie sua conta e faça parte',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE textos_pagina ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer pessoa pode ler textos (público)
CREATE POLICY "Textos são públicos" ON textos_pagina
    FOR SELECT USING (true);

-- Inserir valores padrão
INSERT INTO textos_pagina (
    tituloMain, 
    subtituloMain, 
    descricaoHero, 
    btnExplorar,
    tituloGaleria,
    subtituloGaleria,
    tituloComunidade,
    subtituloComunidade,
    comentarios,
    seguranca,
    cadastro
) VALUES (
    'Sala 205 - Anexo',
    'Irmã Maria Teresa (EEBIMT)',
    'Conheça a história, memórias e projetos da nossa turma',
    'Explorar',
    'Galeria de Fotos',
    'Momentos especiais da Sala 205',
    'Participe da Comunidade',
    'Conecte-se com seus colegas de turma',
    'Deixe mensagens e interaja com a turma',
    'Faça login para acesso completo',
    'Crie sua conta e faça parte'
) ON CONFLICT (id) DO NOTHING;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_textos_updated ON textos_pagina(updated_at);

SELECT 'Tabela textos_pagina criada com sucesso!' as status;
