'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { createClient, createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { formatAuthError } from '@/lib/auth/format-auth-error'
import { getAppUrl, getPasswordRecoveryRedirectUrl } from '@/lib/auth/app-url'
import { ensureUserProfile } from '@/lib/auth/ensure-profile'
import { getAuthUser, getDashboardUrl } from '@/lib/auth/session'
import { logAudit } from '@/server/services/audit'
import { getRequireEmailConfirmation } from '@/lib/settings/app-settings.server'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validation/schemas'
import {
  REMEMBER_LOGIN_COOKIE,
  REMEMBER_LOGIN_MAX_AGE_SEC,
} from '@/lib/auth/remember-login'
import type { ActionResult } from '@/types/domain'

// ─────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email:    formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const persistLogin =
    formData.get('rememberMe') === 'on' || formData.get('rememberMe') === 'true'

  const supabase = await createAuthClient({ persistLogin })
  const { data, error } = await supabase.auth.signInWithPassword({
    email:    parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'E-mail ou senha incorretos.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { success: false, error: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.' }
    }
    return { success: false, error: 'Erro ao realizar login. Tente novamente.' }
  }

  if (!data.user) {
    return { success: false, error: 'Usuário não encontrado.' }
  }

  const cookieStore = await cookies()
  if (persistLogin) {
    cookieStore.set(REMEMBER_LOGIN_COOKIE, '1', {
      maxAge: REMEMBER_LOGIN_MAX_AGE_SEC,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  } else {
    cookieStore.delete(REMEMBER_LOGIN_COOKIE)
  }

  // Busca perfil para redirecionar para o dashboard correto
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', data.user.id)
    .single()

  if (profile?.status === 'blocked') {
    await supabase.auth.signOut()
    return { success: false, error: 'Conta bloqueada. Entre em contato com a administração.' }
  }

  const dashboardUrl = getDashboardUrl(profile?.role ?? 'beneficiary')
  revalidatePath(dashboardUrl, 'layout')
  redirect(dashboardUrl)
}

// ─────────────────────────────────────────────────────────────
// Cadastro de Beneficiário
// ─────────────────────────────────────────────────────────────
export async function registerAction(formData: FormData): Promise<ActionResult<{
  requiresEmailConfirmation: boolean
  autoLoginFailed?: boolean
}>> {
  const parsed = registerSchema.safeParse({
    full_name:               formData.get('full_name'),
    email:                   formData.get('email'),
    password:                formData.get('password'),
    confirm_password:        formData.get('confirm_password'),
    phone:                   formData.get('phone') || undefined,
    birth_date:              formData.get('birth_date') || undefined,
    consent_privacy_policy:  formData.get('consent_privacy_policy') === 'true',
    consent_data_processing: formData.get('consent_data_processing') === 'true',
    consent_communications:  formData.get('consent_communications') === 'true',
    consent_image_use:       formData.get('consent_image_use') === 'true',
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { success: false, error: 'Configuração do Supabase incompleta. Verifique o arquivo .env.local.' }
  }

  const supabase = await createClient()
  const serviceSupabase = createServiceClient()
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') ?? undefined
  const appUrl = getAppUrl()
  const requireEmailConfirmation = await getRequireEmailConfirmation()

  // Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        role:      'beneficiary',
      },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  })

  if (authError) {
    console.error('SUPABASE SIGNUP ERROR:', authError)

    return {
      success: false,
      error: formatAuthError(authError),
    }
  }

  if (!authData.user) {
    return { success: false, error: 'Erro interno. Tente novamente.' }
  }

  if (authData.user.identities?.length === 0) {
    return { success: false, error: 'Este e-mail já está cadastrado.' }
  }

  const userId = authData.user.id

  // Trigger deveria criar o profile; fallback via service role se não existir
  const ensured = await ensureUserProfile(serviceSupabase, {
    userId,
    email:    parsed.data.email,
    fullName: parsed.data.full_name,
    role:     'beneficiary',
  })

  if (!ensured.ok) {
    console.error('Falha ao criar profile (fallback):', ensured.error)
    return {
      success: false,
      error: `Não foi possível criar o perfil: ${ensured.error}`,
    }
  }

  // Atualiza campos opcionais (service role — sessão pode não existir com confirmação de e-mail)
  if (parsed.data.phone || parsed.data.birth_date) {
    const { error } = await serviceSupabase.from('profiles').update({
      phone:      parsed.data.phone ?? null,
      birth_date: parsed.data.birth_date ?? null,
    }).eq('id', userId)

    if (error) {
      console.error('profile update error:', error)
    }
  }

  // Registra consentimentos LGPD
  const { data: activePolicy } = await serviceSupabase
    .rpc('get_active_privacy_policy')
    .single()

  if (activePolicy) {
    const consentTypes: { type: string; granted: boolean }[] = [
      { type: 'privacy_policy',  granted: parsed.data.consent_privacy_policy },
      { type: 'data_processing', granted: parsed.data.consent_data_processing },
      { type: 'communications',  granted: parsed.data.consent_communications ?? false },
      { type: 'image_use',       granted: parsed.data.consent_image_use ?? false },
    ]

    const { error: consentsError } = await serviceSupabase.from('consents').insert(
      consentTypes.map(c => ({
        profile_id:        userId,
        privacy_policy_id: activePolicy.id,
        consent_type:      c.type as any,
        granted:           c.granted,
        user_agent:        userAgent,
      }))
    )

    if (consentsError) {
      console.error('consents insert error:', consentsError)
    }
  }

  // Sem confirmação de e-mail: confirma automaticamente e entra na plataforma
  if (!requireEmailConfirmation) {
    const { error: confirmError } = await serviceSupabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })

    if (confirmError) {
      console.error('auto confirm email error:', confirmError)
      return {
        success: true,
        data: { requiresEmailConfirmation: false, autoLoginFailed: true },
      }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    parsed.data.email,
      password: parsed.data.password,
    })

    if (!signInError) {
      revalidatePath('/', 'layout')
      redirect(getDashboardUrl('beneficiary'))
    }

    return {
      success: true,
      data: { requiresEmailConfirmation: false, autoLoginFailed: true },
    }
  }

  return {
    success: true,
    data: { requiresEmailConfirmation: true },
  }
}

