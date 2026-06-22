# Relatório Técnico de Entrega de Sistema
## Plataforma "Vida Plena — Gestão de Beneficiários e Capacitação"

---

**Documento:** Relatório Técnico de Desenvolvimento e Implantação  
**Versão:** 1.0  
**Data de Emissão:** Junho de 2026  
**Destinatários:** Diretoria da ONG Vida Plena · Investidores Sociais  
**Classificação:** Confidencial

---

## Sumário Executivo

O presente relatório técnico descreve, em caráter formal e acadêmico, todas as etapas de concepção, desenvolvimento e entrega da plataforma digital **Vida Plena — Gestão de Beneficiários e Capacitação**, desenvolvida para substituir integralmente os processos manuais e descentralizados adotados pela organização. A solução cobre desde o levantamento de requisitos até a implantação de mecanismos de segurança da informação e conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018), além de proporcionar uma experiência de usuário moderna, acessível e responsiva. O documento destina-se à diretoria executiva da ONG, ao corpo técnico responsável pela operação do sistema e aos investidores sociais interessados no impacto e na governança da solução.

---

## 1. LEVANTAMENTO DE REQUISITOS

### 1.1 Problemas Identificados no Cenário Inicial

Antes do desenvolvimento da plataforma, a ONG Vida Plena operava por meio de um conjunto heterogêneo e não integrado de ferramentas digitais, predominantemente planilhas eletrônicas (Microsoft Excel e Google Sheets) e grupos de comunicação instantânea (WhatsApp). Esse modelo operacional apresentava uma série de problemas estruturais que comprometiam a eficiência organizacional, a qualidade das informações e a capacidade de prestação de contas a parceiros e financiadores:

**a) Duplicidade e inconsistência de dados.** A ausência de um cadastro centralizado resultava em registros duplicados de beneficiários, com variações ortográficas nos nomes, documentos divergentes e endereços desatualizados. A impossibilidade de cruzar informações entre planilhas distintas tornava qualquer análise consolidada um processo manual demorado e sujeito a erros.

**b) Ausência de controle de acesso.** Documentos compartilhados via e-mail ou drives de armazenamento em nuvem eram acessíveis a todos os membros da equipe indistintamente, sem hierarquia de permissões. Isso expunha dados pessoais sensíveis de beneficiários a colaboradores sem necessidade legítima de acesso, configurando situação de risco perante a LGPD.

**c) Gestão manual de inscrições e presenças.** Os instrutores registravam presenças em listas físicas impressas, que posteriormente eram digitadas em planilhas por assistentes administrativos. Esse fluxo introduzia um intervalo médio de 48 a 72 horas entre a ocorrência do evento e a atualização dos registros, comprometendo a rastreabilidade e gerando retrabalho significativo.

**d) Ausência de rastreabilidade e auditoria.** Não havia registro sistemático de quem havia alterado quais informações, em qual data e por qual motivo. A ausência de logs de auditoria impossibilitava a investigação de inconsistências e contrariava boas práticas de governança de dados.

**e) Incapacidade de geração de relatórios gerenciais.** A produção de relatórios para prestação de contas a financiadores e órgãos públicos exigia um esforço manual de consolidação de múltiplas planilhas, demandando horas de trabalho que poderiam ser direcionadas à atividade-fim da organização.

**f) Não conformidade com a LGPD.** A coleta e o armazenamento de dados pessoais ocorriam sem que os titulares fossem formalmente informados sobre as finalidades de uso, sem mecanismo de consentimento explícito e sem canal estruturado para o exercício dos direitos previstos em lei.

### 1.2 Necessidades da ONG

A partir da análise do cenário descrito, foram elencadas as seguintes necessidades organizacionais prioritárias:

1. **Cadastro centralizado e padronizado** de beneficiários, com histórico de alterações e unicidade garantida por identificadores únicos.
2. **Gestão completa do ciclo de vida dos cursos**, desde a criação e publicação até o encerramento, incluindo controle de vagas, turmas, sessões e registros de presença.
3. **Portal do beneficiário** com autoatendimento, permitindo consulta ao histórico, inscrição em cursos e exercício de direitos previstos na LGPD.
4. **Portal do instrutor** com interface simplificada para gestão de turmas e lançamento de presenças.
5. **Painel administrativo** com dashboards, relatórios consolidados e ferramentas de gestão de usuários.
6. **Conformidade integral com a LGPD**, incluindo registro de consentimento, política de privacidade, solicitações de titulares e logs de auditoria.
7. **Segurança da informação** com autenticação robusta, controle de acesso baseado em papéis e proteção contra vulnerabilidades comuns.

### 1.3 Objetivos da Plataforma

Com base no levantamento realizado, foram definidos os seguintes objetivos mensuráveis para a solução:

| # | Objetivo | Indicador de Sucesso |
|---|---|---|
| O1 | Centralizar 100% dos cadastros de beneficiários | Zero registros fora do sistema |
| O2 | Automatizar o fluxo de inscrições e presenças | Eliminação de listas físicas |
| O3 | Implementar RBAC com 4 perfis de acesso | Nenhum acesso indevido a dados sensíveis |
| O4 | Garantir conformidade com LGPD | Todos os consentimentos registrados com data/hora |
| O5 | Disponibilizar dashboards em tempo real | Relatórios gerados em menos de 5 segundos |
| O6 | Garantir disponibilidade em dispositivos móveis | Interface responsiva em smartphones e tablets |
| O7 | Implementar trilha de auditoria completa | 100% das ações críticas registradas |

---

## 2. MODELAGEM DO BANCO DE DADOS

### 2.1 Entidades Criadas

O modelo de dados foi projetado sobre o paradigma relacional, utilizando o Sistema Gerenciador de Banco de Dados **PostgreSQL**, hospedado e gerenciado pela plataforma **Supabase**. A modelagem foi fundamentada nos princípios de normalização até a Terceira Forma Normal (3FN), garantindo eliminação de redundâncias e integridade referencial. As entidades principais são:

#### 2.1.1 Entidades de Identidade e Perfil

**`profiles`** — Tabela central de perfis de usuário, vinculada diretamente à tabela `auth.users` do Supabase. Armazena dados não sensíveis de identificação, como nome completo, e-mail, telefone, tipo de documento, data de nascimento, papel (`role`) e status da conta. A separação entre autenticação (`auth.users`) e perfil (`profiles`) segue o princípio da segregação de responsabilidades.

**`addresses`** — Entidade dedicada ao armazenamento de endereços, separada de `profiles` para permitir múltiplos endereços por pessoa e facilitar normalizações futuras.

**`beneficiary_profiles`** — Extensão do perfil específica para beneficiários, contendo dados socioeconômicos como escolaridade, situação de emprego, informações demográficas e renda familiar. A separação em tabela dedicada evita que dados sensíveis de beneficiários contaminem perfis de colaboradores, aplicando o princípio da minimização de dados.

