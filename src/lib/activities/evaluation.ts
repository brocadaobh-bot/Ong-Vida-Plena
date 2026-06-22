export type ActivityDef = {
  id: string
  title: string
  max_score: number
  min_passing_score: number
}

export type GradeRow = {
  activity_id: string
  score: number
  feedback?: string | null
}

export type ActivityEvaluation = {
  activitiesMet: boolean
  summary: string
  averageScore: number | null
  passedCount: number
  totalCount: number
  gradedCount: number
}

export function evaluateStudentActivities(
  activities: ActivityDef[],
  grades: GradeRow[],
): ActivityEvaluation {
  const totalCount = activities.length

  if (totalCount === 0) {
    return {
      activitiesMet: true,
      summary: 'Nenhuma atividade cadastrada',
      averageScore: null,
      passedCount: 0,
      totalCount: 0,
      gradedCount: 0,
    }
  }

  const gradeByActivity = new Map(grades.map(g => [g.activity_id, g]))
  let passedCount = 0
  let gradedCount = 0
  let scoreSum = 0

  for (const activity of activities) {
    const grade = gradeByActivity.get(activity.id)
    if (!grade) continue

    gradedCount++
    scoreSum += grade.score
    if (grade.score >= activity.min_passing_score) {
      passedCount++
    }
  }

  const allGraded = gradedCount === totalCount
  const allPassed = passedCount === totalCount
  const activitiesMet = allGraded && allPassed
  const averageScore = gradedCount > 0 ? Math.round((scoreSum / gradedCount) * 100) / 100 : null

  let summary: string
  if (!allGraded) {
    summary = `${gradedCount}/${totalCount} atividade(s) avaliada(s)`
  } else if (allPassed) {
    summary = `Média ${averageScore} — aprovado nas atividades`
  } else {
    summary = `${passedCount}/${totalCount} atividade(s) com nota mínima`
  }

  return {
    activitiesMet,
    summary,
    averageScore,
    passedCount,
    totalCount,
    gradedCount,
  }
}

export function normalizeScore(value: number, maxScore: number): number {
  if (value < 0) return 0
  if (value > maxScore) return maxScore
  return Math.round(value * 100) / 100
}
