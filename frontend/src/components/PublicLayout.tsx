import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import PasswordModal from './PasswordModal'
import { isAuth } from '../services/auth'

const menu = [
  { to: '/',          label: 'Inicio',    exact: true },
  { to: '/catalogo',  label: 'Catálogo'   },
  { to: '/nosotros',  label: 'Historia'   },
  { to: '/contacto',  label: 'Contacto'   },
]

export default function PublicLayout() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pwdOpen, setPwdOpen]     = useState(false)
  const [pwdAction, setPwdAction] = useState<'app' | 'apk'>('app')
  const drawerRef = useRef<HTMLDivElement>(null)
  const loc = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setDrawerOpen(false)
  }, [loc.pathname])

  // Cerrar drawer al click afuera
  useEffect(() => {
    if (!drawerOpen) return
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setDrawerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [drawerOpen])

  const isHome = loc.pathname === '/'

  // Abrir sistema interno: si está logueado entra directo, si no pide clave
  const handleAppClick = () => {
    setDrawerOpen(false)
    if (isAuth()) {
      navigate('/app')
    } else {
      setPwdAction('app')
      setPwdOpen(true)
    }
  }

  // Descargar APK: si está logueado descarga directo, si no pide clave
  const handleApkClick = () => {
    setDrawerOpen(false)
    if (isAuth()) {
      window.location.href = '/vinos-galan.apk'
    } else {
      setPwdAction('apk')
      setPwdOpen(true)
    }
  }

  const handlePwdSuccess = () => {
    if (pwdAction === 'app') navigate('/app')
    else window.location.href = '/vinos-galan.apk'
  }

  return (
    <div className="min-h-screen flex flex-col bg-botella-950 text-white">
      {/* HEADER */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled || !isHome
            ? 'bg-botella-950/95 backdrop-blur-md border-b border-botella-800/70 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-20 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0 select-none">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-botella-600 to-botella-800 ring-2 ring-dorado-400/50 flex items-center justify-center shadow-lg">
                <span className="text-dorado-300 font-black text-base sm:text-lg leading-none" style={{ fontFamily: 'Georgia, serif' }}>VG</span>
              </div>
              <div className="leading-tight">
                <div className="font-black tracking-wide text-sm sm:text-base">VINOS GALAN</div>
                <div className="text-[9px] sm:text-[10px] text-dorado-300 tracking-[0.2em] uppercase">La Plata · 1942</div>
              </div>
            </Link>

            {/* Menú desktop */}
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {menu.map(m => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  end={m.exact}
                  className={({ isActive }) =>
                    `relative px-4 py-2 text-sm font-semibold transition ${
                      isActive ? 'text-dorado-300' : 'text-botella-100 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {m.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-dorado-400" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Hamburguesa derecha (siempre visible) */}
            <div className="flex items-center gap-2 shrink-0" ref={drawerRef}>
              <button
                onClick={() => setDrawerOpen(o => !o)}
                className={`p-2.5 rounded-lg transition border ${
                  drawerOpen
                    ? 'bg-dorado-500 border-dorado-500 text-botella-950'
                    : 'border-botella-700 hover:border-dorado-400 text-botella-100 hover:bg-botella-800/50'
                }`}
                aria-label="Menú de acceso"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  {drawerOpen
                    ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                    : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
                </svg>
              </button>

              {/* Drawer/dropdown del menú hamburguesa */}
              {drawerOpen && (
                <div className="absolute top-full right-4 sm:right-6 lg:right-8 mt-2 w-72 rounded-2xl bg-botella-900 border border-botella-700/80 shadow-2xl overflow-hidden">
                  {/* Header drawer */}
                  <div className="px-5 py-4 bg-gradient-to-r from-botella-800 to-botella-900 border-b border-botella-700/60">
                    <p className="text-[10px] text-dorado-300 tracking-[0.25em] uppercase font-bold">Acceso</p>
                    <p className="text-sm text-botella-200 mt-0.5">Sistema interno y app</p>
                  </div>

                  {/* Acceso interno */}
                  <button
                    onClick={handleAppClick}
                    className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-botella-800/70 transition border-b border-botella-800/60"
                  >
                    <div className="w-10 h-10 rounded-xl bg-botella-700/40 border border-botella-600 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-dorado-300" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-sm">🔐 Acceso interno</p>
                      <p className="text-[11px] text-botella-300 mt-0.5">
                        {isAuth() ? 'Ya estás logueado · Entrar al sistema' : 'Requiere clave de acceso'}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-botella-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Descargar APK */}
                  <button
                    onClick={handleApkClick}
                    className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-botella-800/70 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-dorado-500/15 border border-dorado-500/40 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-dorado-300" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-sm">📱 Descargar APK</p>
                      <p className="text-[11px] text-botella-300 mt-0.5">
                        App Android · 1.1 MB · Requiere clave
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-botella-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Menú navegación en mobile (queda más compacto) */}
                  <div className="md:hidden border-t border-botella-800/60 py-2">
                    <p className="px-5 py-2 text-[10px] text-dorado-300 tracking-[0.25em] uppercase font-bold">Navegación</p>
                    {menu.map(m => (
                      <NavLink
                        key={m.to}
                        to={m.to}
                        end={m.exact}
                        className={({ isActive }) =>
                          `block px-5 py-2.5 text-sm font-semibold transition ${
                            isActive ? 'text-dorado-300 bg-botella-800/50' : 'text-botella-100 active:bg-botella-800/40'
                          }`
                        }
                      >
                        {m.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modal de clave */}
      <PasswordModal
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        onSuccess={handlePwdSuccess}
        title={pwdAction === 'app' ? 'Acceso al sistema' : 'Descarga de la app'}
        subtitle={pwdAction === 'app'
          ? 'Ingresá la clave para entrar al panel interno'
          : 'Ingresá la clave para descargar el APK'}
      />

      {/* CONTENIDO */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-botella-950 border-t border-botella-800/60 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-botella-600 to-botella-800 ring-2 ring-dorado-400/40 flex items-center justify-center">
                <span className="text-dorado-300 font-black text-lg" style={{ fontFamily: 'Georgia, serif' }}>VG</span>
              </div>
              <div>
                <div className="font-black tracking-wide text-lg">VINOS GALAN</div>
                <div className="text-[11px] text-dorado-300 tracking-[0.25em] uppercase">La Plata · Desde 1942</div>
              </div>
            </div>
            <p className="text-sm text-botella-300 max-w-md leading-relaxed">
              Más de ochenta años distribuyendo vinos en la ciudad. Tradición familiar, calidad que se hereda y el reparto a domicilio de siempre.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-dorado-300 text-xs uppercase tracking-widest mb-3">Sitio</h4>
            <ul className="space-y-2 text-sm">
              {menu.map(m => (
                <li key={m.to}>
                  <Link to={m.to} className="text-botella-200 hover:text-white transition">{m.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-dorado-300 text-xs uppercase tracking-widest mb-3">Contacto</h4>
            <ul className="space-y-2 text-sm text-botella-200">
              <li>📍 Calle 45 entre 22 y 23</li>
              <li>📍 La Plata, Buenos Aires</li>
              <li>
                <a href="tel:+5492216384423" className="hover:text-white transition">📞 (221) 638-4423</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-botella-800/60 py-5 text-center text-xs text-botella-400">
          © {new Date().getFullYear()} Vinos Galán La Plata · Distribuidora de vinos desde 1942
        </div>
      </footer>
    </div>
  )
}