**`staff_profiles`** — Extensão para colaboradores (instrutores e assistentes administrativos), com informações profissionais como especialidade e biografia.

#### 2.1.2 Entidades de Capacitação

**`courses`** — Representa os cursos oferecidos pela ONG, com título, descrição, categoria, carga horária, nível de dificuldade, requisitos, público-alvo e status do ciclo de vida (`draft`, `active`, `inactive`, `archived`).

**`classes`** — Representa turmas específicas de um curso, com datas de início e término, capacidade máxima, instrutor responsável, local e status operacional.

**`class_sessions`** — Representa cada sessão (aula) de uma turma, com data, hora, duração, assunto abordado e status.

#### 2.1.3 Entidades de Inscrições e Frequência

**`enrollments`** — Registra a inscrição de um beneficiário em uma turma, com status detalhado (pendente, confirmado, lista de espera, cancelado, concluído), data de inscrição e observações.

**`attendance_records`** — Registra a presença ou ausência de um beneficiário em cada sessão de aula, com campo para justificativa e observações do instrutor.

**`participant_status_history`** — Mantém um histórico imutável de todas as alterações de status de inscrição, com timestamp e usuário responsável pela alteração, garantindo rastreabilidade completa.

#### 2.1.4 Entidades de Conformidade LGPD

**`privacy_policies`** — Armazena as versões da Política de Privacidade, com versionamento semântico, data de vigência e conteúdo completo.

**`consents`** — Registra cada consentimento dado por um titular, vinculando-o à versão específica da política, ao tipo de consentimento, à data/hora exata da coleta, ao endereço IP e ao user agent do dispositivo.

**`data_subject_requests`** — Gerencia as solicitações dos titulares de dados (correção, exclusão, portabilidade, acesso), com status de processamento e prazo legal de atendimento.

**`data_exports`** — Controla as exportações de dados pessoais geradas a pedido dos titulares.

#### 2.1.5 Entidades de Governança

**`audit_logs`** — Registra de forma imutável todas as ações críticas realizadas no sistema, incluindo tipo de ação, tabela afetada, identificador do registro, dados anteriores e posteriores à alteração (em formato JSON), usuário responsável, IP e timestamp.

**`notifications`** — Gerencia notificações internas para os usuários da plataforma.

**`app_settings`** — Armazena configurações globais do sistema em formato chave-valor.

### 2.2 Relacionamentos

Os relacionamentos entre entidades foram modelados de forma a refletir fidedignamente as regras de negócio da organização:

| Entidade A | Cardinalidade | Entidade B | Descrição |
|---|---|---|---|
| `profiles` | 1:1 | `beneficiary_profiles` | Um perfil pode ter um perfil de beneficiário |
| `profiles` | 1:1 | `staff_profiles` | Um perfil pode ter um perfil de colaborador |
| `profiles` | 1:N | `addresses` | Um perfil pode ter múltiplos endereços |
| `courses` | 1:N | `classes` | Um curso possui múltiplas turmas |
| `classes` | 1:N | `class_sessions` | Uma turma possui múltiplas sessões |
| `classes` | N:1 | `profiles` (instrutor) | Uma turma tem um instrutor responsável |
| `profiles` (benef.) | N:N | `classes` | Via tabela `enrollments` (inscrições) |
| `enrollments` | 1:N | `participant_status_history` | Uma inscrição tem histórico de status |
| `class_sessions` | N:N | `profiles` (benef.) | Via tabela `attendance_records` |
| `profiles` | N:N | `privacy_policies` | Via tabela `consents` |
| `profiles` | 1:N | `data_subject_requests` | Um beneficiário pode ter múltiplas solicitações |
| `profiles` | 1:N | `audit_logs` | Um usuário gera múltiplos logs |

### 2.3 Justificativas da Modelagem

**a) Separação de autenticação e dados de perfil.** A tabela `profiles` foi mantida separada da tabela gerenciada pelo Supabase Auth (`auth.users`), conectando-se a ela via chave estrangeira com `ON DELETE CASCADE`. Essa separação garante que dados de autenticação (hash de senha, tokens) nunca se misturem com dados de negócio, facilitando auditorias e migrações.

**b) Uso extensivo de ENUMs PostgreSQL.** Foram criados 14 tipos `ENUM` customizados para garantir a integridade de campos categóricos (papéis, status, tipos de consentimento etc.), eliminando a possibilidade de inserção de valores não mapeados sem alteração do schema.

**c) Tabelas de histórico imutáveis.** A entidade `participant_status_history` e a tabela `audit_logs` foram projetadas como append-only — nenhum registro é modificado ou excluído após sua criação — implementando o conceito de trilha de auditoria inviolável.

**d) Soft delete e anonimização.** Em vez de exclusão física de registros de beneficiários (o que inviabilizaria relatórios históricos e auditorias), a plataforma implementa anonimização reversível: dados pessoais são substituídos por valores genéricos (`[DADOS EXCLUÍDOS]`), preservando os registros operacionais anonimizados, em conformidade com o art. 18, inciso VI da LGPD.

**e) Indexes estratégicos.** Foram criados índices nas colunas de maior volume de consultas — `profile_id`, `class_id`, `course_id`, `status`, `created_at` — garantindo performance adequada mesmo com o crescimento do volume de dados.

### 2.4 Benefícios para Organização dos Dados

A modelagem adotada proporciona os seguintes benefícios operacionais:

- **Unicidade garantida:** Cada beneficiário possui um único registro identificado por UUID, eliminando duplicatas.
- **Integridade referencial:** Foreign Keys com constraints previnem a criação de inscrições para turmas ou beneficiários inexistentes.
- **Rastreabilidade completa:** Qualquer alteração em dados críticos é registrada na trilha de auditoria.
- **Consultas analíticas eficientes:** A estrutura normalizada permite a geração de relatórios complexos via funções PostgreSQL nativas.
- **Escalabilidade:** O modelo suporta crescimento horizontal do volume de beneficiários e cursos sem necessidade de reestruturação.

---

## 3. MEDIDAS DE SEGURANÇA IMPLEMENTADAS

### 3.1 Autenticação por E-mail e Senha

A autenticação de usuários é integralmente delegada ao **Supabase Auth**, serviço de identidade gerenciado que implementa o protocolo OAuth 2.0 e OpenID Connect. O fluxo de autenticação compreende as seguintes etapas:

