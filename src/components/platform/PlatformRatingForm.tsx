'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { submitPlatformRatingAction } from '@/server/actions/platform-rating'
import type { PlatformRating } from '@/lib/stats/public-landing-stats'
import { cn } from '@/lib/utils/cn'

type PlatformRatingFormProps = {
  existingRating: PlatformRating | null
}

export function PlatformRatingForm({ existingRating }: PlatformRatingFormProps) {
  const [score, setScore] = useState(existingRating?.score ?? 0)
  const [hoverScore, setHoverScore] = useState(0)
  const [comment, setComment] = useState(existingRating?.comment ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const displayScore = hoverScore || score

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    if (score < 1) {
      setError('Selecione de 1 a 5 estrelas.')
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set('score', String(score))

    startTransition(async () => {
      const result = await submitPlatformRatingAction(formData)
      if (!result.success) {
        setError(result.error)
        return
      }
      setSaved(true)
    })
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 dark:bg-yellow-950/40">
          <Star className="h-5 w-5 text-yellow-500" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">
            {existingRating ? 'Sua avaliação da plataforma' : 'Avalie a plataforma'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Sua opinião ajuda a ONG Vida Plena a melhorar os cursos e a experiência no site.
            A taxa de satisfação da página inicial é calculada com base nessas avaliações.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mt-4" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {saved && (
        <Alert variant="success" className="mt-4">
          Obrigado! Sua avaliação foi registrada e já atualiza o painel da página inicial.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Quão satisfeito(a) você está?</p>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Nota de satisfação">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setScore(value)}
                onMouseEnter={() => setHoverScore(value)}
                onMouseLeave={() => setHoverScore(0)}
                className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`${value} estrela${value > 1 ? 's' : ''}`}
                aria-pressed={score === value}
              >
                <Star
                  className={cn(
                    'h-7 w-7 transition-colors',
                    value <= displayScore
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/40',
                  )}
                />
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {displayScore === 0 && 'Clique nas estrelas para avaliar.'}
            {displayScore === 1 && 'Muito insatisfeito(a)'}
            {displayScore === 2 && 'Insatisfeito(a)'}
            {displayScore === 3 && 'Neutro(a)'}
            {displayScore === 4 && 'Satisfeito(a)'}
            {displayScore === 5 && 'Muito satisfeito(a)'}
          </p>
        </div>

        <div>
          <label htmlFor="platform-rating-comment" className="mb-1.5 block text-sm font-medium text-foreground">
            Comentário (opcional)
          </label>
          <textarea
            id="platform-rating-comment"
            name="comment"
            rows={3}
            maxLength={1000}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Conte o que você mais gosta ou o que podemos melhorar..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <Button type="submit" isLoading={isPending} loadingText="Salvando...">
          {existingRating ? 'Atualizar avaliação' : 'Enviar avaliação'}
        </Button>
      </form>
    </Card>
  )
}
