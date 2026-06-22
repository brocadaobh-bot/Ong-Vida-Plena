export const REMEMBER_LOGIN_COOKIE = 'vp_remember_login'
export const REMEMBER_LOGIN_LOCAL_KEY = 'vp_remember_login'
export const REMEMBER_LOGIN_MAX_AGE_SEC = 60 * 60 * 24 * 30 // 30 dias

export function isRememberLoginCookie(value: string | undefined): boolean {
  return value === '1'
}