1. O usuário submete suas credenciais por meio de formulário com transmissão exclusiva via HTTPS (TLS 1.2+).
2. O Supabase Auth verifica a existência do e-mail na base de dados e compara o hash da senha fornecida com o hash armazenado.
3. Em caso de sucesso, são emitidos um **Access Token** (JWT com validade de 3.600 segundos) e um **Refresh Token** de longa duração.
4. Os tokens são armazenados em cookies HttpOnly, prevenindo acesso por JavaScript (mitigação de XSS).
5. A sessão é renovada automaticamente pelo middleware do Next.js antes de cada requisição.

O sistema inclui ainda confirmação de e-mail obrigatória para ativação de novos cadastros, prevenindo a criação de contas com endereços inválidos ou fraudulentos.

### 3.2 Criptografia de Senhas Utilizando Hash Seguro

As senhas nunca são armazenadas em texto claro na base de dados. O Supabase Auth utiliza o algoritmo **bcrypt** com fator de custo adaptativo para geração do hash das senhas. O bcrypt incorpora:

- **Salt aleatório por senha:** Cada senha recebe um salt único gerado aleatoriamente, tornando ataques de rainbow table ineficazes.
- **Fator de custo adaptativo:** O número de iterações pode ser aumentado à medida que o poder computacional cresce, mantendo a resistência a ataques de força bruta.
- **Irreversibilidade:** O hash bcrypt é uma função de mão única; mesmo com acesso ao banco de dados, não é possível recuperar a senha original.

A plataforma não implementa lógica própria de hash de senhas, delegando esta responsabilidade ao Supabase Auth, que segue as melhores práticas da indústria e recebe atualizações regulares de segurança.

### 3.3 Controle de Acesso Baseado em Perfis (RBAC)

O sistema implementa **Role-Based Access Control (RBAC)** em três camadas independentes e complementares:

#### Camada 1 — Interface de usuário (Frontend)
Os componentes de navegação e os elementos interativos da interface são renderizados condicionalmente com base no papel (`role`) do usuário autenticado. Usuários sem as permissões necessárias simplesmente não visualizam as opções de menu, botões de ação ou seções restritas.

#### Camada 2 — Lógica de aplicação (Server Actions)
Cada Server Action (função de mutação executada no servidor) inicia com uma verificação explícita de autenticação e autorização:

```typescript
// Exemplo de guarda de autorização em Server Action
const user = await getAuthUser()
if (!user) return { success: false, error: 'Não autenticado.' }
if (!hasPermission(user.role, 'manage_courses')) {
  return { success: false, error: 'Acesso não autorizado.' }
}
```

O módulo `permissions.ts` centraliza a matriz de permissões, definindo quais papéis podem executar cada operação. A verificação ocorre no servidor, impossibilitando sua contorção por manipulação do estado do cliente.

#### Camada 3 — Banco de dados (Row Level Security)
A camada mais profunda de proteção é implementada diretamente no PostgreSQL por meio de **Row Level Security (RLS)**. Cada tabela possui políticas RLS que determinam quais linhas cada usuário pode `SELECT`, `INSERT`, `UPDATE` ou `DELETE`, com base no `auth.uid()` e no papel do usuário autenticado.

Exemplos de políticas implementadas:
- Beneficiários podem ler e atualizar apenas seus próprios registros de perfil.
- Instrutores podem visualizar apenas os beneficiários inscritos em suas turmas.
- Administradores e assistentes têm acesso irrestrito às operações de sua competência.
- A tabela `audit_logs` possui política que permite apenas inserção — nenhum usuário pode alterar ou excluir registros de auditoria.

Essa arquitetura de três camadas garante que, mesmo em um cenário hipotético de comprometimento da camada de aplicação, o banco de dados rejeitará operações não autorizadas.

### 3.4 Proteção Contra Acessos Não Autorizados

O arquivo `middleware.ts` do Next.js atua como interceptador de todas as requisições à aplicação, executando as seguintes verificações antes de renderizar qualquer página:

1. **Validação de sessão:** Verifica a existência e validade do token de sessão nos cookies.
2. **Redirecionamento não autenticado:** Requisições sem sessão válida a rotas protegidas são redirecionadas para `/login`.
3. **Verificação de papel:** Usuários autenticados tentando acessar áreas fora de sua competência (ex.: um beneficiário tentando acessar `/admin`) são redirecionados ao seu dashboard correspondente.
4. **Renovação proativa de sessão:** O middleware renova o token de acesso antes de cada resposta, prevenindo expiração inesperada durante o uso.

```typescript
// Regras de roteamento por papel (middleware.ts)
if (pathname.startsWith('/admin') && userRole !== 'admin') {
  return NextResponse.redirect(new URL(getDashboardUrl(userRole), req.url))
}
```

### 3.5 Controle de Sessão

O gerenciamento de sessão segue as melhores práticas de segurança:

- **Tokens em cookies HttpOnly e Secure:** Os tokens JWT não são acessíveis por JavaScript, mitigando ataques XSS.
- **Atributo SameSite=Lax:** Previne ataques Cross-Site Request Forgery (CSRF) em navegadores modernos.
- **Expiração do Access Token em 1 hora:** Limita a janela de exposição em caso de comprometimento do token.
- **Refresh Token de uso único:** Cada renovação de sessão invalida o Refresh Token anterior.
- **Logout com invalidação de sessão:** A ação de logout revoga o token no servidor, impedindo sua reutilização mesmo que seja interceptado.

### 3.6 Proteção Contra SQL Injection

A plataforma não constrói queries SQL por concatenação de strings em nenhum ponto do código. Todas as interações com o banco de dados são realizadas exclusivamente por meio do **Supabase JavaScript Client**, que utiliza internamente a interface **PostgREST** com parâmetros vinculados (_parameterized queries_). Esse mecanismo garante que entradas do usuário sejam sempre tratadas como dados, nunca como parte da instrução SQL, eliminando a superfície de ataque para injeção de SQL.

Adicionalmente, as funções PostgreSQL definidas no banco utilizam `SECURITY DEFINER` com validação explícita de parâmetros, e as políticas RLS atuam como segunda barreira contra tentativas de acesso indevido.

### 3.7 Proteção Contra Cross-Site Scripting (XSS)

A proteção contra XSS é garantida em múltiplas camadas:

**a) Escape automático pelo React/Next.js.** O React, por design, escapa automaticamente todo conteúdo dinâmico renderizado via JSX antes de inseri-lo no DOM, prevenindo a injeção de scripts maliciosos via dados do banco de dados ou inputs de usuário.

**b) Content Security Policy (CSP).** O Next.js adiciona headers de segurança que restringem as fontes de scripts, estilos e recursos externos permitidos, bloqueando a execução de scripts injetados.

**c) Tokens em cookies HttpOnly.** Mesmo que um ataque XSS bem-sucedido acontecesse, o código JavaScript malicioso não teria acesso aos tokens de autenticação armazenados em cookies HttpOnly.

