'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import type { ActionResult } from '@/types/domain'

const platformRatingSchema = z.object({
  score: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
})

export async function submitPlatformRatingAction(formData: FormData): Promise<ActionResult> {
  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Faça login para avaliar a plataforma.' }
  }

  const parsed = platformRatingSchema.safeParse({
    score: formData.get('score'),
    comment: formData.get('comment') || null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('platform_ratings')
    .upsert(
      {
        profile_id: user.id,
        score: parsed.data.score,
        comment: parsed.data.comment?.trim() || null,
      },
      { onConflict: 'profile_id' },
    )

  if (error) {
    console.error('submitPlatformRating error:', error)
    return { success: false, error: 'Não foi possível salvar sua avaliação. Tente novamente.' }
  }

  revalidatePath('/')
  revalidatePath('/beneficiario')

  return { success: true, data: undefined }
}
