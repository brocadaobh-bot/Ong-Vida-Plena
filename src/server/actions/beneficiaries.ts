'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAuthUser, getDashboardUrl } from '@/lib/auth/session'
import { requireAdminOrAssistant } from '@/lib/auth/permissions'
import { updateProfileSchema, updateBeneficiaryProfileSchema, createUserSchema } from '@/lib/validation/schemas'
import { formatZodError } from '@/lib/validation/format-zod-error'
import { logAudit } from '@/server/services/audit'
import type { ActionResult } from '@/types/domain'

// ─────────────────────────────────────────────────────────────
// Atualizar perfil do beneficiário (próprio)
// ─────────────────────────────────────────────────────────────
export async function updateOwnProfileAction(
  formData: FormData,
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const supabase = await createClient()
  const serviceSupabase = createServiceClient()

  const { data: oldProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()

  const rawFullName = formData.get('full_name')
  const fullName =
    rawFullName !== null && String(rawFullName).trim() !== ''
      ? String(rawFullName)
      : (oldProfile?.full_name ?? '')

  const { data: hasCertificates, error: certCheckError } = await supabase.rpc(
    'beneficiary_has_certificates',
    { p_beneficiary_id: authUser.id },
  )

  if (certCheckError) {
    console.error('[updateOwnProfile] certificate check:', certCheckError)
  }

  const profileParsed = updateProfileSchema.safeParse({
    full_name:       fullName,
    phone:           formData.get('phone'),
    birth_date:      formData.get('birth_date'),
    document_type:   formData.get('document_type'),
    document_number: formData.get('document_number'),
  })

  if (!profileParsed.success) {
    return { success: false, error: formatZodError(profileParsed.error) }
  }

  const payload = {
    full_name:       profileParsed.data.full_name,
    phone:           profileParsed.data.phone ?? null,
    birth_date:      profileParsed.data.birth_date ?? null,
    document_type:   profileParsed.data.document_type ?? null,
    document_number: profileParsed.data.document_number ?? null,
  }

  if (hasCertificates && oldProfile) {
    const norm = (val: FormDataEntryValue | null) => {
      if (val === null || val === undefined) return null
      const s = String(val).trim()
      return s === '' ? null : s
    }

    const identityTampered =
      norm(formData.get('full_name')) !== oldProfile.full_name.trim() ||
      norm(formData.get('document_type')) !== (oldProfile.document_type ?? null) ||
      norm(formData.get('document_number')) !== (oldProfile.document_number ?? null)

    if (identityTampered) {
      return {
        success: false,
        error:
          'Por segurança, nome e documentos não podem ser alterados após a emissão de certificados. ' +
          'Se houver erro, solicite correção em Meus Dados (LGPD) ou fale com a administração.',
      }
    }
  }

  const updatePayload =
    hasCertificates && oldProfile
      ? {
          phone:      payload.phone,
          birth_date: payload.birth_date,
        }
      : payload

  // Service role: evita falha silenciosa do RLS ao editar o próprio perfil
  const { data: updated, error } = await serviceSupabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', authUser.id)
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    console.error('[updateOwnProfile]', error)
    return {
      success: false,
      error: error?.message ?? 'Erro ao atualizar perfil. Tente novamente.',
    }
  }

  try {
    if (!hasCertificates || !oldProfile?.full_name) {
      await serviceSupabase.auth.admin.updateUserById(authUser.id, {
        user_metadata: { full_name: payload.full_name },
      })
    }
  } catch (metaError) {
    console.error('[updateOwnProfile] auth metadata sync:', metaError)
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'profile.updated',
    entityType: 'profiles',
    entityId:   authUser.id,
    oldValues:  oldProfile ?? undefined,
    newValues:  updatePayload,
  })

  revalidatePath(`${getDashboardUrl(authUser.role)}/perfil`)
  revalidatePath('/beneficiario/perfil')

  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Atualizar dados estendidos do beneficiário (próprio)
