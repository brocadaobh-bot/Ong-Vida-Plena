import type { CourseCertificate } from '@/types/domain'

export type { CourseCertificate }

export function formatCertificateDate(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoDate))
}

export function formatWorkloadHours(hours: number | null | undefined): string | null {
  if (!hours || hours <= 0) return null
  return `${hours} hora${hours === 1 ? '' : 's'}`
}
