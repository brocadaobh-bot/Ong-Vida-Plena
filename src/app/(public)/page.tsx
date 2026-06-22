import Link from 'next/link'
import {
  BookOpen, Users, Award, Heart, ChevronRight,
  CheckCircle2, Star, Sparkles, GraduationCap, Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getPublicLandingStats } from '@/server/queries/public-stats'
import {
  formatLandingStatNumber,
  formatSatisfactionRate,
} from '@/lib/stats/public-landing-stats'

/* ─── Feature cards ──────────────────────────────────────── */
const FEATURES: {
  icon: typeof BookOpen
  color: string
  title: string
  desc: string
  href?: string
}[] = [
  {
    icon:  BookOpen,
    color: 'bg-green-50   dark:bg-green-950/40  text-green-600   dark:text-green-400',
    title: 'Cursos Profissionalizantes',
    desc:  'Capacitações certificadas para o mercado de trabalho nas mais diversas áreas.',
  },
  {
    icon:  Globe,
    color: 'bg-blue-50    dark:bg-blue-950/40   text-blue-600    dark:text-blue-400',
    title: 'Inclusão Digital',
    desc:  'Aprenda a usar computadores, internet e tecnologia do dia a dia.',
  },
  {
    icon:  Award,
    color: 'bg-purple-50  dark:bg-purple-950/40 text-purple-600  dark:text-purple-400',
    title: 'Certificados',
    desc:  'Certificados digitais com código de verificação — qualquer pessoa pode confirmar a autenticidade online.',
    href:  '/verificar-certificado',
  },
  {
    icon:  Heart,
    color: 'bg-rose-50    dark:bg-rose-950/40   text-rose-600    dark:text-rose-400',
    title: 'Comunidade',
    desc:  'Faça parte de uma rede de apoio e transformação social na sua região.',
  },
]

const LGPD_ITEMS = [
  'Consentimento antes de qualquer coleta',
  'Dados acessíveis a qualquer momento',
  'Solicitação de exclusão ou portabilidade',
  'Política de privacidade transparente',
]

