import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { Card } from '@/components/ui/Card'
import { BeneficiaryReportCardsAccordion } from '@/components/beneficiary/BeneficiaryReportCardsAccordion'
import { getBeneficiaryReportCards } from '@/server/queries/report-cards'
import { FileText } from 'lucide-react'

export default async function BoletimPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const reports = await getBeneficiaryReportCards(authUser.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Boletim</h1>
        <p className="text-muted-foreground">
          Clique em uma turma para expandir e ver notas, presença e situação de aprovação.
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              Seu boletim aparecerá aqui quando houver atividades avaliadas ou quando a turma for concluída.
            </p>
            <Link href="/beneficiario/inscricoes" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
              Ver minhas inscrições
            </Link>
          </div>
        </Card>
      ) : (
        <BeneficiaryReportCardsAccordion reports={reports} />
      )}
    </div>
  )
}
