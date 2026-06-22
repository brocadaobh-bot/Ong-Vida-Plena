import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CourseForm } from '../CourseForm'

export default function NovoCursoPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/cursos">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            Voltar para cursos
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Novo Curso</h1>
        <p className="text-muted-foreground">
          Preencha os dados abaixo para adicionar um curso ao catálogo.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CourseForm redirectOnCreate="/admin/cursos" />
      </Card>
    </div>
  )
}
