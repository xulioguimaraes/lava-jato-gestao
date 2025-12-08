# 🚀 Guia Rápido de Início

## Passo a Passo Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Turso

1. Acesse [turso.tech](https://turso.tech) e crie uma conta
2. Crie um novo banco de dados
3. Copie a URL e o token de autenticação
4. Crie o arquivo `.env`:
```bash
cp .env.example .env
```

5. Edite o `.env`:
```env
TURSO_DATABASE_URL=libsql://seu-banco.turso.io
TURSO_AUTH_TOKEN=seu-token-aqui
SESSION_SECRET=qualquer-string-aleatoria-segura-aqui
```

### 3. Inicializar Banco
```bash
npm run db:init
```

### 4. Iniciar Projeto
```bash
npm run dev
```

### 5. Acessar
- Abra: http://localhost:5173
- Crie sua conta em `/registro`
- Faça login e comece a usar!

## 📍 URLs Importantes

- `/login` - Login admin
- `/registro` - Criar conta admin
- `/dashboard` - Painel admin (requer login)
- `/funcionarios/publico` - Área pública para funcionários

## ✅ Pronto!

Agora você pode:
1. Cadastrar funcionários no dashboard
2. Compartilhar `/funcionarios/publico` com os funcionários
3. Funcionários registram suas lavagens
4. Ver relatórios e comissões no dashboard

