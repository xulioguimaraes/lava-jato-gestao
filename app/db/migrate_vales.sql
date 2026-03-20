-- Tabela de vales (adiantamentos de funcionários)
-- Cada vale é um adiantamento retirado durante a semana, descontado da comissão no fechamento

CREATE TABLE IF NOT EXISTS vales (
  id TEXT PRIMARY KEY,
  funcionario_id TEXT NOT NULL,
  valor REAL NOT NULL,
  data_vale DATE NOT NULL,
  observacoes TEXT,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
);

CREATE INDEX IF NOT EXISTS idx_vales_funcionario ON vales(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_vales_data ON vales(data_vale);
CREATE INDEX IF NOT EXISTS idx_vales_user ON vales(user_id);
