/**
 * Auth simple del lado del cliente.
 * No es seguridad real (alguien con devtools podría saltarla), pero alcanza
 * para evitar que cualquier persona que llegue a la URL pueda entrar al sistema.
 *
 * Clave: edlp
 */
const KEY = 'vg.auth'
const PASSWORD = 'edlp'

export function isAuth(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export function login(password: string): boolean {
  if (password.trim().toLowerCase() === PASSWORD) {
    try { localStorage.setItem(KEY, '1') } catch {}
    return true
  }
  return false
}

export function logout(): void {
  try { localStorage.removeItem(KEY) } catch {}
}