// ─────────────────────────────────────────────────────────────
export async function updateOwnBeneficiaryProfileAction(formData: FormData): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const parsed = updateBeneficiaryProfileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) }
  }

  const supabase = await createClient()
  const {
    postal_code, street, number, complement, district, city, state,
    ...beneficiaryFields
  } = parsed.data

  // Atualiza ou cria endereço
  let addressId: string | null = null
  if (city && state) {
    const { data: existing } = await supabase
      .from('beneficiary_profiles')
      .select('address_id')
      .eq('profile_id', authUser.id)
      .single()

    if (existing?.address_id) {
      await supabase.from('addresses').update({
        postal_code, street, number, complement, district, city, state,
      }).eq('id', existing.address_id)
      addressId = existing.address_id
    } else {
      const { data: newAddress } = await supabase
        .from('addresses')
        .insert({
          postal_code: postal_code ?? null,
          street: street ?? null,
          number: number ?? null,
          complement: complement ?? null,
          district: district ?? null,
          city: city!,
          state: state!,
        })
        .select('id')
        .single()
      addressId = newAddress?.id ?? null
    }
  }

  const { error } = await supabase
    .from('beneficiary_profiles')
    .update({ ...beneficiaryFields, ...(addressId ? { address_id: addressId } : {}) })
    .eq('profile_id', authUser.id)

  if (error) {
    return { success: false, error: 'Erro ao atualizar dados.' }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'beneficiary.updated',
    entityType: 'beneficiary_profiles',
    entityId:   authUser.id,
    newValues:  beneficiaryFields as Record<string, unknown>,
  })

  revalidatePath('/beneficiario/perfil')
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Criar beneficiário (admin/assistente)
// ─────────────────────────────────────────────────────────────
export async function createBeneficiaryAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdminOrAssistant(authUser.role)

  const parsed = createUserSchema.safeParse({
    full_name: formData.get('full_name'),
    email:     formData.get('email'),
    phone:     formData.get('phone') || null,
    role:      'beneficiary',
    password:  formData.get('password') || `Senha@${Math.random().toString(36).slice(2, 10)}`,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { createServiceClient } = await import('@/lib/supabase/server')
  const serviceSupabase = await createServiceClient()

  // Criar usuário via service role (admin)
  const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
    email:             parsed.data.email,
    password:          parsed.data.password,
    email_confirm:     true,
    user_metadata: {
      full_name: parsed.data.full_name,
      role:      'beneficiary',
    },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { success: false, error: 'E-mail já cadastrado.' }
    }
    return { success: false, error: 'Erro ao criar usuário.' }
  }

  const userId = authData.user.id

  await supabase.from('profiles').update({
    phone: parsed.data.phone ?? null,
  }).eq('id', userId)

  await supabase.from('beneficiary_profiles').insert({ profile_id: userId })

  // Registra consentimento administrativo
  const { data: activePolicy } = await supabase
    .rpc('get_active_privacy_policy')
    .single()

  if (activePolicy) {
    await supabase.from('consents').insert([
      {
        profile_id:        userId,
        privacy_policy_id: activePolicy.id,
        consent_type:      'privacy_policy' as const,
        granted:           true,
      },
      {
        profile_id:        userId,
        privacy_policy_id: activePolicy.id,
        consent_type:      'data_processing' as const,
        granted:           true,
      },
    ])
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'beneficiary.created',
    entityType: 'profiles',
    entityId:   userId,
    newValues:  { email: parsed.data.email, full_name: parsed.data.full_name },
  })

  revalidatePath('/assistente/beneficiarios')
  revalidatePath('/admin/beneficiarios')
  return { success: true, data: { id: userId } }
}

// ─────────────────────────────────────────────────────────────
// Editar beneficiário (admin/assistente)
// ─────────────────────────────────────────────────────────────
export async function editBeneficiaryAction(
  beneficiaryId: string,
  formData: FormData
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdminOrAssistant(authUser.role)

  const profileParsed = updateProfileSchema.safeParse({
    full_name:       formData.get('full_name'),
    phone:           formData.get('phone') || null,
    birth_date:      formData.get('birth_date') || null,
    document_type:   formData.get('document_type') || null,
    document_number: formData.get('document_number') || null,
  })

  if (!profileParsed.success) {
    return { success: false, error: formatZodError(profileParsed.error) }
  }

  const supabase = await createClient()
  const serviceSupabase = createServiceClient()

  const { data: oldProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', beneficiaryId)
    .single()

  if (!oldProfile) {
    return { success: false, error: 'Usuário não encontrado.' }
  }

  const profileData = profileParsed.data
  const nameChanged = oldProfile.full_name.trim() !== profileData.full_name.trim()

  if (nameChanged) {
    const { error: nameError } = await serviceSupabase.rpc(
      'staff_update_beneficiary_name_with_certificates',
      {
        p_beneficiary_id: beneficiaryId,
        p_new_name:       profileData.full_name,
        p_actor_id:       authUser.id,
      },
    )

    if (nameError) {
      console.error('[editBeneficiary] name correction:', nameError)
      return { success: false, error: 'Erro ao atualizar nome e certificados.' }
    }

    try {
      await serviceSupabase.auth.admin.updateUserById(beneficiaryId, {
        user_metadata: { full_name: profileData.full_name },
      })
    } catch (metaError) {
      console.error('[editBeneficiary] auth metadata sync:', metaError)
    }

    await logAudit({
      actorId:    authUser.id,
      action:     'certificate.name_corrected',
      entityType: 'profiles',
      entityId:   beneficiaryId,
      oldValues:  { full_name: oldProfile.full_name },
      newValues:  { full_name: profileData.full_name },
    })
  }

  const { error } = await serviceSupabase
    .from('profiles')
    .update({
      ...(nameChanged ? {} : { full_name: profileData.full_name }),
      phone:           profileData.phone ?? null,
      birth_date:      profileData.birth_date ?? null,
      document_type:   profileData.document_type ?? null,
      document_number: profileData.document_number ?? null,
    })
    .eq('id', beneficiaryId)

  if (error) {
    return { success: false, error: 'Erro ao atualizar usuário.' }
  }

  if (!nameChanged) {
    await logAudit({
      actorId:    authUser.id,
      action:     'beneficiary.updated',
      entityType: 'profiles',
      entityId:   beneficiaryId,
      oldValues:  oldProfile,
      newValues:  profileData,
    })
  }

  revalidatePath('/assistente/beneficiarios')
  revalidatePath(`/assistente/beneficiarios/${beneficiaryId}`)
  revalidatePath('/admin/beneficiarios')
  revalidatePath('/beneficiario/certificados')
  revalidatePath('/beneficiario/perfil')
  return { success: true, data: undefined }
}