**d) Ausência de `dangerouslySetInnerHTML`.** Nenhum componente da aplicação utiliza a propriedade `dangerouslySetInnerHTML` do React, que desabilitaria o escape automático.

### 3.8 Sanitização de Entradas de Usuários

Toda entrada de usuário é validada e sanitizada em dois momentos:

**No cliente (UX imediata):** Os formulários utilizam a biblioteca **React Hook Form** integrada com schemas **Zod** para validação declarativa e tipada. Os schemas definem:
- Tipo de dado esperado (string, number, date, enum)
- Comprimento mínimo e máximo
- Formatos obrigatórios (e-mail, CPF, telefone via regex)
- Valores permitidos em campos categóricos (enums)

**No servidor (segurança definitiva):** Cada Server Action revalida os dados recebidos contra o mesmo schema Zod antes de qualquer operação de banco de dados, independentemente da validação do cliente. Essa abordagem garante que mesmo requisições maliciosas enviadas diretamente à API (bypassando o formulário) sejam rejeitadas.

```typescript
// Validação com Zod no servidor
const parsed = enrollmentSchema.safeParse(formData)
if (!parsed.success) {
  return { success: false, error: parsed.error.flatten().fieldErrors }
}
```

### 3.9 Utilização de Variáveis de Ambiente para Dados Sensíveis

Nenhuma credencial sensível está presente no código-fonte versionado. Todos os dados confidenciais são gerenciados por variáveis de ambiente:

| Variável | Propósito | Exposição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Pública (somente leitura) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (RLS protege) | Pública (limitada por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (admin) | Somente servidor |

A `SUPABASE_SERVICE_ROLE_KEY` — que possui acesso irrestrito ao banco, contornando o RLS — é utilizada exclusivamente no servidor para operações privilegiadas (como registro de logs de auditoria), nunca sendo exposta ao cliente. O arquivo `.env.local` está incluído no `.gitignore`, prevenindo commit acidental de segredos.

### 3.10 Auditoria de Ações Críticas

O sistema implementa uma trilha de auditoria abrangente por meio da tabela `audit_logs` e do serviço `AuditService`. Todas as ações de alto impacto são registradas automaticamente:

**Ações auditadas:**
- Login e logout de usuários
- Criação, edição e exclusão de perfis de beneficiários
- Alterações de papel (role) de qualquer usuário
- Criação e cancelamento de inscrições em cursos
- Processamento de solicitações LGPD (correção, exclusão, portabilidade)
- Anonimização de dados de beneficiários
- Alterações nas configurações do sistema
- Geração de exportações de dados

Cada entrada de log contém: identificador do usuário responsável, tipo de ação, tabela afetada, identificador do registro, estado anterior dos dados (JSONB), estado posterior dos dados (JSONB), endereço IP e timestamp UTC com precisão de milissegundos. O serviço de auditoria utiliza a chave `service_role` para garantir que os logs sejam gravados mesmo em cenários de falha parcial, e as políticas RLS impedem qualquer modificação ou exclusão posterior dos registros.

### 3.11 Backup e Recuperação de Dados

A estratégia de backup é implementada em múltiplas camadas, aproveitando os recursos nativos da infraestrutura Supabase:

**a) Backups automáticos diários** realizados pela Supabase com retenção configurável (mínimo 7 dias no plano gratuito, até 30 dias nos planos pagos). Os backups são armazenados em infraestrutura geograficamente separada do banco de dados principal.

**b) Replicação contínua (Point-in-Time Recovery — PITR)** nos planos Pro e acima, permitindo restauração do banco de dados para qualquer momento nos últimos 7 dias, com granularidade de segundos.

**c) Exportação sob demanda** via Supabase Dashboard, possibilitando downloads manuais do schema e dos dados em formato SQL.

**d) Soft delete e anonimização controlada** eliminam o risco de perda acidental de dados históricos, pois registros nunca são fisicamente excluídos — apenas anonimizados quando exigido pela LGPD.

---

## 4. MEDIDAS DE CONFORMIDADE COM A LGPD

A plataforma foi projetada desde sua concepção (_privacy by design_ e _privacy by default_) para assegurar a conformidade integral com a Lei nº 13.709/2018 (LGPD) e com as orientações da Autoridade Nacional de Proteção de Dados (ANPD).

### 4.1 Consentimento Explícito

O consentimento para coleta e tratamento de dados pessoais é obtido de forma granular, específica e informada, em conformidade com o art. 8º da LGPD. O formulário de cadastro apresenta ao titular quatro caixas de seleção independentes, cada uma referente a uma finalidade distinta:

1. **Política de Privacidade** — Consentimento obrigatório para utilização da plataforma.
2. **Tratamento de dados para gestão de benefícios** — Consentimento obrigatório para operação dos serviços da ONG.
3. **Comunicações institucionais** — Consentimento opcional para envio de e-mails e notificações.
4. **Uso de imagem** — Consentimento opcional para uso de fotografias e imagens em materiais de comunicação.

O sistema impede o prosseguimento do cadastro sem a marcação dos consentimentos obrigatórios, mas os consentimentos opcionais podem ser deixados em branco sem prejuízo ao acesso à plataforma.

### 4.2 Registro da Data e Hora do Consentimento

Cada consentimento dado pelo titular é registrado na tabela `consents` com as seguintes informações:

- `consented_at`: Timestamp UTC com precisão de milissegundos
- `ip_address`: Endereço IP do dispositivo no momento do consentimento
- `user_agent`: Identificação do navegador e sistema operacional
- `policy_version_id`: Referência à versão exata da política aceita
- `consent_type`: Tipo de consentimento (privacidade, tratamento, comunicação, imagem)

Esse registro fornece prova documental do consentimento em caso de contestação ou fiscalização pela ANPD, atendendo ao princípio da responsabilização e prestação de contas (art. 6º, X, LGPD).

Adicionalmente, o sistema verifica automaticamente se o usuário aceitou a versão vigente da política de privacidade a cada login. Caso uma nova versão tenha sido publicada, o beneficiário é informado e solicitado a revisar e aceitar os novos termos antes de acessar a plataforma.

### 4.3 Política de Privacidade

A plataforma disponibiliza a Política de Privacidade de forma acessível, permanente e sem necessidade de autenticação, na rota `/politica-de-privacidade`. O documento descreve em linguagem clara e acessível:

- Quais dados são coletados e por quê
- Como os dados são utilizados e armazenados
- Com quem os dados podem ser compartilhados
- Por quanto tempo os dados são retidos
- Como exercer os direitos previstos na LGPD
- Dados de contato do controlador e do encarregado (DPO)

O sistema de versionamento da política permite que a organização atualize o documento e registre automaticamente quais usuários aceitaram qual versão, mantendo rastreabilidade histórica dos consentimentos.

