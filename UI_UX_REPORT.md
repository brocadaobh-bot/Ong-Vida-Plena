# Relatório de Melhorias UI/UX — Vida Plena

> Gerado automaticamente em Jun 2026  
> Especialista Sênior em UI/UX, Design Systems, Acessibilidade e Responsividade

---

## 1. Design System

### 1.1 Tokens de Design (CSS Custom Properties)

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--background` | hsl(0 0% 98%) | hsl(240 10% 5%) | Fundo da página |
| `--foreground` | hsl(240 10% 8%) | hsl(0 0% 95%) | Texto principal |
| `--surface` | hsl(0 0% 100%) | hsl(240 8% 9%) | Cards, inputs |
| `--border` | hsl(240 6% 90%) | hsl(240 6% 18%) | Bordas |
| `--muted` | hsl(240 5% 96%) | hsl(240 7% 14%) | Fundos secundários |
| `--primary` | hsl(142 72% 29%) | hsl(142 72% 40%) | Cor de ação |
| `--ring` | Mesmo que primary | Mesmo que primary | Focus ring |

### 1.2 Tipografia

- **Fonte**: Inter (Google Fonts, via `next/font/google`) com `display: swap`
- **Feature settings**: `cv02`, `cv03`, `cv04`, `cv11` (numerais, variantes OpenType)
- Carregamento otimizado com `preload: true` e subset `latin`

### 1.3 Border Radius

Baseado em variável CSS `--radius: 0.625rem` (10px):

| Token | Valor | Uso |
|---|---|---|
| `rounded-sm` | 6px | Elementos pequenos (badges) |
| `rounded-md` | 8px | Inputs, dropdowns |
| `rounded-lg` | 10px | Botões, cards pequenos |
| `rounded-xl` | 14px | Cards, painéis |
| `rounded-2xl` | 18px | Modais, seções |

### 1.4 Sombras

| Classe | Uso |
|---|---|
| `shadow-soft-xs` | Hover states |
| `shadow-soft-sm` | Cards padrão |
| `shadow-soft-md` | Cards com hover |
| `shadow-soft-lg` | Toasts, dropdowns |
| `shadow-soft-xl` | Modais, drawers |

---

## 2. Novos Componentes

### 2.1 Sistema de Toast (`ToastProvider`)

**Arquivo**: `src/components/providers/ToastProvider.tsx`

- 5 tipos: `success`, `error`, `warning`, `info`, `loading`
- Auto-dismiss configurável por tipo (4–6s; loading: persistente)
- Animação de entrada/saída suave
- Suporte a `action` (botão inline)
- `aria-live="assertive"` para erros, `"polite"` para demais
- Máximo de 5 toasts simultâneos (FIFO)

**Uso**:
```typescript
const { success, error, warning, info, loading, dismiss } = useToast()
success('Operação realizada!', 'Dados salvos com sucesso.')
const id = loading('Processando...')
dismiss(id)
```

### 2.2 Skeleton Loading (`Skeleton.tsx`)

**Arquivo**: `src/components/ui/Skeleton.tsx`

Variantes disponíveis:

| Componente | Uso |
|---|---|
| `<Skeleton />` | Elemento genérico |
| `<SkeletonText lines={3} />` | Blocos de texto |
| `<SkeletonCard />` | Card completo |
| `<SkeletonStatCard />` | Card de métricas |
| `<SkeletonTable rows={5} columns={4} />` | Tabela |
| `<SkeletonAvatar size="md" />` | Avatar circular |
| `<SkeletonForm fields={4} />` | Formulário |

- Animação shimmer customizada (gradiente em movimento)
- `role="status"` com `aria-label` para screen readers

### 2.3 Empty States (`EmptyState.tsx`)

**Arquivo**: `src/components/ui/EmptyState.tsx`

- Variantes: `default`, `search`, `error`, `comingSoon`
- Tamanhos: `sm`, `md`, `lg`
- Ícones pré-definidos para contextos comuns
- `EmptySearch` — empty state de busca com callback para limpar filtros
- `EmptyError` — empty state de erro com retry callback
- `role="status"` e `aria-label`

### 2.4 ThemeToggle (`ThemeToggle.tsx`)

**Arquivo**: `src/components/ui/ThemeToggle.tsx`

- Variant `icon`: ícone sol/lua com animação de rotação/escala
- Variant `full`: grupo de 3 botões (Claro/Escuro/Sistema)
- Persistência via `localStorage` (`vida-plena-theme`)
- Detecta preferência do sistema (`prefers-color-scheme`)
- `aria-label` e `aria-pressed` para acessibilidade

### 2.5 ThemeProvider

**Arquivo**: `src/components/providers/ThemeProvider.tsx`

- Context com `theme` (preferência) e `resolvedTheme` (atual)
- Listener para mudança de preferência do sistema
- Atualiza `meta[name="theme-color"]` para PWA/mobile
- `suppressHydrationWarning` no `<html>` evita flicker

---

## 3. Componentes UI Elevados

### 3.1 Button

**Arquivo**: `src/components/ui/Button.tsx`

**Novidades**:
- 7 variantes: `primary`, `secondary`, `outline`, `ghost`, `destructive`, `destructive-outline`, `link`
- 8 tamanhos: `xs`, `sm`, `md`, `lg`, `xl`, `icon`, `icon-sm`, `icon-lg`
- Props `leftIcon` / `rightIcon` para ícones alinhados
- `isLoading` / `loading` (backward-compat) com spinner e texto alternativo
- Efeito de press: `active:scale-[0.97]`
- `aria-busy` e `aria-disabled` corretos
- Focus ring visível com offset

### 3.2 Input

**Arquivo**: `src/components/ui/Input.tsx`

**Novidades**:
- Ícone de mostrar/ocultar senha integrado (`type="password"`)
- Ícone de erro integrado (AlertCircle) quando `error` está presente
- `aria-invalid`, `aria-describedby` apontando para `error` e `hint`
- Indicador visual `*` para campos obrigatórios
- Textarea e SelectField incluídos no mesmo arquivo (re-exports)
- Transições suaves no border/ring

### 3.3 Card

**Arquivo**: `src/components/ui/Card.tsx`

**Novidades**:
- 6 variantes: `default`, `elevated`, `flat`, `ghost`, `outline`, `highlight`
- Prop `interactive`: hover com elevação e translate
- Sub-componentes: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `StatCard` renovado com trend indicator (TrendingUp/Down/Minus) e ícone com hover scale

### 3.4 Badge

**Arquivo**: `src/components/ui/Badge.tsx`

**Novidades**:
- 13 variantes de cor (semantic + solid)
- 4 tamanhos: `xs`, `sm`, `md`, `lg`
- Prop `dot` para indicador de status
- Domain badges atualizados para enums corretos do banco:
  - `UserRoleBadge`, `UserStatusBadge`, `EnrollmentStatusBadge`
  - `CourseStatusBadge`, `ClassStatusBadge`, `AttendanceStatusBadge`
  - `DataRequestStatusBadge` (alias `LgpdStatusBadge` para compatibilidade)

### 3.5 Alert

**Arquivo**: `src/components/ui/Alert.tsx`

**Novidades**:
- 6 variantes: `default`, `info`, `success`, `warning`, `danger`, `error` (alias)
- Prop `message` (backward-compat) e `children` para conteúdo
- Prop `dismissible` com animação de fade-out
- Ícone automático baseado na variante
- `role="alert"` e `aria-live`
- Shorthands: `AlertInfo`, `AlertSuccess`, `AlertWarning`, `AlertDanger`

### 3.6 Modal / Drawer

**Arquivo**: `src/components/ui/Modal.tsx`

**Novidades**:
- Animação de entrada spring (slide-up + scale no desktop, slide-up no mobile)
- Backdrop com blur (`backdrop-blur-sm`)
- Scroll lock no body quando aberto
- `Escape` fecha o modal
- `ConfirmModal` com variantes `danger`, `warning`, `primary`
- Novo componente `Drawer` (lateral/bottom) para mobile-first

### 3.7 Table

**Arquivo**: `src/components/ui/Table.tsx`

**Novidades**:
- Primitivos: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableFooter`
- `SortableHeader` com ícones de ordenação e `aria-sort`
- `TablePagination` com ellipsis inteligente, info de itens e navegação por teclado
- Hover state suave em linhas
- `data-[state=selected]` para seleção

