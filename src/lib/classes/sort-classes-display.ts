type ClassDisplayRow = {
  start_date: string
  status: string
  name: string
  courses?: { title?: string } | null
}

/** Agrupa visualmente turmas do mesmo curso na listagem administrativa. */
export function sortClassesForAdminDisplay<T extends ClassDisplayRow>(classes: T[]): T[] {
  return [...classes].sort((a, b) => {
    const byCourse = (a.courses?.title ?? '').localeCompare(b.courses?.title ?? '', 'pt-BR')
    if (byCourse !== 0) return byCourse

    if (a.status === 'open' && b.status !== 'open') return -1
    if (b.status === 'open' && a.status !== 'open') return 1

    const byName = a.name.localeCompare(b.name, 'pt-BR')
    if (byName !== 0) return byName

    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  })
}
