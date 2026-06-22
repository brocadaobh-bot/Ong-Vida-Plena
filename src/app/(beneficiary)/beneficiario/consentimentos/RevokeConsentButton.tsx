'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { revokeConsentAction } from '@/server/actions/lgpd'

export function RevokeConsentButton({ consentId }: { consentId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleRevoke() {
    startTransition(async () => {
      await revokeConsentAction(consentId)
      setOpen(false)
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-red-500 hover:bg-red-50 hover:text-red-700 shrink-0"
      >
        Revogar
      </Button>
      <ConfirmModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleRevoke}
        isLoading={isPending}
        title="Revogar Consentimento"
        description="Tem certeza que deseja revogar este consentimento? Isso pode afetar algumas funcionalidades da plataforma."
        confirmText="Sim, revogar"
        cancelText="Cancelar"
      />
    </>
  )
}