### 3.8 Spinner

**Arquivo**: `src/components/ui/Spinner.tsx`

**Novidades**:
- 5 tamanhos: `xs`, `sm`, `md`, `lg`, `xl`
- `PageLoader` com logo animado e texto
- `InlineLoader` para seções de conteúdo
- `role="status"` e `aria-label`

---

## 4. Layout

### 4.1 Sidebar

**Arquivo**: `src/components/layout/Sidebar.tsx`

**Novidades**:
- `DesktopSidebar` colapsável (com botão toggle) → largura 240px → 56px
- `MobileSidebar` como drawer lateral com backdrop blur
- Grupos de navegação com separadores visuais
- Estado ativo com cor primária, chevron e fundo destacado
- Animação de entrada spring na sidebar mobile
- `role="navigation"`, `aria-label`, `aria-current="page"`
- Logo animado com initials

### 4.2 Header

**Arquivo**: `src/components/layout/Header.tsx`

**Novidades**:
- `glass` effect: `bg-surface/95 backdrop-blur-sm`
- Avatar com iniciais do usuário
- Dropdown de usuário com animação scale-in
- Role badge e email no dropdown
- ThemeToggle integrado
- Indicador de notificações (dot vermelho)
- `aria-expanded`, `aria-haspopup` no user menu
- `role="menu"` e `role="menuitem"` no dropdown