### 4.4 Princípio da Finalidade

Conforme o art. 6º, inciso I da LGPD, os dados pessoais coletados são utilizados exclusivamente para as finalidades explicitamente declaradas na Política de Privacidade e consentidas pelo titular. A modelagem do banco de dados reforça esse princípio:

- Dados de contato (e-mail, telefone) são utilizados apenas para comunicações operacionais relacionadas aos cursos e à conta.
- Dados socioeconômicos (`beneficiary_profiles`) são coletados exclusivamente para fins de relatórios de impacto social e elegibilidade a programas, sendo visíveis apenas a administradores e assistentes.
- Nenhum campo de dados é coletado sem finalidade documentada no schema e na política de privacidade.

### 4.5 Princípio da Necessidade

Os dados coletados são limitados ao mínimo necessário para a prestação dos serviços da ONG (art. 6º, III, LGPD). A separação em tabelas especializadas (`beneficiary_profiles`, `staff_profiles`) implementa o conceito de minimização de dados em nível de banco de dados — cada papel de usuário acessa apenas os dados pertinentes à sua função, sem acesso a informações desnecessárias.

O campo `document_number` (número de CPF ou RG), por exemplo, é armazenado criptografado em repouso (pgcrypto) e acessível apenas a administradores com justificativa documentada.

### 4.6 Princípio da Transparência

Além da Política de Privacidade pública, a área do beneficiário (`/beneficiario/lgpd`) apresenta de forma centralizada:

- Quais dados pessoais estão armazenados sobre o titular
- Quais consentimentos foram dados, com data e tipo
- O status de cada solicitação LGPD enviada
- Histórico de acessos e alterações relevantes nos próprios dados

Essa transparência ativa — ir além da divulgação passiva de políticas — está alinhada às melhores práticas internacionais de privacidade (GDPR, ISO/IEC 29100).

### 4.7 Direito de Correção de Dados

O titular pode solicitar a correção de dados pessoais imprecisos ou desatualizados por dois meios:

1. **Autoatendimento direto:** A tela de edição de perfil (`/beneficiario/perfil`) permite ao próprio beneficiário atualizar seus dados cadastrais básicos.
2. **Solicitação formal:** Para dados que requerem verificação documental (CPF, data de nascimento), o beneficiário submete uma Solicitação de Titulares de Dados do tipo `correction` via formulário na plataforma. A solicitação é registrada, encaminhada para análise e processada por um administrador, com notificação ao titular ao final do processo.

O prazo de atendimento está definido em 15 dias úteis, em conformidade com as diretrizes da ANPD.

### 4.8 Direito de Exclusão de Dados

O beneficiário pode solicitar a exclusão de seus dados pessoais por meio da área LGPD da plataforma. O processo implementa as salvaguardas necessárias:

1. O titular submete uma solicitação do tipo `deletion`.
2. O administrador analisa a solicitação, verificando se não há impedimento legal (ex.: obrigação de manutenção de registros por período determinado).
3. Aprovada a solicitação, a função `anonymize_beneficiary_data()` é executada pelo sistema com uso da chave `service_role`.
4. Todos os campos de dados pessoais do beneficiário são substituídos por valores anonimizados (`[DADOS EXCLUÍDOS]`, `[CPF REMOVIDO]`), enquanto os registros operacionais (inscrições, presenças, histórico) são mantidos de forma anônima para fins de relatórios históricos.
5. A ação é registrada na trilha de auditoria.

Essa abordagem equilibra o direito à exclusão do titular com a obrigação legal da ONG de manter registros de suas atividades.

### 4.9 Direito de Portabilidade

O titular pode solicitar a exportação de todos os seus dados pessoais em formato legível por máquina (JSON) e estruturado por meio de uma solicitação do tipo `portability`. O sistema executa a função PostgreSQL `generate_beneficiary_export()`, que consolida todos os dados do beneficiário em um arquivo JSON estruturado, incluindo:

- Dados cadastrais e de perfil
- Histórico de inscrições e presenças
- Registro de consentimentos
- Histórico de solicitações LGPD

O arquivo gerado é disponibilizado para download por um período limitado de 72 horas, após o qual é excluído do armazenamento temporário. A ação é registrada na trilha de auditoria.

### 4.10 Controle de Acesso aos Dados Pessoais

O acesso a dados pessoais é estritamente controlado pelo sistema RBAC descrito na seção 3.3, com as seguintes diretrizes específicas para dados sensíveis:

| Dado Pessoal | Beneficiário (próprio) | Instrutor | Assistente | Administrador |
|---|---|---|---|---|
| Nome completo | Leitura/Escrita | Leitura (turma) | Leitura/Escrita | Leitura/Escrita |
| E-mail e telefone | Leitura/Escrita | Não | Leitura | Leitura/Escrita |
| CPF/RG | Leitura | Não | Não | Leitura/Escrita |
| Dados socioeconômicos | Leitura | Não | Leitura restrita | Leitura/Escrita |
| Histórico de inscrições | Leitura | Leitura (turma) | Leitura | Leitura/Escrita |
| Logs de auditoria | Não | Não | Não | Leitura |

### 4.11 Registro de Solicitações dos Titulares

Todas as solicitações de titulares de dados são registradas na tabela `data_subject_requests` com as seguintes informações:

- Tipo de solicitação (`correction`, `deletion`, `portability`, `access`, `consent_revocation`)
- Data e hora de abertura
- Status atual do processamento
- Identificador do operador que processou a solicitação
- Data de conclusão
- Notas do processamento

O sistema exibe para o titular o status atual de sua solicitação em tempo real, garantindo transparência sobre o andamento do processo. O administrador recebe alertas sobre solicitações pendentes no dashboard e pode filtrá-las por tipo e status para gestão eficiente do backlog.

---

## 5. EXPERIÊNCIA DO USUÁRIO

### 5.1 Design Responsivo

A interface foi desenvolvida com a metodologia **Mobile First**, garantindo que a experiência em dispositivos de menor porte seja priorizada e progressivamente aprimorada para telas maiores. O sistema de breakpoints adotado cobre quatro classes de dispositivos:

| Classe | Breakpoint | Exemplos |
|---|---|---|
| Mobile | < 640px | Smartphones |
| Tablet | 640px – 1024px | Tablets, phablets |
| Notebook | 1024px – 1280px | Laptops |
| Desktop | > 1280px (até 1600px máximo) | Desktops, monitores widescreen |

O framework **Tailwind CSS** provê um sistema de grid e flex responsivo que adapta automaticamente a disposição dos elementos conforme o viewport, sem a necessidade de media queries customizadas para a maioria dos casos.

### 5.2 Acessibilidade

