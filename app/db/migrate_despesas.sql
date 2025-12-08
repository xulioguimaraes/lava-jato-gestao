-- Script para criar a tabela de despesas
-- Execute este script se a tabela ainda não existir

CREATE TABLE IF NOT EXISTS despesas (
  id TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor REAL NOT NULL,
  categoria TEXT,
  data_despesa DATE NOT NULL,
  observacoes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data_despesa);

