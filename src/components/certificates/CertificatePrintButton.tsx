'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function CertificatePrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      leftIcon={<Printer className="h-4 w-4" />}
      onClick={() => window.print()}
    >
      Imprimir / Salvar PDF
    </Button>
  )
}
