import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NovoCursoButton() {
  return (
    <Link href="/admin/cursos/novo">
      <Button leftIcon={<Plus className="h-4 w-4" />}>
        Novo Curso
      </Button>
    </Link>
  )
}
