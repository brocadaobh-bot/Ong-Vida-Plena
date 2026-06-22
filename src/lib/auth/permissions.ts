import type { UserRole } from '@/types/database'

// ─────────────────────────────────────────────────────────────
// Definição de permissões por papel
// ─────────────────────────────────────────────────────────────

type Permission =
  // Usuários
  | 'users.view_all'
  | 'users.create'
  | 'users.edit'
  | 'users.change_role'
  | 'users.block'
  // Beneficiários
  | 'beneficiaries.view_all'
  | 'beneficiaries.create'
  | 'beneficiaries.edit'
  | 'beneficiaries.delete'
  | 'beneficiaries.view_sensitive'
  // Cursos
  | 'courses.view'
  | 'courses.create'
  | 'courses.edit'
  | 'courses.delete'
  | 'courses.publish'
  // Turmas
  | 'classes.view_all'
  | 'classes.view_own'
  | 'classes.create'
  | 'classes.edit'
  | 'classes.cancel'
  // Inscrições
  | 'enrollments.view_all'
  | 'enrollments.view_own'
  | 'enrollments.create_for_others'
  | 'enrollments.cancel'
  | 'enrollments.approve'
  // Presença
  | 'attendance.record'
  | 'attendance.view_all'
  | 'attendance.view_own'
  // Relatórios
  | 'reports.operational'
  | 'reports.full'
  // LGPD
  | 'lgpd.view_requests'
  | 'lgpd.process_requests'
  | 'lgpd.manage_policies'
  // Auditoria
  | 'audit.view'
  // Configurações
  | 'settings.manage'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'users.view_all', 'users.create', 'users.edit', 'users.change_role', 'users.block',
    'beneficiaries.view_all', 'beneficiaries.create', 'beneficiaries.edit',
    'beneficiaries.delete', 'beneficiaries.view_sensitive',
    'courses.view', 'courses.create', 'courses.edit', 'courses.delete', 'courses.publish',
    'classes.view_all', 'classes.create', 'classes.edit', 'classes.cancel',
    'enrollments.view_all', 'enrollments.create_for_others', 'enrollments.cancel', 'enrollments.approve',
    'attendance.record', 'attendance.view_all',
    'reports.operational', 'reports.full',
    'lgpd.view_requests', 'lgpd.process_requests', 'lgpd.manage_policies',
    'audit.view',
    'settings.manage',
  ],
  assistant: [
    'users.view_all',
    'beneficiaries.view_all', 'beneficiaries.create', 'beneficiaries.edit',
    'courses.view',
    'classes.view_all', 'classes.create', 'classes.edit',
    'enrollments.view_all', 'enrollments.create_for_others', 'enrollments.cancel',
    'attendance.view_all',
    'reports.operational',
    'lgpd.view_requests',
  ],
  instructor: [
    'classes.view_own',
    'enrollments.view_own',
    'attendance.record', 'attendance.view_own',
  ],
  beneficiary: [
    'courses.view',
    'enrollments.view_own',
    'attendance.view_own',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

// Guards tipados para uso em Server Actions
export function requireAdmin(role: UserRole): void {
  if (role !== 'admin') throw new Error('Permissão negada: requer papel de Administrador.')
}

export function requireAdminOrAssistant(role: UserRole): void {
  if (!['admin', 'assistant'].includes(role)) {
    throw new Error('Permissão negada: requer papel de Administrador ou Assistente.')
  }
}

export function requireInstructor(role: UserRole): void {
  if (!['admin', 'assistant', 'instructor'].includes(role)) {
    throw new Error('Permissão negada: requer papel de Instrutor ou superior.')
  }
}

export function requireAuthenticated(userId: string | undefined): asserts userId is string {
  if (!userId) throw new Error('Não autenticado.')
}
