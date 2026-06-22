import { LoginForm } from '@/components/auth/LoginForm'

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <LoginForm
      urlError={params.error ?? null}
      urlMessage={params.message ?? null}
    />
  )
}