// ─────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────
export async function logoutAction(): Promise<void> {
  const authUser = await getAuthUser()
  const supabase = await createClient()

  if (authUser) {
    await logAudit({
      actorId:    authUser.id,
      action:     'auth.logout',
      entityType: 'profiles',
      entityId:   authUser.id,
    })
  }

  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete(REMEMBER_LOGIN_COOKIE)
  revalidatePath('/', 'layout')
  redirect('/login')
}

/** @deprecated Use logoutAction — mantido para compatibilidade com componentes existentes */
export const logout = logoutAction

// ─────────────────────────────────────────────────────────────
// Recuperação de Senha
// ─────────────────────────────────────────────────────────────
export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getPasswordRecoveryRedirectUrl(),
  })

  // Por segurança, não revelamos se o e-mail existe ou não
  if (error) {
    console.error('forgotPassword error:', error)
  }

  return {
    success: true,
    data: undefined,
  }
}

// ─────────────────────────────────────────────────────────────
// Redefinição de Senha
// ─────────────────────────────────────────────────────────────
export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password:         formData.get('password'),
    confirm_password: formData.get('confirm_password'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: 'Erro ao redefinir senha. O link pode ter expirado.' }
  }

  // Encerra sessão de recuperação — vale para qualquer papel (admin, instrutor, usuário, etc.)
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login?message=Senha redefinida com sucesso. Entre com sua nova senha.')
}

// ─────────────────────────────────────────────────────────────
// Reenviar e-mail de confirmação
// ─────────────────────────────────────────────────────────────
export async function resendConfirmationAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email')

  if (!email || typeof email !== 'string') {
    return { success: false, error: 'Informe seu e-mail.' }
  }

  const supabase = await createClient()
  const appUrl = getAppUrl()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  })

  if (error) {
    console.error('resendConfirmation error:', error)
    return { success: false, error: formatAuthError(error) }
  }

  return {
    success: true,
    data: undefined,
  }
}
