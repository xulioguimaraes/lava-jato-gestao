# 🚗 Sistema de Gestão para Lava Jato

Sistema completo de gestão para lava jato desenvolvido com **Remix** e **Turso** (SQLite distribuído).

## ✨ Funcionalidades

### 👤 Área Admin (Usuário Logado)
- **Dashboard** com visão geral da semana (segunda a sábado)
- Visualização de todas as entradas e saídas da semana
- Lista de funcionários com totais individuais
- Cadastro e gerenciamento de funcionários
- Resumo por funcionário com cálculo de comissão (40%)

### 👷 Área Pública (Funcionários)
- Listagem pública de funcionários
- Cada funcionário pode registrar suas lavagens
- Formulário com: descrição, preço e foto
- Perfil do funcionário mostrando:
  - Total lavado na semana
  - Comissão calculada (40% do total)
  - Histórico de todas as lavagens da semana

## 🚀 Tecnologias

- **Remix** - Framework React moderno
- **Turso** - Banco de dados SQLite distribuído (gratuito)
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **bcryptjs** - Hash de senhas

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no [Turso](https://turso.tech) (gratuita)

## 🔧 Instalação

1. **Clone ou navegue até o projeto:**
```bash
cd lava-jato-gestao
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o banco de dados Turso:**

   a. Crie uma conta em [turso.tech](https://turso.tech)
   
   b. Crie um novo banco de dados
   
   c. Obtenha a URL e o token de autenticação
   
   d. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   
   e. Edite o `.env` com suas credenciais:
   ```env
   TURSO_DATABASE_URL=libsql://seu-banco.turso.io
   TURSO_AUTH_TOKEN=seu-token-aqui
   SESSION_SECRET=um-valor-aleatorio-seguro-aqui
   ```

4. **Inicialize o banco de dados:**
```bash
npm run db:init
```

5. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

6. **Acesse no navegador:**
```
http://localhost:5173
```

## 📁 Estrutura do Projeto

```
lava-jato-gestao/
├── app/
│   ├── db/
│   │   ├── schema.sql          # Schema do banco
│   │   └── turso.server.ts      # Configuração do Turso
│   ├── routes/
│   │   ├── _index.tsx           # Redirecionamento
│   │   ├── login.tsx            # Login admin
│   │   ├── registro.tsx         # Registro admin
│   │   ├── dashboard.tsx        # Dashboard admin
│   │   ├── funcionarios.novo.tsx        # Criar funcionário
│   │   ├── funcionarios.$id.tsx         # Detalhes funcionário (admin)
│   │   ├── funcionarios.publico.tsx     # Lista pública
│   │   ├── funcionarios.$id.lavagem.tsx # Registrar lavagem
│   │   └── funcionarios.$id.perfil.tsx # Perfil funcionário
│   ├── utils/
│   │   ├── auth.server.ts       # Autenticação
│   │   ├── session.server.ts    # Gerenciamento de sessão
│   │   ├── funcionarios.server.ts # CRUD funcionários
│   │   └── lavagens.server.ts   # CRUD lavagens
│   ├── root.tsx                 # Layout principal
│   └── tailwind.css             # Estilos
├── package.json
├── remix.config.js
├── tailwind.config.js
└── vite.config.ts
```

## 🗄️ Schema do Banco

O sistema usa 3 tabelas principais:

- **usuarios**: Usuários admin/gestor
- **funcionarios**: Funcionários do lava jato
- **lavagens**: Registro de lavagens com foto, preço e data

## 🎯 Como Usar

### 1. Criar Conta Admin
- Acesse `/registro` e crie sua conta de administrador
- Faça login em `/login`

### 2. Cadastrar Funcionários
- No dashboard, clique em "Novo Funcionário"
- Preencha nome, email e telefone (opcionais)

### 3. Funcionários Registram Lavagens
- Acesse `/funcionarios/publico` (pode ser compartilhado)
- Funcionário seleciona seu nome
- Preenche: descrição, preço, data e foto (opcional)
- Sistema calcula automaticamente 40% de comissão

### 4. Visualizar Relatórios
- Dashboard mostra todas as lavagens da semana
- Resumo por funcionário com totais e comissões
- Perfil do funcionário mostra seu histórico pessoal

## 🌐 Hospedagem Gratuita

### Opções Recomendadas:

1. **Vercel** (Recomendado)
   - Conecte seu repositório GitHub
   - Configure as variáveis de ambiente
   - Deploy automático

2. **Netlify**
   - Similar ao Vercel
   - Suporte completo a Remix

3. **Railway**
   - Suporta Node.js
   - Fácil configuração

### Variáveis de Ambiente na Hospedagem:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `SESSION_SECRET`

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run typecheck` - Verifica tipos TypeScript

## 🔒 Segurança

- Senhas são hasheadas com bcrypt
- Sessões seguras com cookies httpOnly
- Validação de dados no servidor
- Proteção de rotas admin

## 📸 Upload de Fotos

Atualmente, as fotos são armazenadas como base64 no banco. Para produção, recomenda-se:
- Usar serviços como Cloudinary, AWS S3, ou Supabase Storage
- Ou armazenar em sistema de arquivos do servidor

## 🐛 Troubleshooting

**Erro ao conectar no Turso:**
- Verifique se as credenciais no `.env` estão corretas
- Confirme que o banco foi criado no dashboard do Turso

**Erro ao inicializar banco:**
- Execute `npm run db:init` novamente
- Verifique se o schema.sql está correto

## 📄 Licença

Este projeto é open source e está disponível para uso livre.

## 🤝 Contribuindo

Sinta-se à vontade para abrir issues ou pull requests!

---

Desenvolvido com ❤️ usando Remix e Turso

