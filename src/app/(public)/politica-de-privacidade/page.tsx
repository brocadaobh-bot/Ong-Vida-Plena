import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function PoliticaPrivacidadePage() {
  const supabase = await createClient()
  const { data: policy } = await supabase
    .rpc('get_active_privacy_policy')
    .single()

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        {policy ? (
          <>
            <h1 className="mb-2 text-3xl font-bold text-foreground">{policy.title}</h1>
            <p className="mb-8 text-sm text-muted-foreground">
              Versão {policy.version}
              {policy.published_at && (
                <> · Publicada em {new Date(policy.published_at).toLocaleDateString('pt-BR')}</>
              )}
            </p>
            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed whitespace-pre-wrap text-foreground">
              {policy.content}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Política de privacidade não disponível no momento.</p>
        )}

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Dúvidas? Entre em contato:{' '}
            <a href="mailto:privacidade@vidaplena.org.br" className="text-primary-600 underline dark:text-primary-400">
              privacidade@vidaplena.org.br
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
