'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type CertificateVerifyFormProps = {
  initialCode?: string
}

export function CertificateVerifyForm({ initialCode = '' }: CertificateVerifyFormProps) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return

    startTransition(() => {
      router.push(`/verificar-certificado?codigo=${encodeURIComponent(trimmed)}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Input
          name="codigo"
          label="Código de verificação"
          placeholder="Ex.: VP-2026-A1B2C3D4"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          hint="Informe o código impresso no rodapé do certificado digital."
          required
          autoComplete="off"
          spellCheck={false}
          className="font-mono uppercase"
        />
      </div>
      <Button
        type="submit"
        loading={isPending}
        leftIcon={<Search className="h-4 w-4" />}
        className="sm:mb-0.5"
      >
        Verificar
      </Button>
    </form>
  )
}
