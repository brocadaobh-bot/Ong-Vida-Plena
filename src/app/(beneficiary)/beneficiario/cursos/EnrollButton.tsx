'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { selfEnrollAction } from '@/server/actions/enrollments'

export function EnrollButton({ classId }: { classId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleEnroll() {
    startTransition(async () => {
      setError(null)
      const result = await selfEnrollAction(classId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-2">
      {error && <Alert variant="error" message={error} />}
      <Button onClick={handleEnroll} loading={isPending} className="w-full">
        Inscrever-se
      </Button>
    </div>
  )
}
