'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { assertCanManageClass, assertEnrolledInClass } from '@/lib/auth/class-access'
import type { ActionResult } from '@/types/domain'

export type ClassInfoPanelData = {
  class: {
    id: string
    name: string
    courseTitle: string
    location: string | null
    room: string | null
    whatsapp_link: string | null
    schedule_description: string | null
    start_date: string
    end_date: string | null
  }
  announcements: {
    id: string
    title: string
    body: string
    is_pinned: boolean
    created_at: string
  }[]
  sessions: {
    id: string
    session_date: string
    start_time: string | null
    end_time: string | null
    topic: string | null
    room: string | null
    status: string
  }[]
  canManage: boolean
}

export async function fetchClassInfoPanelAction(
  classId: string,
  mode: 'manage' | 'view' = 'manage',
): Promise<ActionResult<ClassInfoPanelData>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  if (mode === 'manage') {
    const access = await assertCanManageClass(authUser, classId)
    if (!access.ok) return { success: false, error: access.error }
  } else {
    const access = await assertEnrolledInClass(authUser, classId)
    if (!access.ok) return { success: false, error: access.error }
  }

  const supabase = await createClient()

  const [
    { data: cls, error: classError },
    { data: announcements },
    { data: sessions },
  ] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, location, room, whatsapp_link, schedule_description, start_date, end_date, courses(title)')
      .eq('id', classId)
      .single(),
    supabase
      .from('class_announcements')
      .select('id, title, body, is_pinned, created_at')
      .eq('class_id', classId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('class_sessions')
      .select('id, session_date, start_time, end_time, topic, room, status')
      .eq('class_id', classId)
      .order('session_date'),
  ])

  if (classError || !cls) {
    return { success: false, error: 'Turma não encontrada.' }
  }

  const canManage = mode === 'manage' ||
    (await assertCanManageClass(authUser, classId)).ok

  return {
    success: true,
    data: {
      class: {
        id:                   cls.id,
        name:                 cls.name,
        courseTitle:          (cls as any).courses?.title ?? '',
        location:             cls.location,
        room:                 cls.room ?? null,
        whatsapp_link:        cls.whatsapp_link ?? null,
        schedule_description: cls.schedule_description,
        start_date:           cls.start_date,
        end_date:             cls.end_date,
      },
      announcements: announcements ?? [],
      sessions:        sessions ?? [],
      canManage,
    },
  }
}