/* ─── Page ───────────────────────────────────────────────── */
export default async function LandingPage() {
  const stats = await getPublicLandingStats()
  const satisfaction = formatSatisfactionRate(
    stats.satisfaction_rate,
    stats.satisfaction_count,
  )

  const statItems = [
    {
      value: formatLandingStatNumber(stats.users_served),
      label: 'Usuários atendidos',
      hint: 'Inscrições + cadastros na plataforma',
    },
    {
      value: formatLandingStatNumber(stats.courses_available),
      label: 'Cursos disponíveis',
      hint: 'Total de cursos cadastrados na plataforma',
    },
    {
      value: satisfaction.value,
      label: 'Taxa de satisfação',
      hint: satisfaction.hint ?? 'Faça login e avalie a plataforma',
    },
    {
      value: String(stats.social_impact_years),
      label: 'Anos de impacto social',
      hint: null,
    },
  ]
  return (
    <div className="min-h-dvh bg-background text-foreground">

      {/* ── Navigation ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            aria-label="Vida Plena — Página inicial"
          >
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-soft-sm">
              <span className="text-xs font-bold text-white">VP</span>
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:block">
              Vida Plena
            </span>
          </Link>

          {/* Actions */}
          <nav aria-label="Ações principais" className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/cadastro">
              <Button size="sm">Cadastrar-se</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden"
      >
        {/* Background gradient */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10
            bg-[radial-gradient(ellipse_at_top_left,_hsl(142_72%_29%_/_0.08)_0%,_transparent_60%)]
            dark:bg-[radial-gradient(ellipse_at_top_left,_hsl(142_72%_40%_/_0.06)_0%,_transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full
            bg-primary-400/5 dark:bg-primary-400/3 blur-3xl"
        />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 dark:border-primary-800/50 bg-primary-50 dark:bg-primary-950/40 px-3 py-1 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wide">
              ONG Vida Plena
            </span>
          </div>

          <h1
            id="hero-heading"
            className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Transformando vidas através da{' '}
            <span className="text-gradient">educação e capacitação</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Acesse cursos profissionalizantes, inclusão digital, oficinas e eventos comunitários.
            Inscreva-se, acompanhe seu progresso e conquiste novas oportunidades.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/cadastro">
              <Button size="lg" rightIcon={<ChevronRight className="h-5 w-5" />}>
                Quero me Cadastrar
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Já tenho conta
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <div className="flex -space-x-2" aria-hidden="true">
              {['bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-rose-400'].map((c, i) => (
                <div key={i} className={`h-7 w-7 rounded-full border-2 border-background ${c} opacity-80`} />
              ))}
            </div>
            <div className="flex items-center gap-1 ml-3">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              ))}
            </div>
            <span className="ml-1">
              {stats.users_served > 0 ? (
                <>
                  Mais de{' '}
                  <span className="font-semibold text-foreground">
                    {formatLandingStatNumber(stats.users_served)}
                  </span>{' '}
                  usuários atendidos
                </>
              ) : (
                'Cadastre-se e faça parte da nossa comunidade'
              )}
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section aria-label="Números do impacto" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            {statItems.map(({ value, label, hint }) => (
              <div key={label}>
                <dt className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {value}
                </dt>
                <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
                {hint && (
                  <dd className="mt-1 text-xs text-muted-foreground/80">{hint}</dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section aria-labelledby="features-heading" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2">
              O que oferecemos
            </p>
            <h2 id="features-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
              Tudo que você precisa para se desenvolver
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, color, title, desc, href }) => {
              const card = (
                <>
                  <div
                    className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${color} group-hover:scale-110 transition-transform duration-200`}
                    aria-hidden="true"
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  {href && (
                    <p className="mt-3 text-xs font-medium text-primary-600 dark:text-primary-400">
                      Verificar certificado →
                    </p>
                  )}
                </>
              )

              return href ? (
                <Link
                  key={title}
                  href={href}
                  className="card block p-6 text-center group hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                >
                  {card}
                </Link>
              ) : (
                <div
                  key={title}
                  className="card p-6 text-center group hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {card}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section aria-labelledby="how-heading" className="py-20 sm:py-24 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 id="how-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
              Como funciona
            </h2>
            <p className="mt-4 text-muted-foreground">
              Três passos simples para começar sua jornada de aprendizado
            </p>
          </div>

          <ol className="relative grid gap-0 lg:grid-cols-3 lg:gap-8" aria-label="Passos para começar">
            {[
              { step: '01', title: 'Crie sua conta',       desc: 'Cadastre-se gratuitamente com seu e-mail e dados básicos.', icon: Users          },
              { step: '02', title: 'Explore os cursos',    desc: 'Veja os cursos disponíveis e faça sua inscrição online.',     icon: BookOpen        },
              { step: '03', title: 'Conquiste certificados',desc: 'Conclua os cursos e receba seu certificado de participação.', icon: GraduationCap  },
            ].map(({ step, title, desc, icon: Icon }, i) => (
              <li key={step} className="relative flex lg:flex-col items-start gap-4 lg:items-center lg:text-center pb-8 lg:pb-0">
                {/* Connector line */}
                {i < 2 && (
                  <div
                    aria-hidden="true"
                    className="absolute left-5 top-10 h-[calc(100%-3rem)] w-0.5 bg-border lg:top-5 lg:left-1/2 lg:h-0.5 lg:w-full"
                  />
                )}
                <div
                  className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 dark:bg-primary-500 text-white font-bold text-sm shadow-soft-sm"
                  aria-label={`Passo ${step}`}
                >
                  {step}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 lg:justify-center">
                    <Icon className="h-4 w-4 text-primary-500" aria-hidden="true" />
                    <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── LGPD ────────────────────────────────────────────── */}
      <section aria-labelledby="lgpd-heading" className="py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="card p-8 sm:p-12 text-center">
            <div
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/40"
              aria-hidden="true"
            >
              <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <h2 id="lgpd-heading" className="text-2xl font-bold text-foreground mb-4">
              Seus dados estão protegidos
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Seguimos a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
              Você tem controle total sobre suas informações pessoais.
            </p>
            <ul
              className="grid gap-3 sm:grid-cols-2 text-left max-w-lg mx-auto"
              aria-label="Compromissos com sua privacidade"
            >
              {LGPD_ITEMS.map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/politica-de-privacidade"
              className="mt-8 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Ler Política de Privacidade completa →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="cta-heading"
        className="relative overflow-hidden py-20 sm:py-24 bg-primary-600 dark:bg-primary-700"
      >
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.08)_0%,_transparent_70%)]" />
        <div className="relative mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h2 id="cta-heading" className="text-3xl font-bold text-white sm:text-4xl mb-4">
            Comece sua jornada hoje
          </h2>
          <p className="text-primary-100 mb-10 text-lg">
            Cadastro gratuito. Acesso imediato aos cursos disponíveis.
          </p>
          <Link href="/cadastro">
            <Button
              variant="secondary"
              size="xl"
              className="bg-white text-primary-700 hover:bg-primary-50 border-white/20 shadow-soft-lg font-semibold"
            >
              Criar minha conta gratuita
              <ChevronRight className="h-5 w-5 ml-1" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface" aria-label="Rodapé">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between text-sm">
          <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            <div className="h-6 w-6 rounded bg-primary-600 flex items-center justify-center">
              <span className="text-[9px] font-bold text-white">VP</span>
            </div>
            <span className="font-bold text-foreground">Vida Plena</span>
          </Link>

          <nav aria-label="Links do rodapé" className="flex flex-wrap justify-center gap-4 text-muted-foreground">
            <Link href="/verificar-certificado" className="hover:text-foreground transition-colors">
              Verificar certificado
            </Link>
            <Link href="/politica-de-privacidade" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Entrar
            </Link>
          </nav>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ONG Vida Plena
          </p>
        </div>
      </footer>
    </div>
  )
}
