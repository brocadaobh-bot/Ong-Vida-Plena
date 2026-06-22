import { createClient } from '@/lib/supabase/server'
import type { CourseCategory, CourseStatus } from '@/types/database'
import type { Course, ClassItem } from '@/types/domain'

export async function getCourses(options?: {
  status?: string
  category?: string
  search?: string
}): Promise<Course[]> {
  const supabase = await createClient()

  let query = supabase
    .from('courses')
    .select('*')
    .order('title')

  if (options?.status) query = query.eq('status', options.status as CourseStatus)
  if (options?.category) query = query.eq('category', options.category as CourseCategory)
  if (options?.search) query = query.ilike('title', `%${options.search}%`)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Course[]
}

export async function getCourseById(id: string): Promise<Course | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Course
}

export async function getClassesForCourse(courseId: string): Promise<ClassItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select('*, profiles!instructor_id(id, full_name, email)')
    .eq('course_id', courseId)
    .order('start_date')

  if (error) throw error
  return (data ?? []) as unknown as ClassItem[]
}

export async function getOpenClasses(): Promise<ClassItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select('*, courses(id, title, category, workload_hours)')
    .eq('status', 'open')
    .order('start_date')

  if (error) throw error
  return (data ?? []) as unknown as ClassItem[]
}

export async function getClassById(id: string): Promise<ClassItem | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select('*, courses(*), profiles!instructor_id(id, full_name, email)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as ClassItem
}

export async function getClassSessions(classId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('class_sessions')
    .select('*')
    .eq('class_id', classId)
    .order('session_date')

  if (error) throw error
  return data ?? []
}

export async function getInstructorClasses(instructorId: string): Promise<ClassItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select('*, courses(id, title, category)')
    .eq('instructor_id', instructorId)
    .in('status', ['open', 'in_progress', 'planned'])
    .order('start_date')

  if (error) throw error
  return (data ?? []) as unknown as ClassItem[]
}
