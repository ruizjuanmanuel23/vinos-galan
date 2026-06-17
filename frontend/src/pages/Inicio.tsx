import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { resumenAPI, type ResumenDia } from '../services/storage'
import { diaSemanaHoy, DIA_LABEL, type Cliente, type Viaje } from '../types'

const fmtPlata = (n: number) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })

export default function Inicio() {
  const [clientesHoy, setClientesHoy] = useState<Cliente[]>([])
  const [viajeActivo, setViajeActivo] = useState<Viaje | null>(null)
  const [stats, setStats] = useState({ clientes: 0, vinos: 0, stockBajo: 0 })
  const [resumenDia, setResumenDia] = useState<ResumenDia | null>(null)
  const dia = diaSemanaHoy()

  const hoy = new Date()
  const fechaTexto = hoy.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const horaActual = hoy.getHours()
  const saludo =
    horaActual < 12 ? 'Buen día' :
    horaActual < 19 ? 'Buenas tardes' : 'Buenas noches'

  useEffect(() => {
    setResumenDia(resumenAPI.delDia())
    api.get<Cliente[]>(`/clientes/dia/${dia}`).then(r => setClientesHoy(r.data)).catch(() => {})
    api.get<Viaje[]>('/viajes').then(r => {
      const enCurso = r.data.find(v => v.estado === 'EN_CURSO')
      if (enCurso) setViajeActivo(enCurso)
    }).catch(() => {})
    Promise.all([api.get('/clientes'), api.get('/vinos/admin')]).then(([c, v]) => {
      const activos = v.data.filter((x: any) => x.activo)
      setStats({
        clientes: c.data.length,
        vinos: activos.length,
        stockBajo: activos.filter((x: any) => x.stock <= 5).length,
      })
    }).catch(() => {})
  }, [dia])

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER pro */}
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 capitalize tracking-wide">{fechaTexto}</p>
          <h1 className="text-3xl sm:text-4xl font-black text-botella-900 mt-0.5 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            {saludo}
          </h1>
        </div>
        <Link to="/app/viajes/nuevo" className="btn-dorado">+ Nuevo viaje</Link>
      </header>

      {/* VIAJE EN CURSO destacado */}
      {viajeActivo && (
        <Link to={`/app/viajes/${viajeActivo.id}`} className="block card p-4 sm:p-5 border-l-4 border-dorado-500 hover:shadow-md transition group">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-dorado-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-dorado-700">Viaje en curso</span>
              </div>
              <p className="font-black text-botella-900 text-base sm:text-lg mt-1 truncate" style={{ fontFamily: 'Georgia, serif' }}>
                {viajeActivo.titulo ?? 'Viaje del día'}
              </p>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 mt-1">
                <span><strong className="text-botella-800">{viajeActivo.paradas.filter(p => p.estado === 'VISITADA').length}</strong>/{viajeActivo.paradas.length} paradas</span>
                {viajeActivo.cargado && <span className="chip bg-emerald-100 text-emerald-700">📦 Cargado</span>}
              </div>
            </div>
            <span className="text-2xl text-botella-300 group-hover:text-botella-600 group-hover:translate-x-1 transition-all shrink-0">→</span>
          </div>
        </Link>
      )}

      {/* RESUMEN DE HOY */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-500">Hoy</h2>
          <Link to="/app/resumen" className="text-xs text-botella-700 font-bold hover:underline">Ver resumen →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Ventas</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1 leading-none">{resumenDia?.ventas ?? 0}</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-dorado-50 to-white border-dorado-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-dorado-700">Recaudado</p>
            <p className="text-xl sm:text-2xl font-black text-dorado-800 mt-1 leading-none">{fmtPlata(resumenDia?.recaudado ?? 0)}</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-botella-50 to-white border-botella-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-botella-700">Paradas</p>
            <p className="text-2xl sm:text-3xl font-black text-botella-900 mt-1 leading-none">{resumenDia?.paradas ?? 0}</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Entregado</p>
            <p className="text-2xl sm:text-3xl font-black text-blue-900 mt-1 leading-none">{resumenDia?.productosEntregados ?? 0} <span className="text-sm font-bold">u.</span></p>
          </div>
        </div>
      </section>

      {/* GRID 2/3 + 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recorrido del día */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-black text-gray-900 text-sm sm:text-base">Recorrido de hoy</h2>
              <p className="text-[11px] text-gray-500">{DIA_LABEL[dia]} · {clientesHoy.length} cliente{clientesHoy.length !== 1 ? 's' : ''}</p>
            </div>
            <Link to="/app/viajes" className="text-xs text-botella-700 font-bold hover:underline shrink-0">Ver todos →</Link>
          </div>
          {clientesHoy.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">Sin clientes asignados a {DIA_LABEL[dia].toLowerCase()}.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {clientesHoy.slice(0, 6).map(c => (
                <Link key={c.id} to={`/app/clientes/${c.id}`} className="flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 hover:bg-gray-50 transition">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900 truncate">{c.nombre}</p>
                    {c.direccion && <p className="text-[11px] text-gray-500 truncate">{c.direccion}</p>}
                  </div>
                  {c.zona && <span className="chip bg-dorado-100 text-dorado-800 shrink-0">{c.zona}</span>}
                </Link>
              ))}
              {clientesHoy.length > 6 && (
                <Link to="/app/viajes" className="block text-center text-xs text-botella-700 font-bold py-3 hover:bg-gray-50">
                  + {clientesHoy.length - 6} más → armar viaje
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Atajos + datos generales */}
        <div className="space-y-3">
          {/* Atajos */}
          <div className="card p-4">
            <h2 className="font-black text-gray-900 text-sm mb-3">Atajos</h2>
            <div className="grid grid-cols-1 gap-1.5">
              <Link to="/app/ventas/nueva" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-emerald-50 transition group">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-base group-hover:scale-110 transition">🛒</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Nueva venta</p>
                  <p className="text-[10px] text-gray-500">Descuenta stock</p>
                </div>
              </Link>
              <Link to="/app/clientes" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-botella-50 transition group">
                <div className="w-8 h-8 rounded-lg bg-botella-100 flex items-center justify-center text-base group-hover:scale-110 transition">👥</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Clientes</p>
                  <p className="text-[10px] text-gray-500">{stats.clientes} cargados</p>
                </div>
              </Link>
              <Link to="/app/vinos" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dorado-50 transition group">
                <div className="w-8 h-8 rounded-lg bg-dorado-100 flex items-center justify-center text-base group-hover:scale-110 transition">🍷</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Bodega</p>
                  <p className="text-[10px] text-gray-500">{stats.vinos} productos</p>
                </div>
                {stats.stockBajo > 0 && (
                  <span className="chip bg-red-100 text-red-700">{stats.stockBajo}</span>
                )}
              </Link>
            </div>
          </div>

          {/* Alerta de stock */}
          {stats.stockBajo > 0 && (
            <Link to="/app/vinos" className="block card p-3 bg-red-50 border-red-200 hover:bg-red-100 transition">
              <div className="flex items-center gap-2">
                <div className="text-xl">⚠</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-red-900">Stock crítico</p>
                  <p className="text-[10px] text-red-700">{stats.stockBajo} producto{stats.stockBajo !== 1 ? 's' : ''} para reponer</p>
                </div>
                <span className="text-red-600 font-bold">→</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
