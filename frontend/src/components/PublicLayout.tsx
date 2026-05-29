import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const menu = [
  { to: '/',          label: 'Inicio',    exact: true },
  { to: '/catalogo',  label: 'Catálogo'   },
  { to: '/nosotros',  label: 'Historia'   },
  { to: '/contacto',  label: 'Contacto'   },
]

export default function PublicLayout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const loc = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [loc.pathname])

  // Header transparente solo en /, sólido en otras
  const isHome = loc.pathname === '/'

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
            <nav className="hidden md:flex items-center gap-1">
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

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/app"
                className="px-4 py-2 text-xs font-bold rounded-lg border border-botella-700 hover:border-dorado-400 hover:bg-botella-800/50 text-botella-100 hover:text-white transition"
              >
                Acceso interno
              </Link>
              <a
                href="/vinos-galan.apk"
                download
                className="px-4 py-2 text-xs font-bold rounded-lg bg-dorado-500 hover:bg-dorado-400 text-botella-950 transition flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                APK
              </a>
            </div>

            {/* Toggle mobile */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-botella-800/50 transition"
              aria-label="Menú"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                  : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
              </svg>
            </button>
          </div>

          {/* Menú mobile (drawer) */}
          {menuOpen && (
            <div className="md:hidden border-t border-botella-800 pb-4 pt-2 space-y-1">
              {menu.map(m => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  end={m.exact}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg text-sm font-semibold transition ${
                      isActive ? 'bg-botella-800 text-dorado-300' : 'text-botella-100 active:bg-botella-800/70'
                    }`
                  }
                >
                  {m.label}
                </NavLink>
              ))}
              <div className="pt-2 grid grid-cols-2 gap-2 px-1">
                <Link
                  to="/app"
                  className="px-4 py-3 text-center text-xs font-bold rounded-lg border border-botella-700 text-botella-100"
                >
                  Acceso interno
                </Link>
                <a
                  href="/vinos-galan.apk"
                  download
                  className="px-4 py-3 text-center text-xs font-bold rounded-lg bg-dorado-500 text-botella-950"
                >
                  ↓ Descargar APK
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

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
                <a href="tel:+542214567890" className="hover:text-white transition">📞 (221) 456-7890</a>
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