A plataforma foi desenvolvida em conformidade com as diretrizes **WCAG 2.1 nível AA** (Web Content Accessibility Guidelines), garantindo acessibilidade a usuários com diferentes capacidades:

**Semântica e estrutura:**
- Uso de elementos HTML semânticos (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`)
- Hierarquia de headings (`h1`–`h6`) respeitada em todas as páginas
- Listas e tabelas com marcação correta
- Links com texto descritivo (sem "clique aqui")

**Atributos ARIA:**
- `aria-label` em todos os botões de ícone sem texto visível
- `aria-expanded` e `aria-haspopup` em menus dropdown
- `aria-current="page"` no item de navegação ativo
- `aria-invalid` e `aria-describedby` em campos com erro
- `aria-live="assertive"` para mensagens de erro crítico
- `aria-live="polite"` para notificações informativas

**Navegação por teclado:**
- Todos os elementos interativos são focáveis via Tab
- Atalho "Ir para o conteúdo principal" visível no foco (skip link)
- Modais capturam o foco ao abrir e retornam ao elemento disparador ao fechar
- Tecla Escape fecha modais e drawers

**Contraste e legibilidade:**
- Todos os pares de cor texto/fundo atendem ao contraste mínimo de 4,5:1 (WCAG AA)
- Tamanhos de fonte mínimos de 12px, com base de 14px para o corpo do texto
- Suporte a zoom de até 200% sem quebra de layout

**Screen readers:**
- Ícones decorativos marcados com `aria-hidden="true"`
- `role="status"` e `aria-label` em componentes de carregamento
- Toasts de notificação com `aria-live` e `role="alert"`
- Tabelas com `scope="col"` e `scope="row"` nos cabeçalhos

### 5.3 Interface Intuitiva

O design system foi construído com inspiração em produtos de referência do mercado (Linear, Stripe, Vercel, Supabase), priorizando a familiaridade visual para reduzir a curva de aprendizado:

- **Consistência visual:** Todos os componentes (botões, inputs, cards, badges) seguem um sistema de variantes padronizadas, garantindo previsibilidade ao usuário.
- **Hierarquia visual clara:** O uso controlado de tamanho tipográfico, peso e cor direciona o olhar do usuário para as informações e ações mais importantes.
- **Estados visuais explícitos:** Todos os elementos interativos possuem estados visuais distintos para hover, foco, ativo, carregando e desabilitado.
- **Iconografia consistente:** A biblioteca Lucide React fornece ícones de estilo uniforme em todos os contextos da aplicação.

### 5.4 Navegação Simplificada

A arquitetura de navegação foi projetada para minimizar o número de cliques necessários para atingir qualquer funcionalidade:

- **Sidebar contextual:** Cada perfil de usuário visualiza apenas os itens de menu relevantes à sua função, reduzindo a complexidade cognitiva.
- **Breadcrumbs:** Páginas de nível profundo apresentam trilha de navegação para orientação e retorno rápido.
- **Ações rápidas no dashboard:** O painel inicial de cada perfil apresenta atalhos para as tarefas mais frequentes.
- **Sidebar colapsável:** O administrador pode recolher o menu lateral para ampliar a área de conteúdo, com tooltip de identificação ao passar o cursor.

### 5.5 Feedback Visual para Ações

Toda ação do usuário recebe resposta visual imediata:

**Estados de carregamento:**
- Botões exibem spinner animado e texto alternativo ("Salvando...") durante o processamento, prevenindo cliques duplicados.
- Skeleton Loading — esqueletos animados na forma do conteúdo — são exibidos durante o carregamento inicial de listas e dashboards, eliminando saltos de layout (CLS).

**Notificações toast:**
- Toasts de sucesso, erro, aviso e informação são exibidos no canto inferior direito da tela, com animação de entrada spring.
- Desaparecem automaticamente (4–6 segundos) ou podem ser dispensados manualmente.
- Toasts de carregamento permanecem visíveis até a conclusão da operação assíncrona.

**Empty states:**
- Listas vazias são apresentadas com ilustrações contextuais e chamadas para ação, nunca com espaços em branco ou mensagens genéricas.

**Estados de erro:**
- Campos de formulário com erro exibem mensagem descritiva abaixo do campo com ícone e cor semântica.
- Alertas de erro são exibidos no topo do formulário para erros de sistema.

### 5.6 Adaptação para Dispositivos Móveis

Além do design responsivo geral, a plataforma implementa adaptações específicas para a experiência mobile:

- **Sidebar como drawer:** Em dispositivos móveis, o menu lateral é substituído por um painel deslizante ativado pelo botão hambúrguer no header, com backdrop semitransparente e fechamento por gesto ou toque externo.
- **Modais como sheets:** Modais são apresentados como painéis deslizantes a partir da base da tela em smartphones, seguindo o padrão bottom sheet.
- **Áreas de toque generosas:** Todos os elementos interativos possuem altura mínima de 44px (recomendação Apple/Google) para facilitar o toque.
- **Suporte a Safe Areas:** Variáveis CSS `env(safe-area-inset-*)` garantem que a interface não seja ocultada por entalhes de câmera ou barras de navegação do sistema.
- **Formulários otimizados:** Campos de data, telefone e CPF utilizam tipos de input HTML corretos para acionar teclados específicos no sistema operacional móvel.

---

## 6. DASHBOARDS E INDICADORES

### 6.1 Total de Beneficiários

O dashboard administrativo exibe em tempo real o número total de beneficiários com conta ativa na plataforma, obtido por consulta à tabela `profiles` filtrada pelo papel `beneficiary` e status `active`. O indicador é acompanhado de um delta que mostra o crescimento nos últimos 30 dias (`new_beneficiaries_30d`), permitindo acompanhar a evolução do alcance da ONG ao longo do tempo.

A função PostgreSQL `get_admin_dashboard_metrics()`, executada no servidor a cada carregamento do dashboard, consolida todos os indicadores em uma única chamada ao banco, otimizando a performance.

### 6.2 Total de Cursos

O painel exibe a contagem de cursos por status (`draft`, `active`, `inactive`, `archived`), permitindo que o administrador visualize rapidamente o portfólio ativo da ONG. O detalhamento por categoria (profissionalizante, inclusão digital, oficina, evento comunitário) é disponível na tela de relatórios, onde é possível filtrar e exportar os dados.

### 6.3 Total de Inscrições

O indicador de inscrições consolida o número total de registros na tabela `enrollments` com status `confirmed` ou `pending`, refletindo a demanda ativa pelos serviços da ONG. O dashboard do assistente administrativo oferece visão adicional das inscrições em lista de espera, permitindo gestão proativa das vagas.

### 6.4 Taxa de Conclusão

A taxa de conclusão é calculada pela razão entre o número de inscrições com status `completed` e o número total de inscrições em turmas já encerradas (`class.status = 'completed'`). Esse indicador é fundamental para demonstrar a efetividade dos programas da ONG a financiadores e patrocinadores.

O sistema de registro de presenças (`attendance_records`) alimenta ainda a taxa de frequência média por turma, indicador calculado como a proporção de sessões com status `present` sobre o total de sessões registradas por beneficiário, disponível nos relatórios do instrutor e do administrador.

### 6.5 Relatórios Gerenciais

A plataforma disponibiliza os seguintes relatórios consolidados, acessíveis na área `/admin/relatorios`:

- **Relatório de Beneficiários:** Lista completa com dados cadastrais, status, data de cadastro e filtros por período, localização e faixa etária.
- **Relatório de Inscrições por Curso:** Número de inscritos por curso e turma, taxa de ocupação e status.
- **Relatório de Frequência:** Taxa de presença por turma, por beneficiário e por período.
- **Relatório de Solicitações LGPD:** Volume e tempo médio de atendimento das solicitações dos titulares.
- **Relatório de Auditoria:** Log completo de ações críticas com filtros por usuário, tipo de ação e período.

### 6.6 Apoio à Tomada de Decisão

A combinação de dashboards em tempo real e relatórios históricos fornece à liderança da ONG informações estratégicas para:

- **Alocação de recursos:** Identificar cursos com alta demanda reprimida (lista de espera) para abertura de novas turmas.
- **Avaliação de impacto:** Medir a evolução do número de beneficiários atendidos e a taxa de conclusão ao longo dos ciclos de financiamento.
- **Prestação de contas:** Gerar relatórios formatados para relatórios de impacto social exigidos por financiadores e parceiros institucionais.
- **Identificação de gargalos:** Visualizar cursos com alta taxa de cancelamento ou baixa frequência para intervenção pedagógica ou logística.
- **Conformidade regulatória:** Monitorar o volume de solicitações LGPD e o tempo de atendimento para garantir conformidade com os prazos legais.

---

## 7. IMPACTO ORGANIZACIONAL

### 7.1 Redução de Retrabalho

A automação dos fluxos de inscrição, confirmação e lançamento de presenças elimina as etapas manuais de transcrição de dados entre sistemas. Estimativas baseadas no tempo médio gasto pela equipe anterior sugerem uma redução de aproximadamente **8 a 12 horas semanais** de trabalho manual repetitivo, que podem ser redirecionadas para atividades de maior valor social, como atendimento direto aos beneficiários e desenvolvimento de novos programas.

O autoatendimento pelo portal do beneficiário (atualização de perfil, consulta de histórico, solicitações LGPD) elimina a necessidade de intermediação administrativa em operações rotineiras, reduzindo o volume de solicitações tratadas individualmente pela equipe.

### 7.2 Eliminação de Planilhas Paralelas

A centralização do cadastro de beneficiários em um banco de dados único e relacional elimina o principal problema operacional anterior: a proliferação de planilhas desatualizadas e conflitantes. Com a implantação da plataforma:

- Existe apenas **uma fonte de verdade** para cada dado: o banco de dados PostgreSQL.
- Qualquer alteração realizada por qualquer usuário autorizado é imediatamente visível a todos os demais usuários do sistema.
- O versionamento histórico (`participant_status_history`, `audit_logs`) preserva um registro completo das alterações, substituindo com vantagem o controle de versões manual de planilhas.

### 7.3 Centralização de Informações

Anteriormente, informações sobre um beneficiário estavam dispersas em: planilha de cadastro, planilha de inscrições, lista de presença física, grupo de WhatsApp e arquivos de documentos. Na plataforma Vida Plena, todas essas informações estão consolidadas em um único perfil, acessível de forma segura e controlada por qualquer colaborador autorizado, de qualquer dispositivo, sem necessidade de envio de arquivos por e-mail ou aplicativos de mensagens.

Essa centralização reduz drasticamente o risco de decisões baseadas em informações desatualizadas ou incompletas.

### 7.4 Melhoria da Gestão dos Cursos

O sistema de gestão de cursos e turmas proporciona ganhos operacionais significativos:

- **Controle automático de vagas:** O sistema verifica a capacidade da turma antes de confirmar uma inscrição, movendo automaticamente o inscrito para a lista de espera quando necessário — eliminando situações de superlotação.
- **Confirmação por e-mail:** O Supabase Auth envia confirmações automáticas de e-mail em momentos-chave do ciclo de vida do usuário (cadastro, inscrição, recuperação de senha).
- **Gestão de sessões:** O instrutor pode registrar a presença de todos os alunos em uma única operação (_bulk attendance_), reduzindo o tempo gasto nessa tarefa de horas para minutos.
- **Visibilidade do progresso:** Beneficiários acompanham em tempo real sua taxa de presença e status de conclusão de cada curso inscrito.

### 7.5 Facilitação de Auditorias

A trilha de auditoria implementada transforma a capacidade de resposta da ONG a auditorias internas, externas e fiscalizações regulatórias:

- Qualquer questionamento sobre quando um dado foi alterado, por quem e qual era o valor anterior pode ser respondido em segundos por meio da consulta à tabela `audit_logs`.
- As solicitações LGPD possuem registro completo de seu ciclo de vida, demonstrando conformidade com os prazos legais.
- O histórico de consentimentos comprova que os dados foram coletados com base legal válida.
- Relatórios de impacto social com dados quantitativos consolidados podem ser gerados sob demanda para prestação de contas a financiadores.

### 7.6 Aumento da Confiabilidade dos Dados

A qualidade dos dados é garantida por múltiplas camadas técnicas:

- **Validação na entrada:** Schemas Zod garantem que apenas dados no formato correto entrem no banco de dados.
- **Constraints no banco:** NOT NULL, UNIQUE, CHECK e FOREIGN KEY constraints no PostgreSQL impedem inconsistências no nível do banco de dados.
- **ENUMs tipados:** Valores categóricos (status, papéis, tipos) são restritos a conjuntos predefinidos, eliminando variações ortográficas e valores inválidos.
- **Campos auditados:** A presença de `created_at` e `updated_at` com atualização automática via trigger em todas as tabelas permite rastrear a vida útil de qualquer registro.
- **Transações atômicas:** Operações que afetam múltiplas tabelas (como criação de inscrição + registro de histórico) são executadas em transações atômicas, garantindo que o banco nunca fique em estado inconsistente.

---

## 8. CONCLUSÃO

A plataforma **Vida Plena — Gestão de Beneficiários e Capacitação** representa uma transformação estrutural na capacidade operacional, informacional e de governança da ONG. O sistema entregue não é apenas uma ferramenta de gestão, mas uma infraestrutura digital completa, segura e escalável, construída sobre os princípios da engenharia de software moderna e do direito à proteção de dados.

Do ponto de vista técnico, a adoção do stack **Next.js 15 / React / TypeScript / Tailwind CSS / PostgreSQL / Supabase** garantiu uma plataforma com excelente desempenho, tipagem estática que previne erros em tempo de execução, e uma arquitetura de componentes reutilizáveis que facilita a manutenção e evolução futura. A utilização do App Router do Next.js com Server Components e Server Actions proporciona uma separação clara entre lógica de servidor e cliente, ao mesmo tempo que elimina a necessidade de uma camada de API REST separada, simplificando a arquitetura e reduzindo a superfície de ataque.

Do ponto de vista da segurança da informação, foram implementadas onze medidas distintas e complementares, abrangendo autenticação, autorização, proteção de dados em trânsito e em repouso, defesa contra as principais vulnerabilidades web (OWASP Top 10) e trilha de auditoria completa. A arquitetura de segurança em três camadas — interface, aplicação e banco de dados — garante que nenhum ponto único de falha comprometa a integridade ou a confidencialidade dos dados.

Do ponto de vista da conformidade com a LGPD, a plataforma incorpora os princípios de privacidade por design e privacidade por padrão desde sua concepção. Mecanismos de consentimento granular, registro comprovado de aceite, exercício simplificado dos direitos dos titulares (correção, exclusão, portabilidade), controle de acesso rigoroso e registro de solicitações tornam a ONG capaz de responder a qualquer questionamento de titulares ou fiscalização da ANPD com evidências documentais irrefutáveis.

Do ponto de vista da experiência do usuário, a interface foi elevada ao padrão de produtos digitais de mercado, com design system consolidado, acessibilidade WCAG 2.1 AA, responsividade completa para quatro classes de dispositivos e microinterações que proporcionam feedback imediato e claro ao usuário. Esses atributos são fundamentais para a adoção efetiva da plataforma por uma base de usuários diversa, que inclui tanto colaboradores experientes em tecnologia quanto beneficiários com menor familiaridade digital.

Do ponto de vista do impacto organizacional, a solução viabiliza uma gestão baseada em dados — substituindo decisões intuitivas por análises fundamentadas em indicadores precisos e atualizados em tempo real. A capacidade de demonstrar o impacto social com números precisos (beneficiários atendidos, taxa de conclusão de cursos, histórico de crescimento) fortalece a credibilidade da ONG perante financiadores, parceiros e a comunidade atendida.

Em síntese, a plataforma Vida Plena atende integralmente aos requisitos levantados, resolve os problemas operacionais identificados no cenário inicial, e estabelece uma base tecnológica sólida para que a ONG possa crescer de forma sustentável, governada e responsável nos próximos anos — com a confiança de que os dados de seus beneficiários estão protegidos, seus processos estão documentados e sua conformidade legal está assegurada.

---

## Anexo A — Resumo Técnico da Arquitetura

| Camada | Tecnologia | Versão | Propósito |
|---|---|---|---|
| Framework Web | Next.js (App Router) | 15.x | SSR, Server Actions, roteamento |
| Linguagem | TypeScript | 5.x | Tipagem estática, segurança em tempo de compilação |
| UI Library | React | 18.x | Componentes de interface |
| Estilização | Tailwind CSS | 3.x | Design system utilitário |
| Banco de Dados | PostgreSQL | 15.x | Armazenamento relacional |
| BaaS | Supabase | — | Auth, DB, Storage, Edge Functions |
| Autenticação | Supabase Auth | — | JWT, OAuth, e-mail/senha |
| Validação | Zod | 3.x | Schemas de validação tipados |
| Formulários | React Hook Form | 7.x | Gestão de estado de formulários |
| Ícones | Lucide React | — | Biblioteca de ícones SVG |
| Datas | date-fns | 3.x | Formatação e manipulação de datas |
| Variantes CSS | class-variance-authority | — | Variantes de componentes |

## Anexo B — Perfis de Acesso e Permissões

| Funcionalidade | Beneficiário | Instrutor | Assistente | Administrador |
|---|---|---|---|---|
| Ver próprio perfil | ✅ | ✅ | ✅ | ✅ |
| Editar próprio perfil | ✅ | ✅ | ✅ | ✅ |
| Ver/editar perfil de terceiros | ❌ | Parcial | ✅ | ✅ |
| Inscrever-se em cursos | ✅ | ❌ | ❌ | ❌ |
| Inscrever beneficiários | ❌ | ❌ | ✅ | ✅ |
| Ver turmas | ✅ (próprias) | ✅ (próprias) | ✅ | ✅ |
| Lançar presenças | ❌ | ✅ | ❌ | ✅ |
| Criar/editar cursos | ❌ | ❌ | ❌ | ✅ |
| Gerenciar usuários | ❌ | ❌ | ❌ | ✅ |
| Ver relatórios | ❌ | Parcial | ✅ | ✅ |
| Ver logs de auditoria | ❌ | ❌ | ❌ | ✅ |
| Solicitar exclusão de dados | ✅ | ✅ | ✅ | ❌ |
| Processar solicitações LGPD | ❌ | ❌ | ❌ | ✅ |
| Acessar configurações | ❌ | ❌ | ❌ | ✅ |

## Anexo C — Estrutura de Pastas do Projeto

```
c:\PROJETO\
├── src/
│   ├── app/                    # Páginas e layouts (Next.js App Router)
│   │   ├── (public)/           # Rotas públicas (landing, login, cadastro)
│   │   ├── (admin)/admin/      # Área administrativa
│   │   ├── (assistant)/        # Área do assistente
│   │   ├── (instructor)/       # Área do instrutor
│   │   └── (beneficiary)/      # Área do beneficiário
│   ├── components/
│   │   ├── ui/                 # Design system (Button, Input, Card, etc.)
│   │   ├── layout/             # Componentes de layout (Sidebar, Header)
│   │   ├── lgpd/               # Componentes específicos de LGPD
│   │   └── providers/          # Context providers (Theme, Toast)
│   ├── lib/
│   │   ├── auth/               # Autenticação e permissões
│   │   ├── supabase/           # Clientes Supabase (server/client)
│   │   ├── utils/              # Utilitários gerais
│   │   └── validation/         # Schemas Zod
│   ├── server/
│   │   ├── actions/            # Server Actions (mutações)
│   │   ├── queries/            # Queries de leitura
│   │   └── services/           # Serviços (auditoria)
│   ├── types/                  # Tipos TypeScript
│   └── middleware.ts           # Proteção de rotas
├── supabase/
│   └── migrations/             # Migrações do banco de dados
└── public/                     # Arquivos estáticos
```

---

*Documento elaborado pela equipe técnica responsável pelo desenvolvimento da plataforma Vida Plena. Todos os direitos reservados à ONG Vida Plena.*
