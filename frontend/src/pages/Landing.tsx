import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CATALOGO_DESTACADO, IMG } from '../data/catalogoDestacado'
import { vinosAPI } from '../services/storage'
import { isAuth } from '../services/auth'
import PasswordModal from '../components/PasswordModal'

export default function Landing() {
  const navigate = useNavigate()
  const [pwdOpen, setPwdOpen] = useState(false)

  const handleApk = (e: React.MouseEvent) => {
    if (isAuth()) return // deja el download nativo
    e.preventDefault()
    setPwdOpen(true)
  }

  // Si la app se abre desde el ícono instalado (APK / PWA standalone), saltea la landing
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.startsWith('android-app://')
    if (isStandalone) navigate('/app', { replace: true })
  }, [navigate])

  // Vinos para mostrar: los que cargó Nahue + (si está vacío) el catálogo destacado
  const vinosCargados = vinosAPI.listActivos().filter(v => v.mostrarEnCatalogo !== false && v.stock > 0)
  const destacados = vinosCargados.length > 0
    ? vinosCargados.slice(0, 4).map(v => ({
        nombre: v.nombre,
        bodega: v.bodega,
        varietal: v.varietal,
        precioVenta: v.precioVenta,
        fotoUrl: v.fotoUrl || CATALOGO_DESTACADO[0].fotoUrl,
        descripcion: v.descripcion || '',
      }))
    : CATALOGO_DESTACADO.slice(0, 4)

  return (
    <div className="text-white">
      <PasswordModal
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        onSuccess={() => { window.location.href = '/vinos-galan.apk' }}
        title="Descarga de la app"
        subtitle="Ingresá la clave para descargar el APK"
      />
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Imagen de fondo */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${IMG.heroVineyard})` }}
        />
        {/* Overlay oscuro con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-botella-950/85 via-botella-950/75 to-botella-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-botella-950/60 via-transparent to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dorado-500/15 border border-dorado-500/30 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-dorado-400 animate-pulse" />
            <span className="text-xs font-semibold text-dorado-300 tracking-[0.25em] uppercase">Desde 1942 · La Plata</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-4 leading-none" style={{ fontFamily: 'Georgia, serif' }}>
            Vinos Galán
          </h1>
          <p className="text-base sm:text-lg text-dorado-300 tracking-[0.3em] uppercase font-semibold mb-6">
            Distribuidora & Reparto
          </p>

          <p className="text-lg sm:text-xl text-botella-100 max-w-3xl mx-auto leading-relaxed mb-10">
            Más de ocho décadas llevando el mejor vino a las mesas platenses.
            Una tradición familiar que arrancó con un carro tirado por caballos
            y hoy sigue, con el mismo cariño, eligiendo botella por botella.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xl mx-auto">
            <Link
              to="/catalogo"
              className="px-6 py-4 rounded-xl bg-dorado-500 hover:bg-dorado-400 text-botella-950 font-black text-base sm:text-lg shadow-2xl hover:shadow-dorado-500/40 transition active:scale-[0.98] flex-1"
            >
              🍷 Ver catálogo
            </Link>
            <a
              href="/vinos-galan.apk"
              download
              onClick={handleApk}
              className="px-6 py-4 rounded-xl bg-botella-800/40 hover:bg-botella-700/50 border-2 border-botella-600 hover:border-dorado-400 text-white font-bold text-base sm:text-lg transition active:scale-[0.98] flex-1 backdrop-blur-sm"
            >
              📱 Descargar app
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mt-16 pt-8 border-t border-botella-700/40">
            {[
              { n: '80+', l: 'Años de historia' },
              { n: '15+', l: 'Varietales' },
              { n: '∞', l: 'Brindis compartidos' },
            ].map(s => (
              <div key={s.l}>
                <div className="text-3xl sm:text-5xl font-black text-dorado-400 leading-none" style={{ fontFamily: 'Georgia, serif' }}>{s.n}</div>
                <div className="text-[10px] sm:text-xs text-botella-300 tracking-widest uppercase mt-2">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-dorado-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="relative py-24 bg-botella-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden ring-1 ring-dorado-500/20 shadow-2xl">
              <img src={IMG.cellar} alt="Bodega" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-dorado-500 text-botella-950 px-6 py-4 rounded-xl shadow-2xl">
              <div className="text-4xl font-black leading-none" style={{ fontFamily: 'Georgia, serif' }}>1942</div>
              <div className="text-[10px] tracking-widest uppercase font-bold mt-1">Año fundación</div>
            </div>
          </div>

          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-dorado-400 font-semibold mb-3">Nuestra historia</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Una tradición<br />que cruzó el Atlántico
            </h2>
            <div className="space-y-4 text-botella-200 leading-relaxed">
              <p>
                Todo empezó en <strong className="text-white">1942</strong>, cuando <strong className="text-white">Antonio González</strong> llegó desde Lamela, en Pontevedra, España.
                Con la determinación de los que cruzaron el océano sin red, armó su reparto
                de vinos con un carro tirado por caballos.
              </p>
              <p>
                Esa empresa familiar se fue agrandando con sucursales en Campana, Junín,
                Azul, Mar del Plata y <strong className="text-dorado-300">La Plata</strong>. En 1972, Antonio compró su primer campo en
                San Martín, Mendoza. Cinco años después se inauguraba la bodega propia.
              </p>
              <p className="italic text-dorado-200 border-l-2 border-dorado-500/50 pl-4">
                "El repartidor de Vinos Galán siempre fue un amigo de la casa. Más familiar que el cartero o el sodero."
              </p>
              <p>
                Hoy seguimos en La Plata, en la misma calle 45 entre 22 y 23, eligiendo vinos
                con el mismo criterio de Antonio y llevándolos a la mesa de cada cliente con
                el respeto que se merece la tradición.
              </p>
            </div>
            <Link
              to="/nosotros"
              className="inline-flex items-center gap-2 mt-8 text-dorado-300 hover:text-dorado-200 font-semibold transition"
            >
              Conocé más de nuestra historia
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="relative py-24 bg-gradient-to-b from-botella-900 to-botella-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs tracking-[0.3em] uppercase text-dorado-400 font-semibold mb-3">Catálogo</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Vinos destacados
            </h2>
            <p className="text-botella-300">
              Una selección de nuestras etiquetas más pedidas, desde el Malbec emblema
              hasta el clásico tinto de damajuana.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {destacados.map((v, i) => (
              <div
                key={i}
                className="group bg-botella-900/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-botella-700/40 hover:border-dorado-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-dorado-500/10"
              >
                <div className="aspect-square overflow-hidden bg-botella-950 relative">
                  <img
                    src={v.fotoUrl}
                    alt={v.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-botella-950 via-transparent to-transparent opacity-60" />
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-dorado-400 tracking-widest uppercase font-bold mb-1">{v.varietal}</p>
                  <h3 className="font-black text-lg mb-1" style={{ fontFamily: 'Georgia, serif' }}>{v.nombre}</h3>
                  <p className="text-xs text-botella-300 mb-3">{v.bodega}</p>
                  {v.descripcion && (
                    <p className="text-xs text-botella-200 leading-relaxed mb-3 line-clamp-2">{v.descripcion}</p>
                  )}
                  <div className="text-2xl font-black text-dorado-300">
                    ${v.precioVenta.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-botella-800 hover:bg-botella-700 border border-botella-600 hover:border-dorado-500 text-white font-bold transition"
            >
              Ver catálogo completo
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-botella-950 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMG.heroBarrels})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-botella-950 via-botella-950/80 to-botella-950" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] uppercase text-dorado-400 font-semibold mb-3">Por qué Galán</p>
            <h2 className="text-4xl sm:text-5xl font-black" style={{ fontFamily: 'Georgia, serif' }}>
              Lo que nos hace distintos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { ic: '🚚', t: 'Reparto a domicilio', d: 'Llevamos el pedido hasta la puerta de tu casa o local.' },
              { ic: '🍇', t: 'Selección propia', d: 'Cada etiqueta pasa por nuestra cata antes de llegar al estante.' },
              { ic: '🤝', t: 'Trato familiar', d: 'Más de tres generaciones atendiendo personalmente a la clientela.' },
            ].map(f => (
              <div key={f.t} className="bg-botella-900/40 backdrop-blur-sm rounded-2xl p-8 border border-botella-700/40 text-center hover:border-dorado-500/30 transition">
                <div className="text-5xl mb-4">{f.ic}</div>
                <h3 className="font-black text-xl mb-2" style={{ fontFamily: 'Georgia, serif' }}>{f.t}</h3>
                <p className="text-sm text-botella-300 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA DESCARGAR APP */}
      <section className="py-24 bg-gradient-to-br from-dorado-500/10 via-botella-950 to-botella-900 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-dorado-400 font-semibold mb-3">App móvil</p>
            <h2 className="text-3xl sm:text-5xl font-black mb-5 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Llevá Vinos Galán<br />en el bolsillo
            </h2>
            <p className="text-botella-200 leading-relaxed mb-8">
              Instalá nuestra app en tu celular para ver el catálogo, hacer pedidos y mantenerte
              al día con las novedades. Funciona sin conexión y se actualiza sola.
            </p>
            <a
              href="/vinos-galan.apk"
              download
              onClick={handleApk}
              className="inline-flex items-center gap-3 px-7 py-4 rounded-xl bg-dorado-500 hover:bg-dorado-400 text-botella-950 font-black text-lg shadow-2xl hover:shadow-dorado-500/40 transition active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar APK Android
            </a>
            <p className="text-xs text-botella-400 mt-3">1.1 MB · Firmada · Sin permisos extra</p>
          </div>

          <div className="relative">
            <div className="aspect-[3/4] rounded-3xl overflow-hidden ring-1 ring-dorado-500/30 shadow-2xl">
              <img src={IMG.heroPour} alt="App" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-4 -left-4 bg-botella-900 border border-dorado-500/50 px-4 py-2 rounded-xl shadow-2xl">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Disponible ahora
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
