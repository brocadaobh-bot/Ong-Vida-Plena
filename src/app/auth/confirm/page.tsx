import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthConfirmClient } from './AuthConfirmClient'

function ConfirmFallback() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
      <p className="text-sm">Confirmando link…</p>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<ConfirmFallback />}>
      <AuthConfirmClient />
    </Suspense>
  )
}
