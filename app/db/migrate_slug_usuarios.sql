-- Adiciona coluna de slug (sem unique na criação para evitar erro em bases com dados)
ALTER TABLE usuarios ADD COLUMN slug TEXT;

-- (Opcional) após popular os valores, crie o índice único:
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_slug ON usuarios(slug);

