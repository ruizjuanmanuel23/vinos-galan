import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '../services/auth'

import { Link } from 'react-router-dom'

const nav = [
  { to: '/app',             label: 'Inicio',          short: 'Inicio',   icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10', exact: true },
  { to: '/app/viajes',       label: 'Viajes',          short: 'Viajes',   icon: 'M5 18a3 3 0 0 0 6 0M13 18a3 3 0 0 0 6 0M3 6h11l3 6h4v6h-3 M5 14h2' },
  { to: '/app/clientes',     label: 'Clientes',        short: 'Clientes', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { to: '/app/vinos',        label: 'Stock de vinos',  short: 'Stock',    icon: 'M8 2v6a4 4 0 0 0 8 0V2 M8 2h8M12 12v10M8 22h8' },
  { to: '/app/ventas/nueva', label: 'Nueva venta',     short: 'Vender',   icon: 'M9 7V3h6v4M3 7h18l-2 13H5L3 7z M9 11v6M15 11v6' },
]

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((s, i) => <path key={i} d={i === 0 ? s : 'M' + s} />)}
    </svg>
  )
}

export default function Layout() {
  const navigate = useNavigate()

  const cerrarSesion = () => {
    if (confirm('¿Cerrar sesión? Vas a salir del sistema interno.')) {
      logout()
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ========== SIDEBAR — solo desktop ========== */}
      <aside
        className="hidden lg:flex group/sidebar bg-botella-900 text-white flex-col shrink-0 sticky top-0 h-screen z-40
                   w-16 hover:w-60 transition-[width] duration-300 ease-in-out overflow-hidden shadow-xl"
      >
        {/* Logo — click vuelve a la landing */}
        <Link to="/" title="Volver al inicio" className="h-[68px] flex items-center px-3 border-b border-botella-800 shrink-0 hover:bg-botella-800/50 transition">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-botella-600 to-botella-800 ring-2 ring-dorado-400/40 flex items-center justify-center shadow shrink-0">
            <span className="text-dorado-300 font-black text-base leading-none" style={{ fontFamily: 'Georgia, serif' }}>VG</span>
          </div>
          <div className="ml-3 leading-tight opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <div className="font-black tracking-wide text-sm">VINOS GALAN</div>
            <div className="text-[10px] text-dorado-300 tracking-widest uppercase">La Plata · Desde 1942</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.exact}
              title={n.label}
              className={({ isActive }) =>
                `flex items-center h-11 px-3 rounded-lg text-sm font-semibold transition ${
                  isActive ? 'bg-botella-700 text-white shadow-inner' : 'text-botella-100 hover:bg-botella-800 hover:text-white'
                }`
              }
            >
              <NavIcon d={n.icon} />
              <span className="ml-3 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                {n.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Botón cerrar sesión */}
        <button
          onClick={cerrarSesion}
          title="Cerrar sesión"
          className="flex items-center h-11 px-3 mx-2 mb-2 rounded-lg text-sm font-semibold text-botella-200 hover:bg-red-700/40 hover:text-white transition"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="ml-3 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">Cerrar sesión</span>
        </button>

        <div className="h-10 px-3 border-t border-botella-800 flex items-center text-[10px] text-botella-300 tracking-wider uppercase whitespace-nowrap overflow-hidden">
          <span className="shrink-0">v1.0</span>
          <span className="ml-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">· Sistema</span>
        </div>
      </aside>

      {/* ========== MAIN ========== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar — solo mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-botella-900 text-white shadow" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <Link to="/" className="px-4 py-3 flex items-center gap-3 active:bg-botella-800 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-botella-600 to-botella-800 ring-2 ring-dorado-400/40 flex items-center justify-center shadow shrink-0">
              <span className="text-dorado-300 font-black text-sm leading-none" style={{ fontFamily: 'Georgia, serif' }}>VG</span>
            </div>
            <div className="leading-tight">
              <div className="font-black tracking-wide text-sm">VINOS GALAN</div>
              <div className="text-[9px] text-dorado-300 tracking-widest uppercase">La Plata · Desde 1942</div>
            </div>
          </Link>
        </header>

        <main className="flex-1 pb-24 lg:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
            <Outlet />
          </div>
        </main>

        {/* Bottom nav — solo mobile */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="grid grid-cols-5">
            {nav.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.exact}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 transition ${isActive ? 'text-botella-700' : 'text-gray-400 active:text-gray-700'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                      {n.icon.split(' M').map((s, i) => <path key={i} d={i === 0 ? s : 'M' + s} />)}
                    </svg>
                    <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-medium'}`}>{n.short}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
