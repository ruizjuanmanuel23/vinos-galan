import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-botella-950 via-botella-900 to-botella-800 flex flex-col">
      {/* Patrón decorativo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-dorado-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-72 h-72 bg-botella-400 rounded-full blur-3xl" />
      </div>

      {/* Header pequeño */}
      <header className="relative px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-botella-600 to-botella-800 ring-2 ring-dorado-400/40 flex items-center justify-center shadow">
              <span className="text-dorado-300 font-black text-base leading-none" style={{ fontFamily: 'Georgia, serif' }}>VG</span>
            </div>
            <div className="leading-tight">
              <div className="font-black tracking-wide text-white text-sm sm:text-base">VINOS GALAN</div>
              <div className="text-[10px] text-dorado-300 tracking-widest uppercase">Distribución</div>
            </div>
          </div>
          <Link to="/app" className="text-xs sm:text-sm text-botella-200 hover:text-white border border-botella-700 hover:border-dorado-400 px-3 sm:px-4 py-2 rounded-lg transition">
            Ingresar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl w-full text-center space-y-10">
          {/* Logo grande */}
          <div className="flex justify-center">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-botella-600 to-botella-800 ring-4 ring-dorado-400/40 flex items-center justify-center shadow-2xl">
              <span className="text-dorado-300 font-black text-5xl sm:text-6xl leading-none" style={{ fontFamily: 'Georgia, serif' }}>VG</span>
            </div>
          </div>

          {/* Título + tagline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Vinos Galán
            </h1>
            <p className="text-dorado-300 text-sm sm:text-base tracking-[0.3em] uppercase font-semibold">
              · Distribución y reparto ·
            </p>
            <p className="text-botella-200 text-base sm:text-lg max-w-xl mx-auto pt-3">
              Sistema de gestión para nuestro negocio de venta y reparto de vinos.
              Clientes, stock, ventas y recorridos en un solo lugar.
            </p>
          </div>

          {/* Botones grandes */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-xl mx-auto pt-4">
            <a
              href="/app/vinos-galan.apk"
              download
              className="flex-1 group bg-dorado-500 hover:bg-dorado-400 text-botella-950 font-black rounded-2xl px-6 py-5 sm:py-6 transition shadow-2xl hover:shadow-dorado-500/30 active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-3">
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <div className="text-left leading-tight">
                  <div className="text-lg sm:text-xl">Descargar APK</div>
                  <div className="text-[10px] sm:text-xs font-medium opacity-80 tracking-wider uppercase">Android · Instalar en celular</div>
                </div>
              </div>
            </a>

            <Link
              to="/app"
              className="flex-1 group bg-botella-700/40 hover:bg-botella-700/60 border-2 border-botella-600 hover:border-dorado-400 text-white font-bold rounded-2xl px-6 py-5 sm:py-6 transition shadow-xl active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-3">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-dorado-300" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                <div className="text-left leading-tight">
                  <div className="text-lg sm:text-xl">Acceso interno</div>
                  <div className="text-[10px] sm:text-xs font-medium opacity-80 tracking-wider uppercase">Abrir en este navegador</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Features cortos */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto pt-8 border-t border-botella-700/50">
            {[
              { ic: '👥', t: 'Clientes', d: 'Fichas con día de reparto' },
              { ic: '🚚', t: 'Recorridos', d: 'Armá viajes por día' },
              { ic: '🍷', t: 'Stock', d: 'Inventario y precios' },
            ].map(f => (
              <div key={f.t} className="text-center">
                <div className="text-2xl sm:text-3xl mb-1">{f.ic}</div>
                <div className="text-xs sm:text-sm font-bold text-white">{f.t}</div>
                <div className="text-[10px] sm:text-xs text-botella-300 mt-0.5">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative px-6 py-4 border-t border-botella-700/50">
        <div className="max-w-5xl mx-auto text-center text-xs text-botella-400">
          © {new Date().getFullYear()} Vinos Galán · Sistema interno
        </div>
      </footer>
    </div>
  )
}
