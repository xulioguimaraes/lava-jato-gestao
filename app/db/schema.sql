-- Tabela de usuários (admin/gestor)
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  nome_negocio TEXT,
  slug TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  telefone TEXT,
  ativo INTEGER DEFAULT 1,
  porcentagem_comissao REAL DEFAULT 40,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de lavagens (o que cada funcionário lavou)
CREATE TABLE IF NOT EXISTS lavagens (
  id TEXT PRIMARY KEY,
  funcionario_id TEXT NOT NULL,
  descricao TEXT NOT NULL,
  preco REAL NOT NULL,
  foto_url TEXT,
  data_lavagem DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
);

-- Tabela de despesas
CREATE TABLE IF NOT EXISTS despesas (
  id TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor REAL NOT NULL,
  categoria TEXT,
  data_despesa DATE NOT NULL,
  observacoes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de vales (adiantamentos de funcionários)
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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_lavagens_funcionario ON lavagens(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_lavagens_data ON lavagens(data_lavagem);
CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data_despesa);
CREATE INDEX IF NOT EXISTS idx_vales_funcionario ON vales(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_vales_data ON vales(data_vale);

