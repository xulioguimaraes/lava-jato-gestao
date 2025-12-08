-- Migration: Adicionar coluna porcentagem_comissao na tabela funcionarios
-- Valor padrão: 40 (40%)

ALTER TABLE funcionarios ADD COLUMN porcentagem_comissao REAL DEFAULT 40;

-- Atualizar funcionários existentes para ter 40% como padrão
UPDATE funcionarios SET porcentagem_comissao = 40 WHERE porcentagem_comissao IS NULL;