### 4.3 DashboardLayout

**Arquivo**: `src/components/layout/DashboardLayout.tsx`

**Novidades**:
- `PageHeader` com breadcrumb, título, descrição e slot de actions
- `Section` utilitário para organizar conteúdo
- Skip-to-content link para acessibilidade
- `max-w-[1600px]` para ultra-wide (2K+)
- `animate-fade-in` na área de conteúdo

---

## 5. Páginas Públicas

### 5.1 Landing Page (`/`)

**Arquivo**: `src/app/(public)/page.tsx`

**Novidades**:
- Hero com gradiente radial, badge animado e social proof
- Stats section (4 métricas com destaque tipográfico)
- Features em grid com ícones coloridos e hover
- How it works com stepper e linha conectora responsiva
- LGPD section dentro de card estilizado
- CTA com gradiente e botão destacado
- Footer limpo com navegação semântica
- Todas as seções com `aria-labelledby`

### 5.2 Login (`/login`)

**Arquivo**: `src/app/(public)/login/page.tsx`

**Novidades**:
- Layout split: painel decorativo (50%) + form (50%) em desktop
- Painel esquerdo com quote e infos
- Checkbox "Lembrar de mim"
- Integração com Password toggle do novo Input
- Back-link no mobile
- Texto de consentimento LGPD

### 5.3 Recuperar Senha (`/recuperar-senha`)

**Novidades**:
- Layout centrado limpo
- Back-link inline ao invés de botão
- Success state com ícone estilizado

---

## 6. Dashboard Admin

**Arquivo**: `src/app/(admin)/admin/page.tsx`

**Novidades**:
- Data/hora atual no topo da página
- Grid de 5 StatCards com tendência e cores semânticas
- Cards de Turmas e LGPD com EmptyState quando vazio
- Lista com `divide-y` ao invés de itens isolados
- Hover com cor primária no texto dos links
- Quick actions com ícones coloridos e ArrowRight animado
- Seções com `aria-label` e `aria-labelledby`

---

## 7. Acessibilidade

| Critério | Implementação |
|---|---|
| **ARIA Labels** | `aria-label` em todos botões icon, nav, forms |
| **ARIA Roles** | `role="dialog"`, `"alert"`, `"status"`, `"menu"`, `"menuitem"`, `"navigation"`, `"list"` |
| **ARIA States** | `aria-expanded`, `aria-pressed`, `aria-current`, `aria-invalid`, `aria-busy`, `aria-describedby` |
| **Focus Ring** | `focus-visible:ring-2` com `ring-offset-2` em todos os elementos interativos |
| **Skip Link** | "Ir para o conteúdo principal" visível no foco |
| **Screen Readers** | `aria-hidden="true"` em ícones decorativos; `role="status"` em loaders |
| **Keyboard Nav** | Escape fecha modais/drawers; Tab funciona em dropdowns |
| **Contraste** | Tokens de cor garantem ≥ 4.5:1 (WCAG AA) em light e dark |
| **`aria-sort`** | Em cabeçalhos de tabela ordenáveis |
| **`aria-live`** | `"assertive"` para erros, `"polite"` para sucesso/info |
| **Labels** | `<label>` com `for` associado em todos os inputs |
| **`suppressHydrationWarning`** | Evita mismatch de dark mode no SSR |
| **`prefers-reduced-motion`** | Animações encapsuladas em media query |

