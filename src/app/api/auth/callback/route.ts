import { type NextRequest } from 'next/server'
import { handleAuthCallback } from '@/lib/auth/callback-handler'

// Callback alternativo — o principal é /auth/callback (configurado no Supabase)
export async function GET(request: NextRequest) {
  return handleAuthCallback(request)
}
