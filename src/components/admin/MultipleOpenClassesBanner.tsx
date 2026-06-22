import Link from 'next/link'
import { Alert } from '@/components/ui/Alert'
import type { MultipleOpenCourseSummary } from '@/lib/classes/open-class-policy'

type MultipleOpenClassesBannerProps = {
  courses: MultipleOpenCourseSummary[]
  turmasBasePath: string
}

export function MultipleOpenClassesBanner({
  courses,
  turmasBasePath,
}: MultipleOpenClassesBannerProps) {
  if (courses.length === 0) return null

  return (
    <Alert variant="warning">
      <div className="space-y-2 text-sm leading-relaxed">
        <p>
          {courses.length === 1 ? (
            <>
              O curso <strong>{courses[0].courseTitle}</strong> tem{' '}
              <strong>{courses[0].openCount} turmas abertas</strong> ao mesmo tempo.
            </>
          ) : (
            <>
              Há cursos com mais de uma turma aberta simultaneamente. Inscrições devem
              sempre indicar a <strong>turma correta</strong>.
            </>
          )}
        </p>
        <p className="text-muted-foreground">
          Recomendamos encerrar a turma anterior antes de abrir outra. Ao inscrever usuários,
          confira a coluna <strong>Turma</strong> (nome e data de início).
        </p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {courses.map(c => (
            <li key={c.courseId}>
              <Link
                href={`${turmasBasePath}?course_id=${c.courseId}&status=open`}
                className="font-medium text-primary-600 underline dark:text-primary-400"
              >
                {c.courseTitle}
              </Link>
              {' '}— {c.openCount} turmas abertas
            </li>
          ))}
        </ul>
      </div>
    </Alert>
  )
}
