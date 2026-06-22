import Link from 'next/link'

import { Shield } from 'lucide-react'

import { Alert } from '@/components/ui/Alert'



type CertificateNameNoticeProps = {

  identityLocked: boolean

}



export function CertificateNameNotice({ identityLocked }: CertificateNameNoticeProps) {

  if (!identityLocked) {

    return (

      <Alert variant="info">

        <p className="text-sm leading-relaxed">

          Confira se o <strong>nome completo</strong> e os <strong>documentos</strong> estão corretos

          antes de concluir um curso. Após a emissão do certificado, esses dados ficarão registrados e

          só poderão ser corrigidos pela administração da ONG.

        </p>

      </Alert>

    )

  }



  return (

    <Alert variant="warning">

      <p className="text-sm leading-relaxed">

        Você já possui certificado(s) emitido(s). Por segurança, o <strong>nome completo</strong> e os{' '}

        <strong>documentos</strong> não podem ser alterados por aqui — evita fraude e garante a

        confiabilidade do certificado.

      </p>

      <p className="mt-2 text-sm leading-relaxed">

        Se algum dado estiver errado (ex.: erro de cadastro), solicite correção em{' '}

        <Link href="/beneficiario/lgpd" className="font-medium underline underline-offset-2">

          Meus Dados (LGPD)

        </Link>{' '}

        ou fale com a administração. A equipe valida a identidade antes de corrigir.

      </p>

      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">

        <Shield className="h-3.5 w-3.5" aria-hidden="true" />

        Correções são registradas em auditoria.

      </p>

    </Alert>

  )

}

