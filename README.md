# Vida Plena — Gestão de Beneficiários e Capacitação

Plataforma web completa para gestão de beneficiários, cursos, turmas, inscrições, presenças e conformidade LGPD da ONG Vida Plena.

---

## Stack Técnica

| Camada        | Tecnologia                        |
|---------------|-----------------------------------|
| Framework     | Next.js 15 (App Router)           |
| Linguagem     | TypeScript                        |
| UI            | React + Tailwind CSS              |
| Banco         | PostgreSQL via Supabase           |
| Auth          | Supabase Auth                     |
| Validação     | Zod + React Hook Form             |
| Icons         | Lucide React                      |

---

## Pré-requisitos

1. **Node.js 18+** — https://nodejs.org
2. **npm** ou **yarn**
3. **Conta Supabase** — https://supabase.com

---

## Instalação

### 1. Instalar Node.js

Baixe e instale o Node.js LTS em https://nodejs.org/en/download  
Após instalar, reabra o terminal e verifique:

```bash
node --version   # deve mostrar v18+ ou superior
npm --version
```

### 2. Instalar dependências

```bash
cd c:\PROJETO
npm install
```

### 3. Configurar Supabase

#### 3.1 Criar projeto

1. Acesse https://supabase.com e crie uma conta
2. Clique em **New Project** e defina um nome, senha forte e região
3. Aguarde o projeto inicializar (~2 minutos)

#### 3.2 Obter credenciais

Acesse: **Project Settings → API**

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha no browser)

#### 3.3 Configurar variáveis de ambiente

```bash
copy .env.local.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=COLE_AQUI_SUA_CHAVE_PUBLICA
SUPABASE_SERVICE_ROLE_KEY=COLE_AQUI_SUA_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 3.4 Executar as migrations do banco

No Supabase Dashboard, acesse **SQL Editor** e execute os arquivos na ordem:

**Se o banco estiver inconsistente (erro 500 no cadastro):**
0. `supabase/migrations/000_reset.sql` — apaga tudo (somente dev)
1. `supabase/migrations/001_enums.sql` … `009_seed.sql`
2. `supabase/migrations/010_auth_fix.sql` — corrige trigger + backfill

**Se as tabelas já existem mas signup falha:**
- Execute apenas `supabase/migrations/010_auth_fix.sql`

Ordem completa (instalação limpa):

1. `supabase/migrations/001_enums.sql`
2. `supabase/migrations/002_core_tables.sql`
3. `supabase/migrations/003_course_tables.sql`
4. `supabase/migrations/004_enrollment_tables.sql`
5. `supabase/migrations/005_lgpd_tables.sql`
6. `supabase/migrations/006_audit_tables.sql`
7. `supabase/migrations/007_functions.sql`
8. `supabase/migrations/008_rls_policies.sql`
9. `supabase/migrations/009_seed.sql`
10. `supabase/migrations/010_auth_fix.sql`

> **Dica:** No SQL Editor, você pode copiar e colar o conteúdo de cada arquivo e clicar em **Run**.

#### 3.5 Configurar Supabase Auth

No Dashboard:

1. **Authentication → Settings**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
2. **Authentication → Email Templates**: personalize os e-mails conforme necessidade.
3. **Authentication → Settings → Email**: habilite "Confirm email" para segurança.

#### 3.6 Criar primeiro usuário administrador

No SQL Editor do Supabase, após criar a conta pelo fluxo de cadastro, execute:

```sql
-- Substitua pelo e-mail do usuário que deseja promover a admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';
```

---

## Executar localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Perfis de Acesso

| Perfil      | Rota Base       | Acesso                                              |
|-------------|-----------------|-----------------------------------------------------|
| Admin       | `/admin`        | Tudo — usuários, cursos, turmas, LGPD, auditoria    |
| Assistente  | `/assistente`   | Beneficiários, inscrições, relatórios operacionais  |
| Instrutor   | `/instrutor`    | Turmas próprias, alunos, presença                   |
| Beneficiário| `/beneficiario` | Perfil, cursos, inscrições, dados LGPD              |

---

## Estrutura do Projeto

```
src/
├── app/                    # Páginas (App Router)
│   ├── (public)/           # Rotas públicas
│   ├── (beneficiary)/      # Área do beneficiário
│   ├── (instructor)/       # Área do instrutor
│   ├── (assistant)/        # Área do assistente
│   └── (admin)/            # Área administrativa
├── components/             # Componentes React
│   ├── ui/                 # Button, Input, Badge, Modal, etc.
│   ├── layout/             # Header, Sidebar, DashboardLayout
│   └── lgpd/               # ConsentBanner, DataRequestForm
├── lib/
│   ├── supabase/           # Clientes browser, server, middleware
│   ├── auth/               # Session, permissions (RBAC)
│   ├── utils/              # cn (tailwind-merge)
│   └── validation/         # Schemas Zod
├── server/
│   ├── actions/            # Server Actions por domínio
│   ├── queries/            # Consultas reutilizáveis
│   └── services/           # Auditoria, LGPD, enrollment
├── types/
│   ├── database.ts         # Tipos do banco
│   └── domain.ts           # Tipos de domínio + labels
└── middleware.ts            # Proteção de rotas por papel
supabase/
└── migrations/             # 9 arquivos SQL em ordem
```

---

## Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **RBAC** em 3 camadas: UI, Server Actions, banco de dados
- **Service Role** apenas server-side para operações privilegiadas
- **Audit logs** para todas as ações sensíveis
- **Tokens** gerenciados pelo Supabase Auth (JWT + cookies HTTP-only)

---

## LGPD

| Funcionalidade         | Onde                             |
|------------------------|----------------------------------|
| Consentimento          | Cadastro + banner pós-login      |
| Política de privacidade| `/politica-de-privacidade`       |
| Solicitação de acesso  | `/beneficiario/lgpd`             |
| Solicitação de correção| `/beneficiario/lgpd`             |
| Solicitação de exclusão| `/beneficiario/lgpd`             |
| Portabilidade          | `/beneficiario/lgpd`             |
| Gestão de solicitações | `/admin/lgpd`                    |
| Logs de auditoria      | `/admin/auditoria`               |

---

## Como Testar

### Autenticação

1. Acesse http://localhost:3000
2. Clique em **Cadastrar-se** e crie uma conta de beneficiário
3. Verifique o e-mail de confirmação
4. Faça login e explore a área do beneficiário

### Fluxo Admin

1. Promova seu usuário a `admin` via SQL (instrução acima)
2. Acesse http://localhost:3000/admin
3. Crie cursos, turmas e gerencie usuários

### LGPD

1. Logado como beneficiário, acesse `/beneficiario/lgpd`
2. Crie uma solicitação de portabilidade
3. Logado como admin, acesse `/admin/lgpd` e processe a solicitação

---

## Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Verificar linting
```

---

## Deploy

Recomendado: **Vercel** (https://vercel.com)

1. Faça push do projeto para um repositório GitHub
2. Importe no Vercel
3. Configure as variáveis de ambiente
4. Atualize a URL do site nas configurações do Supabase Auth