---

## 8. Responsividade

| Breakpoint | Tailwind | Comportamento |
|---|---|---|
| Mobile (< 640px) | base | Layout coluna, sidebar drawer, tabelas scroll horizontal |
| Tablet (640–1024px) | `sm:` | Grid 2 colunas, hero layout ajustado |
| Notebook (1024–1280px) | `lg:` | Sidebar fixa, grid 3–4 colunas |
| Desktop (> 1280px) | `xl:` | Grid 5 colunas no dashboard |
| Ultra-wide (> 1536px) | `2xl:` | `max-w-[1600px]` limita expansão |

### Mobile-first specifics
- Sidebar vira drawer bottom sheet/lateral
- Modais sobem de baixo (slide-up) no mobile
- Header com menu hambúrguer
- Botões com `w-full` em viewports pequenos
- `safe-bottom` para dispositivos com notch/home bar

---

## 9. Dark Mode

- Estratégia: `class` no `<html>` (controlado via JS)
- Provider: `ThemeProvider` com persistência em `localStorage`
- 3 opções: Claro, Escuro, Sistema (segue `prefers-color-scheme`)
- Todos os tokens de cor possuem equivalentes dark
- Gradientes e overlays ajustados para dark
- Transição suave de cores na troca de tema
- `suppressHydrationWarning` evita flash

---

## 10. Microinterações

| Elemento | Microinteração |
|---|---|
| Buttons | `active:scale-[0.97]` no clique, hover scale de ícone |
| Cards (interactive) | `hover:-translate-y-0.5` + sombra |
| Nav items | Highlight verde instantâneo |
| ThemeToggle | Rotação + escala do ícone sol/lua |
| StatCard icon | `group-hover:scale-110` |
| Quick actions ArrowRight | `opacity-0 → opacity-100 + translate-x-0.5` |
| Toast | Slide-up + fade in/out com escala |
| Modal | Spring animation (cubic-bezier(0.16,1,0.3,1)) |
| Sidebar collapse | Width transition 200ms ease-spring |
| User menu dropdown | `scale-in` 200ms |
| Sidebar mobile | Slide-in-left 300ms spring |

---

## 11. Performance

- `next/font` com `display: swap` evita FOUT
- `preload: true` na fonte principal
- Animações com `transform` (GPU-accelerated)
- `will-change` implícito via Tailwind
- `backdrop-blur` apenas em sticky elements
- Skeleton loading evita layout shift (CLS)

---

## 12. Arquivos Modificados/Criados

### Novos
- `src/app/layout.tsx` — Inter font, ThemeProvider, ToastProvider
- `src/app/globals.css` — Design tokens, CSS vars, dark mode, utilities
- `tailwind.config.ts` — Dark mode, extended theme, custom animations
- `src/components/providers/ThemeProvider.tsx`
- `src/components/providers/ToastProvider.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/ThemeToggle.tsx`

### Substituídos (mantida lógica de negócio)
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx` (+ Textarea, SelectField internos)
- `src/components/ui/Card.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Alert.tsx`
- `src/components/ui/Modal.tsx` (+ ConfirmModal, Drawer)
- `src/components/ui/Spinner.tsx`
- `src/components/ui/Table.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/Textarea.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/DashboardLayout.tsx` (+ PageHeader, Section)
- `src/app/(public)/page.tsx`
- `src/app/(public)/login/page.tsx`
- `src/app/(public)/recuperar-senha/page.tsx`
- `src/app/(public)/layout.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(beneficiary)/beneficiario/layout.tsx`
- `src/app/(instructor)/instrutor/layout.tsx`
- `src/app/(assistant)/assistente/layout.tsx`

---

*Nenhuma lógica de negócio, Server Actions, queries ou políticas de segurança foram alteradas.*
