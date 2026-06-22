import Link from 'next/link'
import { getAuthUser, getDashboardUrl } from '@/lib/auth/session'
import { Button } from '@/components/ui/Button'

export async function PublicAuthNav() {
  const user = await getAuthUser()

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Olá, {user.full_name.split(' ')[0]}
        </span>
        <Link href={getDashboardUrl(user.role)}>
          <Button variant="secondary" size="sm">
            Meu painel
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login">
        <Button variant="ghost" size="sm">Entrar</Button>
      </Link>
      <Link href="/cadastro" className="hidden sm:block">
        <Button size="sm">Cadastrar-se</Button>
      </Link>
    </div>
  )
}

export async function getPublicBackHref(): Promise<{ href: string; label: string }> {
  const user = await getAuthUser()

  if (!user) {
    return { href: '/', label: 'Voltar ao início' }
  }

  if (user.role === 'beneficiary') {
    return { href: '/beneficiario/certificados', label: 'Voltar aos certificados' }
  }

  return { href: getDashboardUrl(user.role), label: 'Voltar ao painel' }
}
