'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { markLgpdRequestReadAction } from '@/server/actions/lgpd'

type LgpdMarkReadOnMountProps = {
  requestId: string
}

/** Marca o ticket como lido fora do render (server action). */
export function LgpdMarkReadOnMount({ requestId }: LgpdMarkReadOnMountProps) {
  const router = useRouter()
  const marked = useRef(false)

  useEffect(() => {
    if (marked.current) return
    marked.current = true

    void markLgpdRequestReadAction(requestId).then(result => {
      if (result.success) {
        router.refresh()
      }
    })
  }, [requestId, router])

  return null
}
